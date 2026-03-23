'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const passwordReset = searchParams.get('reset') === '1';
  const emailVerified = searchParams.get('verified') === '1';
  const tokenError = searchParams.get('error');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError('Email o contraseña incorrectos. Si te registraste recientemente, verificá tu email primero.');
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <>
      {passwordReset && (
        <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-4 text-center">
          Contraseña actualizada. Ya podés iniciar sesión.
        </p>
      )}
      {emailVerified && (
        <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-4 text-center">
          ¡Email verificado! Ya podés iniciar sesión.
        </p>
      )}
      {tokenError === 'token_expirado' && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4 text-center">
          El link de verificación expiró. Registrate de nuevo para recibir uno nuevo.
        </p>
      )}
      {tokenError === 'token_invalido' && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4 text-center">
          Link de verificación inválido.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
        />
        <div>
          <Input
            id="password"
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
          />
          <div className="text-right mt-1">
            <Link href="/forgot-password" className="text-xs text-indigo-600 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <Button type="submit" loading={loading} size="lg" className="w-full">
          Iniciar sesión
        </Button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
        <div className="relative text-center"><span className="bg-white px-3 text-xs text-gray-400">o</span></div>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuar con Google
      </Button>

      <p className="text-center text-sm text-gray-500 mt-6">
        ¿No tenés cuenta?{' '}
        <Link href="/register" className="text-indigo-600 font-medium hover:underline">
          Registrate
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-600">LinkPago</h1>
          <p className="text-gray-500 text-sm mt-1">Iniciá sesión en tu cuenta</p>
        </div>
        <Suspense fallback={<div className="h-64" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
