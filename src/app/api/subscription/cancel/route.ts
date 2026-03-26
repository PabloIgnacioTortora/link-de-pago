import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import { checkOrigin } from '@/lib/csrf';

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 });
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  if (session.user.plan !== 'pro') {
    return NextResponse.json({ error: 'No tenés un plan Pro activo' }, { status: 400 });
  }

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, {
    $set: { plan: 'free', planExpiresAt: undefined, mpSubscriptionId: undefined },
  });

  return NextResponse.json({ success: true });
}
