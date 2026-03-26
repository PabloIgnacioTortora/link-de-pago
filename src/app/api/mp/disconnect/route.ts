/**
 * POST /api/mp/disconnect
 *
 * Desconecta la cuenta de MercadoPago del vendedor:
 * borra access_token, refresh_token y public_key de la DB.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkOrigin } from '@/lib/csrf';
import { disconnectMp } from '@/lib/mp/oauth';

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  await disconnectMp(session.user.id);
  return NextResponse.json({ ok: true });
}
