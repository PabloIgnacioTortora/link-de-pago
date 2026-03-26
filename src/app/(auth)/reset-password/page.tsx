'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push('/login?reset=1');
    } else {
      const data = await res.json();
      toast.error(data.error ?? 'Error al restablecer la contraseña.');
    }
  };

  if (!token) {
    return (
      <p className="text-sm text-red-600 text-center">
        Link inválido.{' '}
        <Link href="/forgot-password" className="text-indigo-600 font-medium hover:underline">
          Solicitá uno nuevo
        </Link>
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="password"
        label="Nueva contraseña"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
      />
      <Input
        id="confirm"
        label="Confirmar contraseña"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />

      <Button type="submit" loading={loading} size="lg" className="w-full">
        Guardar nueva contraseña
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-600">LinkPago</h1>
          <p className="text-gray-500 text-sm mt-1">Nueva contraseña</p>
        </div>
        <Suspense fallback={<div className="h-32" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
