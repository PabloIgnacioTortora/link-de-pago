import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import { z } from 'zod';
import { encrypt } from '@/lib/crypto';

const schema = z.object({
  businessName: z.string().max(100).optional(),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  mpAccessToken: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectDB();

  const update: Record<string, string> = {};
  if (parsed.data.businessName !== undefined) update.businessName = parsed.data.businessName;
  if (parsed.data.brandColor) update.brandColor = parsed.data.brandColor;
  if (parsed.data.mpAccessToken) update.mpAccessToken = encrypt(parsed.data.mpAccessToken);

  await User.findByIdAndUpdate(token.id, { $set: update });

  return NextResponse.json({ success: true });
}
