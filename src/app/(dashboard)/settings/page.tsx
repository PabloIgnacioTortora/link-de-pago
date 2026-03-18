'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Header from '@/components/dashboard/Header';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    brandColor: '#6366f1',
    mpAccessToken: '',
  });

  // Inicializar cuando la sesión esté disponible
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setForm((f) => ({
        ...f,
        businessName: session.user.businessName ?? '',
        brandColor: session.user.brandColor ?? '#6366f1',
      }));
    }
  }, [status, session]);

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

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Configuración" />
      <main className="p-6 max-w-lg">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-800">Perfil del negocio</h2>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Nombre del negocio</label>
            <input
              type="text"
              value={form.businessName}
              onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
              placeholder="Ej: Clínica Dental Rodríguez"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Color de marca</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.brandColor}
                onChange={(e) => setForm((f) => ({ ...f, brandColor: e.target.value }))}
                className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-500">{form.brandColor}</span>
              <div
                className="h-8 w-8 rounded-full border border-gray-200"
                style={{ backgroundColor: form.brandColor }}
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-medium text-gray-700 mb-3">MercadoPago (opcional)</h3>
            <p className="text-xs text-gray-400 mb-3">
              Dejá en blanco para usar las credenciales de la plataforma. Completá con tu Access Token propio para recibir pagos directamente en tu cuenta MP.
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Access Token</label>
              <input
                type="password"
                value={form.mpAccessToken}
                onChange={(e) => setForm((f) => ({ ...f, mpAccessToken: e.target.value }))}
                placeholder="APP_USR-..."
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
