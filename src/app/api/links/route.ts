import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
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
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = 10;
  const skip = (page - 1) * limit;

  const showInactive = searchParams.get('inactive') === 'true';
  const filter: Record<string, unknown> = { merchantId: session.user.id };
  if (!showInactive) filter.isActive = true;

  const [links, total] = await Promise.all([
    PaymentLink.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    PaymentLink.countDocuments(filter),
  ]);

  return NextResponse.json({ links, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectDB();

  const plan = (session.user.plan as 'free' | 'pro') ?? 'free';
  const maxLinks = PLAN_LIMITS[plan].maxActiveLinks;

  const slug = generateSlug(parsed.data.title);

  // Verificación atómica: crear solo si no se supera el límite
  if (maxLinks !== Infinity) {
    const activeCount = await PaymentLink.countDocuments({ merchantId: session.user.id, isActive: true });
    if (activeCount >= maxLinks) {
      return NextResponse.json(
        { error: `Tu plan Free permite hasta ${maxLinks} links activos. Actualizá a Pro para crear más.` },
        { status: 403 }
      );
    }
  }

  const link = await PaymentLink.create({
    ...parsed.data,
    merchantId: session.user.id,
    slug,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
  });

  // Verificación post-creación para cerrar race condition
  if (maxLinks !== Infinity) {
    const finalCount = await PaymentLink.countDocuments({ merchantId: session.user.id, isActive: true });
    if (finalCount > maxLinks) {
      await PaymentLink.findByIdAndDelete(link._id);
      return NextResponse.json(
        { error: `Tu plan Free permite hasta ${maxLinks} links activos. Actualizá a Pro para crear más.` },
        { status: 403 }
      );
    }
  }

  return NextResponse.json(link, { status: 201 });
}
