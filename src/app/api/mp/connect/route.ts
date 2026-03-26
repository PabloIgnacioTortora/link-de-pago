/**
 * GET /api/mp/connect
 *
 * Inicia el flujo OAuth de MercadoPago Connect.
 * Guarda el `state` en una cookie httpOnly para verificarlo en el callback.
 * Redirige al vendedor a la pantalla de autorización de MP.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAuthorizationUrl } from '@/lib/mp/oauth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { url, state, codeVerifier } = getAuthorizationUrl(session.user.id);

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 10,
    path: '/',
  };

  const response = NextResponse.redirect(url);
  response.cookies.set('mp_oauth_state', state, cookieOpts);
  response.cookies.set('mp_oauth_verifier', codeVerifier, cookieOpts);

  return response;
}
