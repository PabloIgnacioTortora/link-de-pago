'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/dashboard/Header';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const STEPS = [
  {
    n: '1',
    title: 'Entrá a MercadoPago Developers',
    desc: 'Abrí una nueva pestaña y andá a mercadopago.com.ar/developers',
    href: 'https://www.mercadopago.com.ar/developers',
    cta: 'Ir a Developers →',
  },
  {
    n: '2',
    title: 'Ingresá con tu cuenta',
    desc: 'Usá el mismo usuario y contraseña de tu cuenta de MercadoPago.',
  },
  {
    n: '3',
    title: 'Creá una aplicación',
    desc: 'Hacé clic en "Crear aplicación". Ponele cualquier nombre (ej: "Mi tienda") y seleccioná "Pagos online".',
  },
  {
    n: '4',
    title: 'Copiá tu Access Token de producción',
    desc: 'Dentro de la app, andá a "Credenciales de producción". Copiá el texto que empieza con APP_USR-...',
  },
  {
    n: '5',
    title: 'Pegalo acá abajo',
    desc: 'Pegá el token en el campo de abajo y guardá los cambios.',
  },
];

function MpTokenHelp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mp-token-help-content"
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-blue-700">¿Cómo obtengo mi Access Token?</span>
        </div>
        <svg
          className={`w-4 h-4 text-blue-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div id="mp-token-help-content" className="px-4 pb-4 space-y-3 border-t border-blue-100">
          <p className="text-xs text-blue-600 pt-3">Seguí estos pasos simples — te lleva menos de 5 minutos:</p>
          <ol className="space-y-3">
            {STEPS.map((step) => (
              <li key={step.n} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {step.n}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                  {step.href && (
                    <a
                      href={step.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 font-medium hover:underline mt-1 inline-block"
                    >
                      {step.cta}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-yellow-700">
              <strong>Importante:</strong> Usá el token de <strong>producción</strong> (empieza con <code className="font-mono">APP_USR-</code>), no el de prueba.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSavedToken, setHasSavedToken] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    brandColor: '#6366f1',
    mpAccessToken: '',
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
        setForm((f) => ({ ...f, ...loaded }));
        setSavedForm(loaded);
        setHasSavedToken(!!data.hasMpToken);
      });
  }, [status]);

  const isDirty =
    form.mpAccessToken !== '' ||
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
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      const newSaved = {
        businessName: form.businessName,
        brandColor: form.brandColor,
        transferCbu: form.transferCbu,
        transferAlias: form.transferAlias,
        transferHolder: form.transferHolder,
      };
      setSavedForm(newSaved);
      if (form.mpAccessToken) {
        setHasSavedToken(true);
        setForm((f) => ({ ...f, mpAccessToken: '' }));
      }
      await update();
    }
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
        {!hasSavedToken && (
          <div role="alert" className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-4 flex gap-3">
            <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800">Configurá tu cuenta de MercadoPago</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Tus links de cobro no funcionarán hasta que conectes tu cuenta. Completá el Access Token más abajo.
              </p>
            </div>
          </div>
        )}

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
              <div
                className="h-8 w-8 rounded-full border border-gray-200"
                style={{ backgroundColor: form.brandColor }}
              />
            </div>
          </div>

          {!isPro && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 text-sm text-indigo-700">
              Las opciones de marca propia requieren el plan Pro.{' '}
              <Link href="/#precios" className="font-semibold underline">Actualizá acá</Link>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 space-y-4">
            <div>
              <h3 className="font-medium text-gray-800 mb-0.5">Conectar mi cuenta de MercadoPago</h3>
              <p className="text-xs text-gray-500">
                Conectá tu cuenta para que los pagos ingresen directamente a tu billetera de MercadoPago.
              </p>
            </div>

            <MpTokenHelp />

            <div className="flex flex-col gap-1">
              <label htmlFor="mpAccessToken" className="text-sm font-medium text-gray-700">
                Tu Access Token de producción
              </label>
              <div className="relative">
                <input
                  id="mpAccessToken"
                  type="password"
                  value={form.mpAccessToken}
                  onChange={(e) => setForm((f) => ({ ...f, mpAccessToken: e.target.value }))}
                  placeholder={hasSavedToken ? 'APP_USR-••••••••••••••••••••••••' : 'APP_USR-0000000000000000-000000-...'}
                  className={`block w-full rounded-lg border px-3 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono ${hasSavedToken && !form.mpAccessToken ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                />
                {hasSavedToken && !form.mpAccessToken && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>
              {hasSavedToken && !form.mpAccessToken
                ? <p className="text-xs text-green-600 mt-1" role="status"><span aria-hidden="true">✓</span> Token configurado. Dejá el campo vacío para mantener el actual.</p>
                : form.mpAccessToken
                  ? <p className="text-xs text-indigo-600 mt-1">Token listo para guardar.</p>
                  : null
              }
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-4">
            <div>
              <h3 className="font-medium text-gray-800 mb-0.5">Transferencia bancaria</h3>
              <p className="text-xs text-gray-500">
                Opcional. Si completás estos datos, los pagadores podrán elegir pagar por transferencia bancaria.
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
          </div>

          {saved && (
            <p role="status" aria-live="polite" className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">Cambios guardados correctamente.</p>
          )}

          <Button loading={loading} disabled={!isDirty} onClick={handleSave}>Guardar cambios</Button>
        </div>
      </main>
    </div>
  );
}
