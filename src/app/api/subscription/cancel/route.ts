import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';

export async function POST() {
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
