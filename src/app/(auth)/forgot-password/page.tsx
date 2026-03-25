'use client';

import { useState } from 'react';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (res.ok) {
      setSent(true);
    } else {
      setError('Ocurrió un error. Intentá de nuevo.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-600">LinkPago</h1>
          <p className="text-gray-500 text-sm mt-1">Recuperar contraseña</p>
        </div>

        {sent ? (
          <div className="text-center">
            <p className="text-sm text-gray-700 mb-2">
              Si tu email está registrado, vas a recibir un link para restablecer tu contraseña.
            </p>
            <p className="text-xs text-gray-400 mb-6">Revisá también la carpeta de spam.</p>
            <Link href="/login" className="text-indigo-600 text-sm font-medium hover:underline">
              Volver al login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <Button type="submit" loading={loading} size="lg" className="w-full">
              Enviar link de recuperación
            </Button>

            <p className="text-center text-sm text-gray-500">
              <Link href="/login" className="text-indigo-600 font-medium hover:underline">
                Volver al login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
