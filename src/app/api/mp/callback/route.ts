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

  // Limpiar cookie en la respuesta
  const clearCookie = (res: NextResponse) => {
    res.cookies.set('mp_oauth_state', '', { maxAge: 0, path: '/' });
    return res;
  };

  // ── Extraer userId del state (formato: "userId:nonce") ────────────────────
  const userId = stateFromMp.split(':')[0];
  if (!userId) {
    return clearCookie(NextResponse.redirect(`${redirectBase}?mp=error&reason=no_user`));
  }

  // ── Intercambiar code por tokens ──────────────────────────────────────────
  try {
    await exchangeCodeForTokens(userId, code);
    return clearCookie(NextResponse.redirect(`${redirectBase}?mp=connected`));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[MP OAuth callback] Token exchange failed:', msg);
    // Pasamos los primeros 80 chars del error en la URL para debuggear sin ir a logs
    const reason = encodeURIComponent(msg.slice(0, 80));
    return clearCookie(NextResponse.redirect(`${redirectBase}?mp=error&reason=${reason}`));
  }
}
