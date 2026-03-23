import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import EmailVerificationToken from '@/models/EmailVerificationToken';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=token_invalido', req.url));
  }

  await connectDB();

  const record = await EmailVerificationToken.findOne({ token });
  if (!record || record.expiresAt < new Date()) {
    return NextResponse.redirect(new URL('/login?error=token_expirado', req.url));
  }

  await User.findOneAndUpdate({ email: record.email }, { $set: { emailVerified: true } });
  await EmailVerificationToken.deleteOne({ token });

  return NextResponse.redirect(new URL('/login?verified=1', req.url));
}
