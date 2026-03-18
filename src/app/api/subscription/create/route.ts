import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { PRO_PRICE_ARS } from '@/lib/plans';

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  if (token.plan === 'pro') {
    return NextResponse.json({ error: 'Ya tenés el plan Pro activo' }, { status: 400 });
  }

  const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
  const preapproval = new PreApproval(client);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  try {
    const result = await preapproval.create({
      body: {
        reason: 'LinkPago Pro — Mensual',
        payer_email: token.email as string,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: PRO_PRICE_ARS,
          currency_id: 'ARS',
        },
        back_url: `${appUrl}/dashboard?subscription=success`,
        status: 'pending',
      },
    });

    return NextResponse.json({ initPoint: result.init_point });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al crear suscripción';
    console.error('[subscription/create]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
