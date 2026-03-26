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

  const { url, state } = getAuthorizationUrl(session.user.id);

  // La cookie se setea sobre el mismo objeto response del redirect,
  // de lo contrario Next.js no la incluye en los headers de la respuesta.
  const response = NextResponse.redirect(url);
  response.cookies.set('mp_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  });

  return response;
}
