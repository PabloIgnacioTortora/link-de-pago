import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/db/mongoose';
import PaymentLink from '@/models/PaymentLink';
import { z } from 'zod';

const patchSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  amount: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().nullable().optional(),
  maxPayments: z.number().positive().nullable().optional(),
  successUrl: z.string().url().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const link = await PaymentLink.findOne({ _id: id, merchantId: token.id });
  if (!link) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  return NextResponse.json(link);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectDB();

  const link = await PaymentLink.findOneAndUpdate(
    { _id: id, merchantId: token.id },
    { $set: parsed.data },
    { new: true }
  );

  if (!link) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  return NextResponse.json(link);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const link = await PaymentLink.findOneAndUpdate(
    { _id: id, merchantId: token.id },
    { $set: { isActive: false } },
    { new: true }
  );

  if (!link) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  return NextResponse.json({ success: true });
}
