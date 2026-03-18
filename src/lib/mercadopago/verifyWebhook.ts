import { createHmac } from 'crypto';

/**
 * Verifica la firma del webhook de MercadoPago.
 * Docs: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 *
 * El header x-signature tiene el formato: ts=<timestamp>,v1=<hash>
 * El manifest firmado es: id:<data_id>;request-id:<x_request_id>;ts:<timestamp>
 */
export function verifyMercadoPagoSignature({
  xSignature,
  xRequestId,
  dataId,
  secret,
}: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
  secret: string;
}): boolean {
  if (!xSignature) return false;

  // Parsear ts y v1 del header
  const parts = Object.fromEntries(
    xSignature.split(',').map((part) => part.split('=') as [string, string])
  );
  const ts = parts['ts'];
  const v1 = parts['v1'];
  if (!ts || !v1) return false;

  // Construir el manifest
  const manifest = [
    `id:${dataId}`,
    xRequestId ? `request-id:${xRequestId}` : null,
    `ts:${ts}`,
  ]
    .filter(Boolean)
    .join(';');

  const expected = createHmac('sha256', secret).update(manifest).digest('hex');

  return expected === v1;
}
