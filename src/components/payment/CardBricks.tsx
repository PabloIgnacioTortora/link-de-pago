'use client';

import { useEffect, useState } from 'react';

interface CardBricksProps {
  slug: string;
  brandColor: string;
  onBack?: () => void;
}

export default function CardBricks({ slug, brandColor, onBack }: CardBricksProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let bricksBuilder: unknown = null;

    async function init() {
      try {
        // Obtener preferenceId y publicKey del backend
        const res = await fetch('/api/payment/bricks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug }),
        });
        const data = await res.json();
        if (!res.ok) { setErrorMsg(data.error ?? 'Error al cargar el pago'); setStatus('error'); return; }

        const { preferenceId, publicKey, amount } = data;

        // Cargar el SDK de MP dinámicamente
        const { initMercadoPago, createBrick } = await import('@mercadopago/sdk-react/pure');
        initMercadoPago(publicKey, { locale: 'es-AR' });

        bricksBuilder = await createBrick({
          name: 'payment',
          targetId: 'mp-bricks-container',
          initialization: {
            amount,
            preferenceId,
          },
          customization: {
            paymentMethods: {
              creditCard: 'all',
              debitCard: 'all',
              maxInstallments: 12,
            },
            visual: {
              style: {
                theme: 'default',
                customVariables: {
                  baseColor: brandColor,
                },
              },
            },
          },
          callbacks: {
            onReady: () => setStatus('ready'),
            onError: (err: unknown) => {
              console.error('Bricks error:', err);
              setErrorMsg('Error al cargar el formulario de pago.');
              setStatus('error');
            },
            onSubmit: async ({ formData }: { formData: unknown }) => {
              const res = await fetch('/api/payment/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, formData }),
              });
              const result = await res.json();
              if (!res.ok) { return Promise.reject(result.error ?? 'Error al procesar'); }
              if (result.redirectUrl) window.location.href = result.redirectUrl;
            },
          },
        });
      } catch (err) {
        console.error('Bricks init error:', err);
        setErrorMsg('Error al inicializar el formulario de pago.');
        setStatus('error');
      }
    }

    init();

    return () => {
      // Cleanup: destruir el brick si existe
      if (bricksBuilder && typeof (bricksBuilder as { unmount?: () => void }).unmount === 'function') {
        (bricksBuilder as { unmount: () => void }).unmount();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return (
    <div>
      {onBack && (
        <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 mb-3 flex items-center gap-1">
          ← Cambiar método
        </button>
      )}

      {status === 'loading' && (
        <div className="flex items-center justify-center py-8 gap-2 text-sm text-gray-400" role="status" aria-live="polite">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Cargando formulario...
        </div>
      )}

      {status === 'error' && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>
      )}

      <div id="mp-bricks-container" />
    </div>
  );
}
