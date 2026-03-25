import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import PaymentLink from '@/models/PaymentLink';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { getPayment } from '@/lib/mercadopago/client';
import { sendPaymentConfirmationEmail } from '@/lib/email/mailer';
import { verifyMercadoPagoSignature } from '@/lib/mercadopago/verifyWebhook';
import { decrypt } from '@/lib/crypto';
import mongoose from 'mongoose';


export async function POST(req: NextRequest) {
  const body = await req.json();

  // Verificar firma antes de procesar cualquier evento
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[webhook] MP_WEBHOOK_SECRET no configurado — rechazando request');
    return NextResponse.json({ error: 'Webhook no configurado' }, { status: 500 });
  }
  const dataId = String(body.data?.id ?? '');
  if (dataId) {
    const valid = verifyMercadoPagoSignature({
      xSignature: req.headers.get('x-signature'),
      xRequestId: req.headers.get('x-request-id'),
      dataId,
      secret: webhookSecret,
    });
    if (!valid) {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
    }
  }

  // Only process payment notifications
  if (body.type !== 'payment' || !body.data?.id) {
    return NextResponse.json({ received: true });
  }

  const paymentId = String(body.data.id);

  try {
    await connectDB();

    // Idempotency check
    const existing = await Transaction.findOne({ mpPaymentId: paymentId });
    if (existing && existing.status === 'approved') {
      return NextResponse.json({ received: true });
    }

    // Fetch the link first to get the merchant's access token
    // We need the external_reference from the payment, but to fetch the payment
    // we might need the merchant token. Use platform token for the first fetch,
    // then re-fetch with merchant token if needed.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paymentPlatform: any = await getPayment(paymentId);
    const externalRef = paymentPlatform.external_reference as string | undefined;
    if (!externalRef) return NextResponse.json({ received: true });

    // Manejar pago de plan Pro
    if (externalRef.startsWith('sub_pro_')) {
      if (paymentPlatform.status === 'approved') {
        const userId = externalRef.slice('sub_pro_'.length);
        const planExpiresAt = new Date();
        planExpiresAt.setMonth(planExpiresAt.getMonth() + 1);
        await User.findByIdAndUpdate(userId, {
          $set: { plan: 'pro', planExpiresAt },
        });
        console.log('[webhook] Plan Pro activado para usuario:', userId);
      }
      return NextResponse.json({ received: true });
    }

    const linkId = externalRef;
    if (!mongoose.isValidObjectId(linkId)) {
      console.error('[webhook] external_reference inválido:', linkId);
      return NextResponse.json({ received: true });
    }
    const link = await PaymentLink.findById(linkId);
    if (!link) return NextResponse.json({ received: true });

    // Fetch merchant to get their custom MP token (if any)
    const merchant = await User.findById(link.merchantId).select('email name businessName mpAccessToken plan');

    // Re-fetch payment with merchant token if they have one, so we get accurate data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payment: any = merchant?.mpAccessToken
      ? await getPayment(paymentId, decrypt(merchant.mpAccessToken))
      : paymentPlatform;

    const status = payment.status as 'pending' | 'approved' | 'rejected' | 'cancelled';

    // Upsert transaction
    await Transaction.findOneAndUpdate(
      { mpPaymentId: paymentId },
      {
        $set: {
          paymentLinkId: link._id,
          merchantId: link.merchantId,
          mpPaymentId: paymentId,
          mpPreferenceId: payment.preference_id ?? '',
          amount: payment.transaction_amount ?? link.amount,
          currency: payment.currency_id ?? link.currency,
          status,
          statusDetail: payment.status_detail ?? '',
          payerEmail: payment.payer?.email ?? '',
          payerName: `${payment.payer?.first_name ?? ''} ${payment.payer?.last_name ?? ''}`.trim(),
          paymentMethod: payment.payment_type_id ?? '',
        },
      },
      { upsert: true, new: true }
    );

    if (status === 'approved') {
      // Increment link stats atomically
      await PaymentLink.findByIdAndUpdate(linkId, {
        $inc: { totalCollected: payment.transaction_amount ?? 0, paymentCount: 1 },
      });

      if (merchant && merchant.plan === 'pro') {
        await sendPaymentConfirmationEmail({
          to: merchant.email,
          merchantName: merchant.businessName ?? merchant.name,
          payerName: `${payment.payer?.first_name ?? ''} ${payment.payer?.last_name ?? ''}`.trim() || undefined,
          amount: payment.transaction_amount ?? link.amount,
          currency: payment.currency_id ?? link.currency,
          linkTitle: link.title,
          paymentId,
        });

        await Transaction.findOneAndUpdate(
          { mpPaymentId: paymentId },
          { $set: { notificationSentAt: new Date() } }
        );
      }
    }
  } catch (err) {
    console.error('[webhook] Error inesperado procesando pago:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
