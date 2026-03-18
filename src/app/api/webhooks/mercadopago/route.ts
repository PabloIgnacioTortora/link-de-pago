import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import PaymentLink from '@/models/PaymentLink';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { getPayment } from '@/lib/mercadopago/client';
import { sendPaymentConfirmationEmail } from '@/lib/email/mailer';
import { verifyMercadoPagoSignature } from '@/lib/mercadopago/verifyWebhook';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Only process payment notifications
  if (body.type !== 'payment' || !body.data?.id) {
    return NextResponse.json({ received: true });
  }

  const paymentId = String(body.data.id);

  // Verificar firma si el secret está configurado
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;
  if (webhookSecret) {
    const valid = verifyMercadoPagoSignature({
      xSignature: req.headers.get('x-signature'),
      xRequestId: req.headers.get('x-request-id'),
      dataId: paymentId,
      secret: webhookSecret,
    });
    if (!valid) {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
    }
  }

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
    const linkId = paymentPlatform.external_reference;
    if (!linkId) return NextResponse.json({ received: true });

    const link = await PaymentLink.findById(linkId);
    if (!link) return NextResponse.json({ received: true });

    // Fetch merchant to get their custom MP token (if any)
    const merchant = await User.findById(link.merchantId).select('email name businessName mpAccessToken');

    // Re-fetch payment with merchant token if they have one, so we get accurate data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payment: any = merchant?.mpAccessToken
      ? await getPayment(paymentId, merchant.mpAccessToken)
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

      if (merchant) {
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
    console.error('Webhook error:', err);
    // Return 200 anyway so MP doesn't retry indefinitely
  }

  return NextResponse.json({ received: true });
}
