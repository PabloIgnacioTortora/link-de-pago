import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db/mongoose';
import PaymentLink from '@/models/PaymentLink';
import { PLAN_LIMITS } from '@/lib/plans';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) + '-' + Math.random().toString(36).slice(2, 7);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const original = await PaymentLink.findOne({ _id: id, merchantId: session.user.id }).lean();
  if (!original) return NextResponse.json({ error: 'Link no encontrado' }, { status: 404 });

  const plan = (session.user.plan as 'free' | 'pro') ?? 'free';
  const maxLinks = PLAN_LIMITS[plan].maxActiveLinks;

  if (maxLinks !== Infinity) {
    const activeCount = await PaymentLink.countDocuments({ merchantId: session.user.id, isActive: true });
    if (activeCount >= maxLinks) {
      return NextResponse.json(
        { error: `Tu plan Free permite hasta ${maxLinks} links activos. Actualizá a Pro para crear más.` },
        { status: 403 }
      );
    }
  }

  const duplicate = await PaymentLink.create({
    merchantId: session.user.id,
    title: `${original.title} (copia)`,
    description: original.description,
    amount: original.amount,
    currency: original.currency,
    slug: generateSlug(original.title),
    isActive: true,
    maxPayments: original.maxPayments,
    successUrl: original.successUrl,
    successMessage: original.successMessage,
  });

  return NextResponse.json(duplicate, { status: 201 });
}
