import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db/mongoose';
import Transaction from '@/models/Transaction';
import '@/models/PaymentLink';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const statusParam = searchParams.get('status');
  const linkId = searchParams.get('linkId');
  const limit = 20;
  const skip = (page - 1) * limit;

  const VALID_STATUSES = ['approved', 'pending', 'rejected', 'cancelled'];
  const status = statusParam && VALID_STATUSES.includes(statusParam) ? statusParam : null;

  const filter: Record<string, unknown> = { merchantId: session.user.id };
  if (status) filter.status = status;
  if (linkId && /^[a-f\d]{24}$/i.test(linkId)) filter.paymentLinkId = linkId;

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate('paymentLinkId', 'title slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  return NextResponse.json({ transactions, total, page, pages: Math.ceil(total / limit) });
}
