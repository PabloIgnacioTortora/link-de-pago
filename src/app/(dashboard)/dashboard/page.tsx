import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import StatsCard from '@/components/dashboard/StatsCard';
import connectDB from '@/lib/db/mongoose';
import PaymentLink from '@/models/PaymentLink';
import Transaction from '@/models/Transaction';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import Link from 'next/link';
import mongoose from 'mongoose';
import { Suspense } from 'react';
import SubscriptionSuccess from '@/components/dashboard/SubscriptionSuccess';
import RevenueChart from '@/components/dashboard/RevenueChart';

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  await connectDB();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const [linkCount, totalLinks, recentTransactions, revenueResult, dailyRevenue] = await Promise.all([
    PaymentLink.countDocuments({ merchantId: session.user.id, isActive: true }),
    PaymentLink.countDocuments({ merchantId: session.user.id }),
    Transaction.find({ merchantId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('paymentLinkId', 'title')
      .lean(),
    Transaction.aggregate([
      { $match: { merchantId: new mongoose.Types.ObjectId(session.user.id), status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      {
        $match: {
          merchantId: new mongoose.Types.ObjectId(session.user.id),
          status: 'approved',
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Rellenar días sin transacciones con 0
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const found = (dailyRevenue as { _id: string; total: number }[]).find((r) => r._id === key);
    return { date: key, total: found?.total ?? 0 };
  });

  const revenue = revenueResult[0]?.total ?? 0;
  const approvedCount = revenueResult[0]?.count ?? 0;

  return (
    <div className="flex-1 overflow-auto">
      <Header title={`Hola, ${session.user.name?.split(' ')[0]} 👋`} />
      <Suspense fallback={null}>
        <SubscriptionSuccess />
      </Suspense>
      <main className="p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Ingresos totales"
            value={formatCurrency(revenue)}
            sub="Pagos aprobados"
            color="green"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Pagos recibidos"
            value={String(approvedCount)}
            color="indigo"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Links activos"
            value={String(linkCount)}
            sub={`de ${totalLinks} totales`}
            color="blue"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            }
          />
          <StatsCard
            title="Tasa de cobro"
            value={totalLinks > 0 ? `${Math.round((approvedCount / Math.max(totalLinks, 1)) * 100)}%` : '—'}
            color="violet"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Ingresos — últimos 30 días</h2>
          </div>
          <div className="px-5 py-4">
            <RevenueChart data={chartData} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Últimas transacciones</h2>
            <Link href="/transactions" className="text-sm text-indigo-600 hover:underline">Ver todo</Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p className="text-4xl mb-2">💳</p>
              <p>Aún no hay transacciones.</p>
              <Link href="/links/new" className="mt-3 inline-block text-indigo-600 text-sm hover:underline">
                Crear tu primer link de cobro
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-5 py-3 text-left">Link</th>
                  <th className="px-5 py-3 text-left">Pagador</th>
                  <th className="px-5 py-3 text-right">Monto</th>
                  <th className="px-5 py-3 text-left">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTransactions.map((tx) => (
                  <tr key={String(tx._id)} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-900 font-medium">
                      {(tx.paymentLinkId as { title?: string })?.title ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{tx.payerEmail ?? '—'}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(tx.amount, tx.currency)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        tx.status === 'approved' ? 'bg-green-100 text-green-700' :
                        tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {tx.status === 'approved' ? 'Aprobado' : tx.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
