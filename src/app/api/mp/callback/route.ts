/**
 * GET /api/mp/callback?code=...&state=...
 *
 * MercadoPago redirige aquí después de que el vendedor autoriza la app.
 * 1. Valida el parámetro `state` contra la cookie (anti-CSRF).
 * 2. Extrae el userId del state.
 * 3. Intercambia el code por access_token + refresh_token.
 * 4. Redirige al usuario a /settings con feedback visual.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForTokens } from '@/lib/mp/oauth';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const stateFromMp = searchParams.get('state');
  const errorParam = searchParams.get('error');

  const redirectBase = `${process.env.NEXT_PUBLIC_APP_URL}/settings`;

  // El vendedor canceló la autorización en MP
  if (errorParam) {
    return NextResponse.redirect(`${redirectBase}?mp=cancelled`);
  }

  if (!code || !stateFromMp) {
    return NextResponse.redirect(`${redirectBase}?mp=error`);
  }

  // ── Verificar state anti-CSRF ──────────────────────────────────────────────
  const cookieStore = await cookies();
  const savedState = cookieStore.get('mp_oauth_state')?.value;

  if (!savedState || savedState !== stateFromMp) {
    console.error('[MP OAuth callback] State mismatch. savedState:', savedState, 'stateFromMp:', stateFromMp);
    return NextResponse.redirect(`${redirectBase}?mp=error&reason=state_mismatch`);
  }

  // ── Leer code_verifier (PKCE) ─────────────────────────────────────────────
  const codeVerifier = cookieStore.get('mp_oauth_verifier')?.value;
  if (!codeVerifier) {
    console.error('[MP OAuth callback] Missing code_verifier cookie');
    return NextResponse.redirect(`${redirectBase}?mp=error&reason=missing_verifier`);
  }

  // Limpiar ambas cookies en la respuesta
  const clearCookies = (res: NextResponse) => {
    res.cookies.set('mp_oauth_state', '', { maxAge: 0, path: '/' });
    res.cookies.set('mp_oauth_verifier', '', { maxAge: 0, path: '/' });
    return res;
  };

  // ── Extraer userId del state (formato: "userId:nonce") ────────────────────
  const userId = stateFromMp.split(':')[0];
  if (!userId) {
    return clearCookies(NextResponse.redirect(`${redirectBase}?mp=error&reason=no_user`));
  }

  // ── Intercambiar code por tokens ──────────────────────────────────────────
  try {
    await exchangeCodeForTokens(userId, code, codeVerifier);
    return clearCookies(NextResponse.redirect(`${redirectBase}?mp=connected`));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[MP OAuth callback] Token exchange failed:', msg);
    const reason = encodeURIComponent(msg.slice(0, 80));
    return clearCookies(NextResponse.redirect(`${redirectBase}?mp=error&reason=${reason}`));
  }
}
