'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/dashboard/Header';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [hasMpOAuth, setHasMpOAuth] = useState(false);
  const [mpTokenExpiresAt, setMpTokenExpiresAt] = useState<string | null>(null);

  const [form, setForm] = useState({
    businessName: '',
    brandColor: '#6366f1',
    transferCbu: '',
    transferAlias: '',
    transferHolder: '',
  });
  const [savedForm, setSavedForm] = useState({
    businessName: '',
    brandColor: '#6366f1',
    transferCbu: '',
    transferAlias: '',
    transferHolder: '',
  });

  // Leer query param ?mp= del callback OAuth y mostrar toast
  useEffect(() => {
    const mp = searchParams.get('mp');
    if (!mp) return;

    if (mp === 'connected') {
      toast.success('¡MercadoPago conectado correctamente!');
      setHasMpOAuth(true);
    } else if (mp === 'cancelled') {
      toast.info('Cancelaste la conexión con MercadoPago.');
    } else if (mp === 'error') {
      const reason = searchParams.get('reason') ?? '';
      toast.error(`Error al conectar con MercadoPago${reason ? `: ${reason}` : '.'}`, {
        duration: 10000,
      });
    }

    // Limpiar el query param de la URL sin recargar
    const url = new URL(window.location.href);
    url.searchParams.delete('mp');
    url.searchParams.delete('reason');
    router.replace(url.pathname + (url.search || ''));
  }, [searchParams, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        const loaded = {
          businessName: data.businessName ?? '',
          brandColor: data.brandColor ?? '#6366f1',
          transferCbu: data.transferCbu ?? '',
          transferAlias: data.transferAlias ?? '',
          transferHolder: data.transferHolder ?? '',
        };
        setForm(loaded);
        setSavedForm(loaded);
        setHasMpOAuth(!!data.hasMpOAuth);
        setMpTokenExpiresAt(data.mpTokenExpiresAt ?? null);
      });
  }, [status]);

  const isDirty =
    form.businessName !== savedForm.businessName ||
    form.brandColor !== savedForm.brandColor ||
    form.transferCbu !== savedForm.transferCbu ||
    form.transferAlias !== savedForm.transferAlias ||
    form.transferHolder !== savedForm.transferHolder;

  const handleSave = async () => {
    setLoading(true);
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      toast.success('Cambios guardados correctamente.');
      setSavedForm({ ...form });
      await update();
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    const res = await fetch('/api/mp/disconnect', { method: 'POST' });
    setDisconnecting(false);
    if (res.ok) {
      setHasMpOAuth(false);
      setMpTokenExpiresAt(null);
      toast.success('MercadoPago desconectado.');
    } else {
      toast.error('No se pudo desconectar. Intentá de nuevo.');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex-1 overflow-auto">
        <Header title="Configuración" />
        <main className="p-4 md:p-6 max-w-lg">
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
      <main className="p-4 md:p-6 max-w-lg space-y-4">

        {/* Banner de advertencia si MP no está conectado */}
        {!hasMpOAuth && (
          <div role="alert" className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-4 flex gap-3">
            <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800">Conectá tu cuenta de MercadoPago</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Tus links de cobro no funcionarán hasta que conectes tu cuenta de MercadoPago.
              </p>
            </div>
          </div>
        )}

        {/* Sección: Perfil del negocio */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-800">Perfil del negocio</h2>

          <div className={`flex flex-col gap-1 ${!isPro ? 'opacity-50 pointer-events-none' : ''}`}>
            <label htmlFor="businessName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              Nombre del negocio
              {!isPro && <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">Pro</span>}
            </label>
            <input
              id="businessName"
              type="text"
              value={form.businessName}
              onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
              placeholder="Ej: Clínica Dental Rodríguez"
              disabled={!isPro}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
            />
          </div>

          <div className={`flex flex-col gap-1 ${!isPro ? 'opacity-50 pointer-events-none' : ''}`}>
            <label htmlFor="brandColor" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              Color de marca
              {!isPro && <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">Pro</span>}
            </label>
            <div className="flex items-center gap-3">
              <input
                id="brandColor"
                type="color"
                value={form.brandColor}
                onChange={(e) => setForm((f) => ({ ...f, brandColor: e.target.value }))}
                disabled={!isPro}
                aria-label={`Color de marca: ${form.brandColor}`}
                className="h-10 w-16 rounded border border-gray-300 cursor-pointer disabled:cursor-not-allowed"
              />
              <span className="text-sm text-gray-500">{form.brandColor}</span>
              <div className="h-8 w-8 rounded-full border border-gray-200" style={{ backgroundColor: form.brandColor }} />
            </div>
          </div>

          {!isPro && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 text-sm text-indigo-700">
              Las opciones de marca propia requieren el plan Pro.{' '}
              <Link href="/#precios" className="font-semibold underline">Actualizá acá</Link>
            </div>
          )}

          <Button loading={loading} disabled={!isDirty} onClick={handleSave}>Guardar cambios</Button>
        </div>

        {/* Sección: MercadoPago Connect */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-800">MercadoPago</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Conectá tu cuenta para recibir los pagos directamente en tu billetera.
            </p>
          </div>

          {hasMpOAuth ? (
            /* Estado: conectado */
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-800">Cuenta conectada</p>
                  {mpTokenExpiresAt && (
                    <p className="text-xs text-green-600 mt-0.5">
                      Token válido hasta {new Date(mpTokenExpiresAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href="/api/mp/connect"
                  className="flex-1 text-center px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Reconectar cuenta
                </a>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="flex-1 px-4 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  {disconnecting ? 'Desconectando...' : 'Desconectar'}
                </button>
              </div>
            </div>
          ) : (
            /* Estado: no conectado */
            <a
              href="/api/mp/connect"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[#009ee3] hover:bg-[#008fd1] text-white font-semibold text-sm transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Conectar con MercadoPago
            </a>
          )}
        </div>

        {/* Sección: Transferencia bancaria */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-800">Transferencia bancaria</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Opcional. Si completás estos datos, los pagadores podrán elegir pagar por transferencia.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="transferHolder" className="text-sm font-medium text-gray-700">Titular de la cuenta</label>
            <input
              id="transferHolder"
              type="text"
              value={form.transferHolder}
              onChange={(e) => setForm((f) => ({ ...f, transferHolder: e.target.value }))}
              placeholder="Ej: Juan García"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="transferCbu" className="text-sm font-medium text-gray-700">CBU / CVU</label>
            <input
              id="transferCbu"
              type="text"
              inputMode="numeric"
              value={form.transferCbu}
              onChange={(e) => setForm((f) => ({ ...f, transferCbu: e.target.value }))}
              placeholder="0000000000000000000000"
              maxLength={22}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 font-mono placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="transferAlias" className="text-sm font-medium text-gray-700">Alias</label>
            <input
              id="transferAlias"
              type="text"
              value={form.transferAlias}
              onChange={(e) => setForm((f) => ({ ...f, transferAlias: e.target.value }))}
              placeholder="Ej: minegocio.mp"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 font-mono placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Button loading={loading} disabled={!isDirty} onClick={handleSave}>Guardar cambios</Button>
        </div>

      </main>
    </div>
  );
}
