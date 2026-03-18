import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import { z } from 'zod';
import { isRateLimited } from '@/lib/rateLimit';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
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
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
