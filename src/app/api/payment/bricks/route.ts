import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import PaymentLink from '@/models/PaymentLink';
import User from '@/models/User';
import { createPreference } from '@/lib/mercadopago/client';
import { decrypt } from '@/lib/crypto';
import { isRateLimited } from '@/lib/rateLimit';
import { getMpPublicKey } from '@/lib/mercadopago/getPublicKey';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const limited = await isRateLimited({ key: `bricks:${ip}`, limit: 20, windowSeconds: 60 });
  if (limited) {
    return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 });
  }

  const { slug } = await req.json();
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

  const merchant = await User.findById(link.merchantId).select('mpAccessToken mpPublicKey');
  if (!merchant?.mpAccessToken) {
    return NextResponse.json({ error: 'Este link no está disponible por ahora.' }, { status: 503 });
  }

  let publicKey: string | undefined = merchant.mpPublicKey;
  if (!publicKey) {
    publicKey = await getMpPublicKey(decrypt(merchant.mpAccessToken)) ?? undefined;
    if (publicKey) {
      await User.findByIdAndUpdate(link.merchantId, { $set: { mpPublicKey: publicKey } });
    } else {
      return NextResponse.json({ error: 'Este link no está disponible por ahora.' }, { status: 503 });
    }
  }

  try {
    const preference = await createPreference({
      title: link.title,
      amount: link.amount,
      currency: link.currency,
      slug: link.slug,
      linkId: link._id.toString(),
      accessToken: decrypt(merchant.mpAccessToken),
    });

    if (!preference.id) {
      return NextResponse.json({ error: 'No se pudo crear la preferencia de pago.' }, { status: 502 });
    }

    return NextResponse.json({
      preferenceId: preference.id,
      publicKey,
      amount: link.amount,
    });
  } catch (err) {
    console.error('Bricks preference error:', err);
    return NextResponse.json({ error: 'Error al conectar con MercadoPago.' }, { status: 502 });
  }
}
