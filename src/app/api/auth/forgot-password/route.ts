import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';
import { sendPasswordResetEmail } from '@/lib/email/mailer';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });

  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase() });

  // Siempre responder OK para no revelar si el email existe
  if (!user || user.provider !== 'credentials') {
    return NextResponse.json({ ok: true });
  }

  // Eliminar tokens previos del mismo email
  await PasswordResetToken.deleteMany({ email: email.toLowerCase() });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await PasswordResetToken.create({ email: email.toLowerCase(), token, expiresAt });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  await sendPasswordResetEmail({ to: email.toLowerCase(), resetUrl });

  return NextResponse.json({ ok: true });
}
