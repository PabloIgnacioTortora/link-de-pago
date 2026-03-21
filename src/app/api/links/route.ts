import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/db/mongoose';
import PaymentLink from '@/models/PaymentLink';
import { generateSlug } from '@/lib/utils/generateSlug';
import { z } from 'zod';
import { PLAN_LIMITS } from '@/lib/plans';

const createSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  amount: z.number().positive(),
  currency: z.string().default('ARS'),
  maxPayments: z.number().positive().optional(),
  expiresAt: z.string().optional(),
  successUrl: z.string().url().optional(),
});

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = 10;
  const skip = (page - 1) * limit;

  const [links, total] = await Promise.all([
    PaymentLink.find({ merchantId: token.id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    PaymentLink.countDocuments({ merchantId: token.id }),
  ]);

  return NextResponse.json({ links, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectDB();

  // Verificar límite de plan
  const plan = (token.plan as 'free' | 'pro') ?? 'free';
  const maxLinks = PLAN_LIMITS[plan].maxActiveLinks;
  if (maxLinks !== Infinity) {
    const activeCount = await PaymentLink.countDocuments({ merchantId: token.id, isActive: true });
    if (activeCount >= maxLinks) {
      return NextResponse.json(
        { error: `Tu plan Free permite hasta ${maxLinks} links activos. Actualizá a Pro para crear más.` },
        { status: 403 }
      );
    }
  }

  const slug = generateSlug(parsed.data.title);

  const link = await PaymentLink.create({
    ...parsed.data,
    merchantId: token.id,
    slug,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
  });

  return NextResponse.json(link, { status: 201 });
}
