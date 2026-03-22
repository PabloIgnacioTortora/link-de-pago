import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const token = session.user;

  await connectDB();
  const user = await User.findById(token.id).select('mpSubscriptionId');

  if (!user?.mpSubscriptionId) {
    return NextResponse.json({ error: 'No hay suscripción activa' }, { status: 400 });
  }

  const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
  const preapproval = new PreApproval(client);

  await preapproval.update({
    id: user.mpSubscriptionId,
    body: { status: 'cancelled' },
  });

  await User.findByIdAndUpdate(token.id, {
    $set: { plan: 'free', mpSubscriptionId: undefined, planExpiresAt: undefined },
  });

  return NextResponse.json({ success: true });
}
