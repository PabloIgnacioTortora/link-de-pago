import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  await connectDB();

  const record = await PasswordResetToken.findOne({ token });
  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: 'El link expiró o es inválido' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);
  await User.findOneAndUpdate({ email: record.email }, { $set: { password: hashed } });
  await PasswordResetToken.deleteOne({ token });

  return NextResponse.json({ ok: true });
}
