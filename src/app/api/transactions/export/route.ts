import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db/mongoose';
import Transaction from '@/models/Transaction';
import { formatCurrency } from '@/lib/utils/formatCurrency';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await connectDB();

  const transactions = await Transaction.find({ merchantId: session.user.id })
    .populate('paymentLinkId', 'title slug')
    .sort({ createdAt: -1 })
    .limit(1000)
    .lean();

  const rows = [
    ['Fecha', 'Link', 'Pagador', 'Método', 'Monto', 'Estado'],
    ...transactions.map((tx) => [
      new Date(tx.createdAt).toLocaleDateString('es-AR'),
      (tx.paymentLinkId as { title?: string } | null)?.title ?? '—',
      tx.payerEmail ?? tx.payerName ?? '—',
      tx.paymentMethod?.replace('_', ' ') ?? '—',
      formatCurrency(tx.amount, tx.currency),
      tx.status === 'approved' ? 'Aprobado' : tx.status === 'pending' ? 'Pendiente' : 'Rechazado',
    ]),
  ];

  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="transacciones-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
