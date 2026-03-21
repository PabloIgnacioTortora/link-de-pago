import { Resend } from 'resend';

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

interface SendPaymentEmailParams {
  to: string;
  merchantName: string;
  payerName?: string;
  amount: number;
  currency: string;
  linkTitle: string;
  paymentId: string;
}

export async function sendPasswordResetEmail({ to, resetUrl }: { to: string; resetUrl: string }) {
  const resend = getResend();
  if (!resend) {
    console.error('[mailer] RESEND_API_KEY not set');
    return;
  }

  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'LinkPago <onboarding@resend.dev>',
    to,
    subject: 'Restablecer contraseña — LinkPago',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#6366f1">Restablecer contraseña</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Hacé clic en el siguiente botón para crear una nueva contraseña. El link expira en <strong>1 hora</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#6366f1;color:white;border-radius:8px;text-decoration:none;font-weight:600">
          Restablecer contraseña
        </a>
        <p style="color:#6b7280;font-size:14px">Si no solicitaste esto, podés ignorar este email.</p>
      </div>
    `,
  });
  console.log('[mailer] Password reset email result:', JSON.stringify(result));
}

export async function sendPaymentConfirmationEmail({
  to,
  merchantName,
  payerName,
  amount,
  currency,
  linkTitle,
  paymentId,
}: SendPaymentEmailParams) {
  const formatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
  }).format(amount);

  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'LinkPago <onboarding@resend.dev>',
    to,
    subject: `✅ Nuevo pago recibido — ${formatted}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#6366f1">¡Recibiste un pago!</h2>
        <p>Hola <strong>${merchantName}</strong>,</p>
        <p><strong>${payerName ?? 'Un cliente'}</strong> realizó un pago por tu link <em>${linkTitle}</em>.</p>
        <table style="border-collapse:collapse;width:100%;margin:20px 0">
          <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Monto</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${formatted}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>ID de pago</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${paymentId}</td></tr>
        </table>
        <p style="color:#6b7280;font-size:14px">Este es un mensaje automático de LinkPago.</p>
      </div>
    `,
  });
}
