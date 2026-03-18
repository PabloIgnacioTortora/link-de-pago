'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/dashboard/Header';
import PaymentLinkCard from '@/components/links/PaymentLinkCard';
import Button from '@/components/ui/Button';

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

export default function LinksPage() {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLinks = async () => {
    const res = await fetch('/api/links');
    const data = await res.json();
    setLinks(data.links ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Desactivar este link?')) return;
    await fetch(`/api/links/${id}`, { method: 'DELETE' });
    fetchLinks();
  };

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Mis Links de Cobro" />
      <main className="p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{links.length} link{links.length !== 1 ? 's' : ''} creado{links.length !== 1 ? 's' : ''}</p>
          <Link href="/links/new">
            <Button>+ Nuevo link</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Cargando...</div>
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
              <PaymentLinkCard key={link._id} link={link} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
