'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { formatCurrency } from '@/lib/utils/formatCurrency';

const CardBricks = dynamic(() => import('./CardBricks'), { ssr: false });

interface TransferInfo {
  cbu?: string;
  alias?: string;
  holder?: string;
}

interface PaymentOptionsProps {
  slug: string;
  amount: number;
  currency: string;
  brandColor: string;
  hasCard: boolean;
  transfer?: TransferInfo;
}

type Method = 'card' | 'transfer' | null;
type TransferStep = 'form' | 'details' | 'done';

export default function PaymentOptions({ slug, amount, currency, brandColor, hasCard, transfer }: PaymentOptionsProps) {
  const hasTransfer = !!(transfer?.cbu || transfer?.alias);
  const bothAvailable = hasCard && hasTransfer;

  const [method, setMethod] = useState<Method>(bothAvailable ? null : hasCard ? 'card' : 'transfer');
  const [transferStep, setTransferStep] = useState<TransferStep>('form');
  const [payerName, setPayerName] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTransferConfirm = async () => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/payment/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, payerName, payerEmail }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? 'Error al registrar la transferencia'); return; }
    setTransferStep('done');
  };

  // Selector de método
  if (method === null) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500 text-center mb-1">Elegí cómo querés pagar</p>
        <button
          onClick={() => setMethod('card')}
          className="w-full flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-left"
        >
          <span className="text-2xl" aria-hidden="true">💳</span>
          <div>
            <p className="text-sm font-medium text-gray-800">Tarjeta de débito o crédito</p>
            <p className="text-xs text-gray-400">Pago seguro procesado por MercadoPago</p>
          </div>
        </button>
        <button
          onClick={() => setMethod('transfer')}
          className="w-full flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-left"
        >
          <span className="text-2xl" aria-hidden="true">🏦</span>
          <div>
            <p className="text-sm font-medium text-gray-800">Transferencia bancaria</p>
            <p className="text-xs text-gray-400">CBU / CVU / Alias</p>
          </div>
        </button>
      </div>
    );
  }

  // Pago con tarjeta — MP Checkout Bricks (embebido)
  if (method === 'card') {
    return (
      <CardBricks
        slug={slug}
        brandColor={brandColor}
        onBack={bothAvailable ? () => setMethod(null) : undefined}
      />
    );
  }

  // Transferencia — paso 1: datos del pagador
  if (method === 'transfer' && transferStep === 'form') {
    return (
      <div className="space-y-3">
        {bothAvailable && (
          <button onClick={() => setMethod(null)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1" aria-label="Volver a selección de método de pago">
            <span aria-hidden="true">←</span> Cambiar método
          </button>
        )}
        <p className="text-sm text-gray-900">Ingresá tus datos para registrar la transferencia:</p>
        <label htmlFor="payer-name" className="sr-only">Tu nombre (opcional)</label>
        <input
          id="payer-name"
          type="text"
          placeholder="Tu nombre (opcional)"
          value={payerName}
          onChange={(e) => setPayerName(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <label htmlFor="payer-email" className="sr-only">Tu email (opcional)</label>
        <input
          id="payer-email"
          type="email"
          placeholder="Tu email (opcional)"
          value={payerEmail}
          onChange={(e) => setPayerEmail(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={() => setTransferStep('details')}
          className="w-full py-3 px-6 rounded-xl text-white font-semibold text-base"
          style={{ backgroundColor: brandColor }}
        >
          Ver datos de transferencia
        </button>
      </div>
    );
  }

  // Transferencia — paso 2: datos bancarios
  if (method === 'transfer' && transferStep === 'details') {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-700">Realizá la transferencia por el monto exacto:</p>
        <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Monto</span>
            <span className="font-bold text-gray-900 text-base">{formatCurrency(amount, currency)}</span>
          </div>
          {transfer?.holder && (
            <div className="flex justify-between items-center border-t border-gray-200 pt-3">
              <span className="text-gray-500">Titular</span>
              <span className="font-medium text-gray-800">{transfer.holder}</span>
            </div>
          )}
          {transfer?.cbu && (
            <div className="flex justify-between items-center border-t border-gray-200 pt-3">
              <span className="text-gray-500">CBU / CVU</span>
              <span className="font-mono text-gray-800 text-xs break-all">{transfer.cbu}</span>
            </div>
          )}
          {transfer?.alias && (
            <div className="flex justify-between items-center border-t border-gray-200 pt-3">
              <span className="text-gray-500">Alias</span>
              <span className="font-mono font-medium text-gray-800">{transfer.alias}</span>
            </div>
          )}
        </div>
        {error && <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <button
          onClick={handleTransferConfirm}
          disabled={loading}
          className="w-full py-3 px-6 rounded-xl text-white font-semibold text-base disabled:opacity-60"
          style={{ backgroundColor: brandColor }}
        >
          {loading ? 'Registrando...' : 'Ya transferí'}
        </button>
        <button onClick={() => setTransferStep('form')} className="w-full text-xs text-gray-400 hover:text-gray-600" aria-label="Volver al formulario de datos">
          <span aria-hidden="true">←</span> Volver
        </button>
      </div>
    );
  }

  // Transferencia — confirmación
  if (method === 'transfer' && transferStep === 'done') {
    return (
      <div className="text-center space-y-3 py-2">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-800">¡Transferencia registrada!</p>
        <p className="text-xs text-gray-500">
          El comercio verificará tu pago. Te avisaremos cuando sea confirmado.
        </p>
      </div>
    );
  }

  return null;
}
