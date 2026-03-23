import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import { z } from 'zod';
import { encrypt } from '@/lib/crypto';
import { checkOrigin } from '@/lib/csrf';

const schema = z.object({
  businessName: z.string().max(100).optional(),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  mpAccessToken: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  if (!checkOrigin(req)) return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 });
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectDB();

  const isPro = session.user.plan === 'pro';
  const update: Record<string, string> = {};

  // Campos exclusivos de plan Pro
  if (parsed.data.businessName !== undefined) {
    if (!isPro) return NextResponse.json({ error: 'Requiere plan Pro' }, { status: 403 });
    update.businessName = parsed.data.businessName;
  }
  if (parsed.data.brandColor) {
    if (!isPro) return NextResponse.json({ error: 'Requiere plan Pro' }, { status: 403 });
    update.brandColor = parsed.data.brandColor;
  }
  if (parsed.data.mpAccessToken) update.mpAccessToken = encrypt(parsed.data.mpAccessToken);

  await User.findByIdAndUpdate(session.user.id, { $set: update });

  return NextResponse.json({ success: true });
}
