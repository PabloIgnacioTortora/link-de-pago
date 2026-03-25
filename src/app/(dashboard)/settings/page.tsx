'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/dashboard/Header';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSavedToken, setHasSavedToken] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    brandColor: '#6366f1',
    mpAccessToken: '',
  });

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setForm((f) => ({
          ...f,
          businessName: data.businessName ?? '',
          brandColor: data.brandColor ?? '#6366f1',
        }));
        setHasSavedToken(!!data.hasMpToken);
      });
  }, [status]);

  const handleSave = async () => {
    setLoading(true);
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  };

  if (status === 'loading') {
    return (
      <div className="flex-1 overflow-auto">
        <Header title="Configuración" />
        <main className="p-6 max-w-lg">
          <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse space-y-4">
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="h-10 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded w-1/4" />
          </div>
        </main>
      </div>
    );
  }

  const isPro = session?.user?.plan === 'pro';

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Configuración" />
      <main className="p-6 max-w-lg space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-800">Perfil del negocio</h2>

          <div className={`flex flex-col gap-1 ${!isPro ? 'opacity-50 pointer-events-none' : ''}`}>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              Nombre del negocio
              {!isPro && <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">Pro</span>}
            </label>
            <input
              type="text"
              value={form.businessName}
              onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
              placeholder="Ej: Clínica Dental Rodríguez"
              disabled={!isPro}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
            />
          </div>

          <div className={`flex flex-col gap-1 ${!isPro ? 'opacity-50 pointer-events-none' : ''}`}>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              Color de marca
              {!isPro && <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">Pro</span>}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.brandColor}
                onChange={(e) => setForm((f) => ({ ...f, brandColor: e.target.value }))}
                disabled={!isPro}
                className="h-10 w-16 rounded border border-gray-300 cursor-pointer disabled:cursor-not-allowed"
              />
              <span className="text-sm text-gray-500">{form.brandColor}</span>
              <div
                className="h-8 w-8 rounded-full border border-gray-200"
                style={{ backgroundColor: form.brandColor }}
              />
            </div>
          </div>

          {!isPro && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 text-sm text-indigo-700">
              Las opciones de marca propia requieren el plan Pro.{' '}
              <Link href="/pricing" className="font-semibold underline">Actualizá acá</Link>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-medium text-gray-700 mb-3">MercadoPago</h3>
            <p className="text-xs text-gray-400 mb-3">
              Requerido para crear links de pago. Los pagos se acreditan directamente en tu cuenta de MercadoPago.
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                Access Token
                {hasSavedToken && !form.mpAccessToken && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Configurado</span>
                )}
              </label>
              <input
                type="password"
                value={form.mpAccessToken}
                onChange={(e) => setForm((f) => ({ ...f, mpAccessToken: e.target.value }))}
                placeholder={hasSavedToken ? 'Dejá en blanco para mantener el actual' : 'APP_USR-...'}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {saved && (
            <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">Cambios guardados correctamente.</p>
          )}

          <Button loading={loading} onClick={handleSave}>Guardar cambios</Button>
        </div>
      </main>
    </div>
  );
}
