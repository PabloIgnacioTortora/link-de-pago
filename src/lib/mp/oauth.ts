/**
 * MercadoPago Connect — OAuth 2.0 helper
 *
 * Flujo:
 *  1. getAuthorizationUrl()  → Redirige al vendedor a MP para autorizar
 *  2. exchangeCodeForTokens() → Intercambia el code del callback por tokens
 *  3. getValidAccessToken()   → Devuelve un access_token válido (renueva si venció)
 */

import { encrypt, decrypt } from '@/lib/crypto';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import { getMpPublicKey } from '@/lib/mercadopago/getPublicKey';

const MP_OAUTH_URL = 'https://auth.mercadopago.com.ar/authorization';
const MP_TOKEN_URL = 'https://api.mercadopago.com/oauth/token';

// 15 minutos antes del vencimiento real renovamos proactivamente
const REFRESH_BUFFER_MS = 15 * 60 * 1000;

// ─── Paso 1: Generar URL de autorización ──────────────────────────────────────

/**
 * Genera la URL a la que hay que redirigir al vendedor.
 * El parámetro `state` lleva el userId de tu plataforma + un nonce random
 * para prevenir CSRF. Guardalo en la sesión antes de redirigir.
 */
export function getAuthorizationUrl(userId: string): { url: string; state: string } {
  const clientId = process.env.MP_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/mp/callback`;

  // state = userId:randomNonce  (firmado por nosotros, no por MP)
  const nonce = crypto.randomUUID();
  const state = `${userId}:${nonce}`;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    state,
  });

  return { url: `${MP_OAUTH_URL}?${params.toString()}`, state };
}

// ─── Paso 2: Intercambiar code por tokens ─────────────────────────────────────

interface MpTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;   // segundos hasta que vence (normalmente 15552000 = 180 días)
  scope: string;
  user_id: number;      // MP user id del vendedor
  public_key?: string;  // Algunos flujos devuelven la public key directamente
}

/**
 * Llama a POST /oauth/token para intercambiar el authorization_code por tokens.
 * Guarda access_token + refresh_token encriptados en la DB del usuario.
 */
export async function exchangeCodeForTokens(
  userId: string,
  code: string
): Promise<void> {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/mp/callback`;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.MP_CLIENT_ID!,
    client_secret: process.env.MP_CLIENT_SECRET!,
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(MP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`MP token exchange failed: ${JSON.stringify(err)}`);
  }

  const data: MpTokenResponse = await res.json();

  // Calcular fecha de vencimiento real (expires_in está en segundos)
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  // Obtener public_key: viene en la respuesta del token o la derivamos con /users/me
  const publicKey = data.public_key || (await getMpPublicKey(data.access_token));

  await connectDB();
  await User.findByIdAndUpdate(userId, {
    mpAccessToken: encrypt(data.access_token),
    mpRefreshToken: encrypt(data.refresh_token),
    mpTokenExpiresAt: expiresAt,
    mpUserId: String(data.user_id),
    ...(publicKey ? { mpPublicKey: publicKey } : {}),
  });
}

// ─── Paso 3: Obtener access_token válido (con auto-refresh) ───────────────────

/**
 * Devuelve siempre un access_token desencriptado y vigente.
 * Si el token está por vencer (< 15 min), lo renueva automáticamente antes.
 *
 * Uso: en cualquier route que necesite llamar a la API de MP con el token
 * del vendedor, reemplazá `decrypt(user.mpAccessToken)` por esta función.
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  await connectDB();
  const user = await User.findById(userId).select(
    'mpAccessToken mpRefreshToken mpTokenExpiresAt'
  );

  if (!user?.mpAccessToken) {
    throw new Error('Usuario sin MercadoPago conectado.');
  }

  // Token legacy (pegado a mano, sin fecha de vencimiento ni refresh_token):
  // se devuelve directo sin intentar renovar.
  if (!user.mpRefreshToken || !user.mpTokenExpiresAt) {
    return decrypt(user.mpAccessToken);
  }

  const expiresAt = user.mpTokenExpiresAt.getTime();
  const needsRefresh = Date.now() >= expiresAt - REFRESH_BUFFER_MS;

  if (!needsRefresh) {
    return decrypt(user.mpAccessToken);
  }

  // Token OAuth próximo a vencer → renovar con refresh_token

  return refreshAccessToken(userId, decrypt(user.mpRefreshToken));
}

// ─── Paso 3b: Renovar usando refresh_token ────────────────────────────────────

async function refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.MP_CLIENT_ID!,
    client_secret: process.env.MP_CLIENT_SECRET!,
    refresh_token: refreshToken,
  });

  const res = await fetch(MP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`MP token refresh failed: ${JSON.stringify(err)}`);
  }

  const data: MpTokenResponse = await res.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  // MP devuelve un nuevo par access_token + refresh_token — actualizamos ambos
  await User.findByIdAndUpdate(userId, {
    mpAccessToken: encrypt(data.access_token),
    mpRefreshToken: encrypt(data.refresh_token),
    mpTokenExpiresAt: expiresAt,
  });

  return data.access_token;
}

// ─── Desconectar MP ───────────────────────────────────────────────────────────

/**
 * Limpia los tokens del usuario (cuando hace "Desconectar MercadoPago").
 */
export async function disconnectMp(userId: string): Promise<void> {
  await connectDB();
  await User.findByIdAndUpdate(userId, {
    $unset: {
      mpAccessToken: '',
      mpRefreshToken: '',
      mpTokenExpiresAt: '',
      mpUserId: '',
      mpPublicKey: '',
    },
  });
}
