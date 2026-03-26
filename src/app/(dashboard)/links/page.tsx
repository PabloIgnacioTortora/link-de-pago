'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Header from '@/components/dashboard/Header';
import PaymentLinkCard from '@/components/links/PaymentLinkCard';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

interface PaymentLink {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  slug: string;
  isActive: boolean;
  totalCollected: number;
  paymentCount: number;
  maxPayments?: number;
  expiresAt?: string;
}

function ConfirmModal({ title, onConfirm, onCancel, loading }: {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Desactivar link</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              ¿Desactivar <span className="font-medium text-gray-700">&quot;{title}&quot;</span>? Los pagadores no podrán acceder a él.
            </p>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Desactivando...' : 'Desactivar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LinksPage() {
  const { data: session } = useSession();
  const isPro = session?.user?.plan === 'pro';
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLinks = async () => {
    const res = await fetch('/api/links');
    const data = await res.json();
    setLinks(data.links ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleDelete = (id: string) => {
    const link = links.find((l) => l._id === id);
    if (link) setDeleteModal({ id, title: link.title });
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    await fetch(`/api/links/${deleteModal.id}`, { method: 'DELETE' });
    setDeleting(false);
    setDeleteModal(null);
    fetchLinks();
  };

  return (
    <div className="flex-1 overflow-auto">
      {deleteModal && (
        <ConfirmModal
          title={deleteModal.title}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
          loading={deleting}
        />
      )}
      <Header title="Mis Links de Cobro" />
      <main className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{links.length} link{links.length !== 1 ? 's' : ''} creado{links.length !== 1 ? 's' : ''}</p>
          <Link href="/links/new">
            <Button>+ Nuevo link</Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : links.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔗</p>
            <p className="text-gray-500 mb-4">No tenés links creados todavía.</p>
            <Link href="/links/new">
              <Button>Crear primer link</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {links.map((link) => (
              <PaymentLinkCard key={link._id} link={link} onDelete={handleDelete} isPro={isPro} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
