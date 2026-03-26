import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import connectDB from '@/lib/db/mongoose';
import PaymentLink from '@/models/PaymentLink';
import User from '@/models/User';
import { getValidAccessToken } from '@/lib/mp/oauth';
import { isRateLimited } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const limited = await isRateLimited({ key: `process:${ip}`, limit: 10, windowSeconds: 60 });
  if (limited) {
    return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 });
  }

  const { slug, formData } = await req.json();
  if (!slug || !formData) {
    return NextResponse.json({ error: 'Datos requeridos' }, { status: 400 });
  }

  await connectDB();

  const link = await PaymentLink.findOne({ slug, isActive: true });
  if (!link) return NextResponse.json({ error: 'Link no encontrado' }, { status: 404 });

  const merchant = await User.findById(link.merchantId).select('mpAccessToken');
  if (!merchant?.mpAccessToken) {
    return NextResponse.json({ error: 'Este link no está disponible.' }, { status: 503 });
  }

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(String(link.merchantId));
  } catch {
    return NextResponse.json({ error: 'Este link no está disponible.' }, { status: 503 });
  }

  try {
    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const result = await payment.create({
      body: {
        ...formData,
        external_reference: link._id.toString(),
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
      },
    });

    if (result.status === 'approved') {
      return NextResponse.json({ status: 'approved', redirectUrl: `${appUrl}/pay/${slug}/success` });
    }
    if (result.status === 'in_process' || result.status === 'pending') {
      return NextResponse.json({ status: 'pending', redirectUrl: `${appUrl}/pay/${slug}/success?pending=true` });
    }

    return NextResponse.json({ status: result.status, statusDetail: result.status_detail });
  } catch (err) {
    console.error('Payment process error:', err);
    return NextResponse.json({ error: 'Error al procesar el pago.' }, { status: 502 });
  }
}
