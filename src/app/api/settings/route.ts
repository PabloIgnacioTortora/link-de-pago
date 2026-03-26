import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import { z } from 'zod';
import { encrypt, decrypt } from '@/lib/crypto';
import { checkOrigin } from '@/lib/csrf';
import { getMpPublicKey } from '@/lib/mercadopago/getPublicKey';

const schema = z.object({
  businessName: z.string().max(100).optional(),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  mpAccessToken: z.string().optional(),
  mpPublicKey: z.string().optional(),
  transferCbu: z.string().max(22).optional(),
  transferAlias: z.string().max(50).optional(),
  transferHolder: z.string().max(100).optional(),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.user.id).select('businessName brandColor mpAccessToken transferCbu transferAlias transferHolder');
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  return NextResponse.json({
    businessName: user.businessName ?? '',
    brandColor: user.brandColor ?? '#6366f1',
    hasMpToken: !!user.mpAccessToken,
    hasMpPublicKey: !!user.mpPublicKey,
    transferCbu: user.transferCbu ?? '',
    transferAlias: user.transferAlias ?? '',
    transferHolder: user.transferHolder ?? '',
  });
}

export async function PATCH(req: NextRequest) {
  if (!checkOrigin(req)) return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 });
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  await connectDB();

  const isPro = session.user.plan === 'pro';
  const update: Record<string, string> = {};

  // Campos exclusivos de plan Pro — se ignoran silenciosamente para usuarios free
  if (parsed.data.businessName && isPro) update.businessName = parsed.data.businessName;
  if (parsed.data.brandColor && isPro) update.brandColor = parsed.data.brandColor;
  if (parsed.data.mpAccessToken) {
    update.mpAccessToken = encrypt(parsed.data.mpAccessToken);
    // Intentar derivar la public key automáticamente si el usuario no la proporcionó
    if (!parsed.data.mpPublicKey) {
      const publicKey = await getMpPublicKey(parsed.data.mpAccessToken);
      if (publicKey) update.mpPublicKey = publicKey;
    }
  }
  if (parsed.data.mpPublicKey) {
    update.mpPublicKey = parsed.data.mpPublicKey;
  }
  if (parsed.data.transferCbu !== undefined) update.transferCbu = parsed.data.transferCbu;
  if (parsed.data.transferAlias !== undefined) update.transferAlias = parsed.data.transferAlias;
  if (parsed.data.transferHolder !== undefined) update.transferHolder = parsed.data.transferHolder;

  await User.findByIdAndUpdate(session.user.id, { $set: update });

  return NextResponse.json({ success: true });
}
