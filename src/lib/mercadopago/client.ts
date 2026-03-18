import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

function getMPClient(accessToken?: string) {
  return new MercadoPagoConfig({
    accessToken: accessToken ?? process.env.MP_ACCESS_TOKEN!,
  });
}

export interface CreatePreferenceParams {
  title: string;
  amount: number;
  currency: string;
  slug: string;
  linkId: string;
  accessToken?: string;
}

export async function createPreference({
  title,
  amount,
  currency,
  slug,
  linkId,
  accessToken,
}: CreatePreferenceParams) {
  const client = getMPClient(accessToken);
  const preference = new Preference(client);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const result = await preference.create({
    body: {
      items: [
        {
          id: linkId,
          title,
          quantity: 1,
          unit_price: amount,
          currency_id: currency,
        },
      ],
      back_urls: {
        success: `${appUrl}/pay/${slug}/success`,
        failure: `${appUrl}/pay/${slug}?error=true`,
        pending: `${appUrl}/pay/${slug}/success`,
      },
      auto_return: 'approved',
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      external_reference: linkId,
    },
  });

  return result;
}

export async function getPayment(paymentId: string, accessToken?: string) {
  const client = getMPClient(accessToken);
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}
