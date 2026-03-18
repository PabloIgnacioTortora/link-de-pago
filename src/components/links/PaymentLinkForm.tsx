'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const schema = z.object({
  title: z.string().min(1, 'El título es requerido').max(100),
  description: z.string().max(500).optional(),
  amount: z.coerce.number().positive('El monto debe ser positivo'),
  currency: z.string().default('ARS'),
  maxPayments: z.coerce.number().positive().optional().or(z.literal('')),
  expiresAt: z.string().optional(),
  isActive: z.boolean().optional(),
});

type FormData = z.output<typeof schema>;

interface Props {
  initialData?: Partial<FormData> & { _id?: string; isActive?: boolean };
  mode: 'create' | 'edit';
}

export default function PaymentLinkForm({ initialData, mode }: Props) {
  const router = useRouter();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: initialData ?? { currency: 'ARS', isActive: true },
  });

  const isActive = watch('isActive');

  const onSubmit = async (data: FormData) => {
    setError('');
    const url = mode === 'create' ? '/api/links' : `/api/links/${initialData?._id}`;
    const method = mode === 'create' ? 'POST' : 'PATCH';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, maxPayments: data.maxPayments || undefined }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? 'Error al guardar el link');
      return;
    }

    router.push('/links');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      <Input
        id="title"
        label="Título del cobro *"
        placeholder="Ej: Consulta médica, Seña depto..."
        error={errors.title?.message}
        {...register('title')}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Descripción</label>
        <textarea
          rows={3}
          placeholder="Detalle opcional del cobro..."
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          {...register('description')}
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            id="amount"
            label="Monto *"
            type="number"
            min="1"
            step="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount')}
          />
        </div>
        <div className="w-28">
          <label className="text-sm font-medium text-gray-700 block mb-1">Moneda</label>
          <select
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register('currency')}
          >
            <option value="ARS">ARS</option>
            <option value="BRL">BRL</option>
            <option value="CLP">CLP</option>
            <option value="MXN">MXN</option>
            <option value="COP">COP</option>
            <option value="UYU">UYU</option>
          </select>
        </div>
      </div>

      <Input
        id="maxPayments"
        label="Límite de pagos (opcional)"
        type="number"
        min="1"
        placeholder="Sin límite"
        error={errors.maxPayments?.message}
        {...register('maxPayments')}
      />

      <Input
        id="expiresAt"
        label="Fecha de expiración (opcional)"
        type="datetime-local"
        error={errors.expiresAt?.message}
        {...register('expiresAt')}
      />

      {mode === 'edit' && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-700">Link activo</p>
            <p className="text-xs text-gray-400">Los pagadores pueden acceder y pagar</p>
          </div>
          <button
            type="button"
            onClick={() => setValue('isActive', !isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              isActive ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={isSubmitting} size="lg">
          {mode === 'create' ? 'Crear link de cobro' : 'Guardar cambios'}
        </Button>
        <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
