import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/db/mongoose';
import PaymentLink from '@/models/PaymentLink';

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

  await connectDB();

  const link = await PaymentLink.findOneAndUpdate(
    { _id: id, merchantId: token.id },
    { $set: body },
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
