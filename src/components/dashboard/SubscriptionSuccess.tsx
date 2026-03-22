'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SubscriptionSuccess() {
  const { update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (searchParams.get('subscription') !== 'success') return;

    // Refrescar sesión para que refleje el nuevo plan
    const refresh = async () => {
      await update();
      setShow(true);
      // Limpiar el query param de la URL sin recargar
      router.replace('/dashboard', { scroll: false });
    };

    refresh();
  }, [searchParams, update, router]);

  if (!show) return null;

  return (
    <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-green-800">¡Bienvenido a LinkPago Pro!</p>
        <p className="text-xs text-green-700">Tu plan fue activado correctamente. Ya tenés acceso a todas las funciones.</p>
      </div>
    </div>
  );
}
