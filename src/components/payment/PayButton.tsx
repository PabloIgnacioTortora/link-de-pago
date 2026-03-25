'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface PayButtonProps {
  slug: string;
  brandColor: string;
}

export default function PayButton({ slug, brandColor }: PayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setLoading(true);
    setError('');

    const res = await fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(
        res.status === 503
          ? 'Este comercio aún no configuró su cuenta de MercadoPago. Contactalo para avisarle.'
          : (data.error ?? 'Error al iniciar el pago')
      );
      setLoading(false);
      return;
    }

    window.location.href = data.initPoint;
  };

  return (
    <div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>
      )}
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full py-3 px-6 rounded-xl text-white font-semibold text-base transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ backgroundColor: brandColor }}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Procesando...
          </>
        ) : (
          'Pagar ahora'
        )}
      </button>
    </div>
  );
}
