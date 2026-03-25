import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import PaymentLink from '@/models/PaymentLink';
import Transaction from '@/models/Transaction';
import { isRateLimited } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const limited = await isRateLimited({ key: `transfer:${ip}`, limit: 10, windowSeconds: 60 });
  if (limited) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Esperá un momento.' }, { status: 429 });
  }

  const { slug, payerName, payerEmail } = await req.json();
  if (!slug) return NextResponse.json({ error: 'slug requerido' }, { status: 400 });

  await connectDB();

  const link = await PaymentLink.findOne({ slug, isActive: true });
  if (!link) return NextResponse.json({ error: 'Link no encontrado o inactivo' }, { status: 404 });

  if (link.expiresAt && new Date() > link.expiresAt) {
    return NextResponse.json({ error: 'Este link ha expirado' }, { status: 410 });
  }

  if (link.maxPayments && link.paymentCount >= link.maxPayments) {
    return NextResponse.json({ error: 'Este link ya alcanzó el límite de pagos' }, { status: 410 });
  }

  const transferId = `transfer_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  await Transaction.create({
    paymentLinkId: link._id,
    merchantId: link.merchantId,
    mpPaymentId: transferId,
    paymentType: 'transfer',
    amount: link.amount,
    currency: link.currency,
    status: 'pending',
    statusDetail: 'transfer_pending',
    payerName: payerName ?? '',
    payerEmail: payerEmail ?? '',
    paymentMethod: 'bank_transfer',
  });

  return NextResponse.json({ success: true, transferId });
}
