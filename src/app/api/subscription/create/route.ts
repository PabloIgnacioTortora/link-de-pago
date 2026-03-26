import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { PRO_PRICE_ARS } from '@/lib/plans';
import { checkOrigin } from '@/lib/csrf';

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 });
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  if (session.user.plan === 'pro') {
    return NextResponse.json({ error: 'Ya tenés el plan Pro activo' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const accessToken = process.env.MP_ACCESS_TOKEN!;
  const isSandbox = accessToken.startsWith('TEST-');

  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  try {
    const result = await preference.create({
      body: {
        items: [
          {
            id: 'linkpago-pro',
            title: 'LinkPago Pro — Mensual',
            quantity: 1,
            unit_price: PRO_PRICE_ARS,
            currency_id: 'ARS',
          },
        ],
        payer: { email: session.user.email as string },
        back_urls: {
          success: `${appUrl}/dashboard?subscription=success`,
          failure: `${appUrl}/dashboard?subscription=failure`,
          pending: `${appUrl}/dashboard?subscription=pending`,
        },
        auto_return: 'approved',
        external_reference: `sub_pro_${session.user.id}`,
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
      },
    });

    const initPoint = isSandbox
      ? (result.sandbox_init_point ?? result.init_point)
      : result.init_point;

    return NextResponse.json({ initPoint });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al crear suscripción';
    console.error('[subscription/create]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
