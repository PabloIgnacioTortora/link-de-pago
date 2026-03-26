'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import QRModal from '@/components/ui/QRModal';

interface PaymentLinkCardProps {
  link: {
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
  };
  onDelete: (id: string) => void;
  isPro?: boolean;
}

export default function PaymentLinkCard({ link, onDelete, isPro = false }: PaymentLinkCardProps) {
  const [showQR, setShowQR] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const url = `${window.location.origin}/pay/${link.slug}`;

  const handleDuplicate = async () => {
    setDuplicating(true);
    const res = await fetch(`/api/links/${link._id}/duplicate`, { method: 'POST' });
    setDuplicating(false);
    if (res.ok) window.location.reload();
    else {
      const { error } = await res.json();
      toast.error(error ?? 'Error al duplicar el link');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    toast.success('¡Link copiado!');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{link.title}</h3>
            <Badge variant={link.isActive ? 'active' : 'inactive'} />
          </div>
          {link.description && <p className="text-sm text-gray-500 line-clamp-2">{link.description}</p>}
        </div>
        <span className="text-lg font-bold text-indigo-600 whitespace-nowrap">
          {formatCurrency(link.amount, link.currency)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
        <div>
          <span className="text-gray-400 text-xs block">Recaudado</span>
          <span className="font-medium">{formatCurrency(link.totalCollected, link.currency)}</span>
        </div>
        <div>
          <span className="text-gray-400 text-xs block">Pagos</span>
          <span className="font-medium">
            {link.paymentCount}{link.maxPayments ? ` / ${link.maxPayments}` : ''}
          </span>
        </div>
        {link.expiresAt && (
          <div className="col-span-2">
            <span className="text-gray-400 text-xs block">Vence</span>
            <span className={`text-xs font-medium ${new Date(link.expiresAt) < new Date() ? 'text-red-500' : 'text-gray-600'}`}>
              {new Date(link.expiresAt) < new Date()
                ? `Expirado el ${new Date(link.expiresAt).toLocaleDateString('es-AR')}`
                : new Date(link.expiresAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="text-xs text-gray-500 flex-1 truncate">{url}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-indigo-600 font-medium hover:underline whitespace-nowrap"
        >
          Copiar
        </button>
      </div>

      <div className="flex gap-2">
        <Link href={`/links/${link._id}`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full">Editar</Button>
        </Link>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleDuplicate}
          loading={duplicating}
          title="Duplicar link"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => isPro ? setShowQR(true) : null}
          title={isPro ? 'Ver QR' : 'QR disponible en plan Pro'}
          className={!isPro ? 'opacity-40 cursor-not-allowed' : ''}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(link._id)}>
          Eliminar
        </Button>
      </div>

      {showQR && (
        <QRModal url={url} title={link.title} onClose={() => setShowQR(false)} />
      )}
    </div>
  );
}
