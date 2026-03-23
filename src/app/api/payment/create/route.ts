import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import PaymentLink from '@/models/PaymentLink';
import User from '@/models/User';
import { createPreference } from '@/lib/mercadopago/client';
import { decrypt } from '@/lib/crypto';
import { isRateLimited } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const limited = await isRateLimited({ key: `payment:${ip}`, limit: 20, windowSeconds: 60 });
  if (limited) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Esperá un momento.' }, { status: 429 });
  }

  const { slug } = await req.json();

  if (!slug) return NextResponse.json({ error: 'slug requerido' }, { status: 400 });

  await connectDB();

  const link = await PaymentLink.findOne({ slug, isActive: true });
  if (!link) return NextResponse.json({ error: 'Link no encontrado o inactivo' }, { status: 404 });

  // Check expiry
  if (link.expiresAt && new Date() > link.expiresAt) {
    return NextResponse.json({ error: 'Este link ha expirado' }, { status: 410 });
  }

  // Check max payments
  if (link.maxPayments && link.paymentCount >= link.maxPayments) {
    return NextResponse.json({ error: 'Este link ya alcanzó el límite de pagos' }, { status: 410 });
  }

  const merchant = await User.findById(link.merchantId).select('mpAccessToken');

  if (!merchant?.mpAccessToken) {
    return NextResponse.json(
      { error: 'Este comercio no tiene MercadoPago configurado aún.' },
      { status: 503 }
    );
  }

  const preference = await createPreference({
    title: link.title,
    amount: link.amount,
    currency: link.currency,
    slug: link.slug,
    linkId: link._id.toString(),
    accessToken: decrypt(merchant.mpAccessToken),
  });

  return NextResponse.json({ initPoint: preference.init_point });
}
