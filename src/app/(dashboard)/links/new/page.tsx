'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/dashboard/Header';
import PaymentLinkForm from '@/components/links/PaymentLinkForm';

export default function NewLinkPage() {
  const [hasMpToken, setHasMpToken] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => setHasMpToken(!!data.hasMpToken));
  }, []);

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Crear Link de Cobro" />
      <main className="p-6">
        {hasMpToken === false ? (
          <div className="max-w-lg bg-amber-50 border border-amber-200 rounded-xl px-5 py-6 space-y-3">
            <p className="text-sm font-medium text-amber-800">
              Necesitás configurar tu Access Token de MercadoPago antes de crear links de pago.
            </p>
            <Link
              href="/settings"
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Ir a Configuración
            </Link>
          </div>
        ) : (
          <PaymentLinkForm mode="create" />
        )}
      </main>
    </div>
  );
}
