import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/db/mongoose';
import Transaction from '@/models/Transaction';

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const status = searchParams.get('status');
  const linkId = searchParams.get('linkId');
  const limit = 20;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { merchantId: token.id };
  if (status) filter.status = status;
  if (linkId) filter.paymentLinkId = linkId;

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
