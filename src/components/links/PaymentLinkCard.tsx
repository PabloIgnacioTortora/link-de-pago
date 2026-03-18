'use client';

import { useState } from 'react';
import Link from 'next/link';
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
}

export default function PaymentLinkCard({ link, onDelete }: PaymentLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const url = `${window.location.origin}/pay/${link.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      </div>

      <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="text-xs text-gray-500 flex-1 truncate">{url}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-indigo-600 font-medium hover:underline whitespace-nowrap"
        >
          {copied ? '¡Copiado!' : 'Copiar'}
        </button>
      </div>

      <div className="flex gap-2">
        <Link href={`/links/${link._id}`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full">Editar</Button>
        </Link>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowQR(true)}
          title="Ver QR"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(link._id)}
        >
          Eliminar
        </Button>
      </div>

      {showQR && (
        <QRModal url={url} title={link.title} onClose={() => setShowQR(false)} />
      )}
    </div>
  );
}
