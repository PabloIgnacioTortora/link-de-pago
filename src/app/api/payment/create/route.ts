import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import PaymentLink from '@/models/PaymentLink';
import User from '@/models/User';
import { createPreference } from '@/lib/mercadopago/client';

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: 'Este link no está disponible por ahora.' }, { status: 503 });
  }

  try {
    const preference = await createPreference({
      title: link.title,
      amount: link.amount,
      currency: link.currency,
      slug: link.slug,
      linkId: link._id.toString(),
      accessToken: merchant.mpAccessToken,
    });

    if (!preference.init_point) {
      return NextResponse.json({ error: 'No se pudo generar el link de pago' }, { status: 502 });
    }

    return NextResponse.json({ initPoint: preference.init_point });
  } catch (err) {
    console.error('MercadoPago error:', err);
    return NextResponse.json({ error: 'Error al conectar con MercadoPago. Verificá tu Access Token en Ajustes.' }, { status: 502 });
  }
}
