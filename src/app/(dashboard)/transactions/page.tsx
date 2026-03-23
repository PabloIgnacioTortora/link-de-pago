'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/dashboard/Header';
import Badge from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import type { TransactionStatus } from '@/models/Transaction';

interface Transaction {
  _id: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  payerEmail?: string;
  payerName?: string;
  paymentMethod?: string;
  createdAt: string;
  paymentLinkId?: { title: string; slug: string };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const params = status ? `?status=${status}` : '';
    fetch(`/api/transactions${params}`)
      .then((r) => r.json())
      .then((d) => { setTransactions(d.transactions ?? []); setLoading(false); });
  }, [status]);

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Transacciones" />
      <main className="p-6">
        <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          {['', 'approved', 'pending', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                status === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === '' ? 'Todas' : s === 'approved' ? 'Aprobadas' : s === 'pending' ? 'Pendientes' : 'Rechazadas'}
            </button>
          ))}
        </div>
        <a
            href="/api/transactions/export"
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar CSV
          </a>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-400">Cargando...</div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-4xl mb-2">💳</p>
              <p>No hay transacciones {status ? 'con ese filtro' : 'aún'}.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-5 py-3 text-left">Link</th>
                  <th className="px-5 py-3 text-left">Pagador</th>
                  <th className="px-5 py-3 text-left">Método</th>
                  <th className="px-5 py-3 text-right">Monto</th>
                  <th className="px-5 py-3 text-left">Estado</th>
                  <th className="px-5 py-3 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-900 font-medium max-w-[150px] truncate">{tx.paymentLinkId?.title ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{tx.payerEmail ?? tx.payerName ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600 capitalize">{tx.paymentMethod?.replace('_', ' ') ?? '—'}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(tx.amount, tx.currency)}</td>
                    <td className="px-5 py-3"><Badge variant={tx.status} /></td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{new Date(tx.createdAt).toLocaleDateString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
