import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import EmailVerificationToken from '@/models/EmailVerificationToken';
import { sendVerificationEmail } from '@/lib/email/mailer';
import { z } from 'zod';
import { isRateLimited } from '@/lib/rateLimit';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const limited = await isRateLimited({ key: `register:${ip}`, limit: 5, windowSeconds: 3600 });
  if (limited) {
    return NextResponse.json({ error: 'Demasiados intentos. Esperá un momento.' }, { status: 429 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  await connectDB();

  const exists = await User.findOne({ email: parsed.data.email });
  if (exists) {
    return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

  await User.create({
    name: parsed.data.name,
    email: parsed.data.email,
    password: hashedPassword,
    provider: 'credentials',
    emailVerified: false,
  });

  // Generar y enviar token de verificación
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await EmailVerificationToken.create({ email: parsed.data.email, token, expiresAt });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  await sendVerificationEmail({
    to: parsed.data.email,
    verifyUrl: `${appUrl}/api/auth/verify-email?token=${token}`,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
