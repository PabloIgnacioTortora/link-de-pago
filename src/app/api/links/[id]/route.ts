import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db/mongoose';
import PaymentLink from '@/models/PaymentLink';
import { z } from 'zod';
import { checkOrigin } from '@/lib/csrf';

const patchSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  amount: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().nullable().optional(),
  maxPayments: z.number().positive().nullable().optional(),
  successUrl: z.string().url().nullable().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const link = await PaymentLink.findOne({ _id: id, merchantId: session.user.id });
  if (!link) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  return NextResponse.json(link);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkOrigin(req)) return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 });
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  await connectDB();

  const link = await PaymentLink.findOneAndUpdate(
    { _id: id, merchantId: session.user.id },
    { $set: parsed.data },
    { new: true }
  );

  if (!link) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  return NextResponse.json(link);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkOrigin(req)) return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 });
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const link = await PaymentLink.findOneAndUpdate(
    { _id: id, merchantId: session.user.id },
    { $set: { isActive: false } },
    { new: true }
  );

  if (!link) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  return NextResponse.json({ success: true });
}
