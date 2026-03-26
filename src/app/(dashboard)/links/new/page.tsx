import { auth } from '@/auth';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import Link from 'next/link';
import Header from '@/components/dashboard/Header';
import PaymentLinkForm from '@/components/links/PaymentLinkForm';

export default async function NewLinkPage() {
  const session = await auth();

  await connectDB();
  const user = await User.findById(session?.user?.id).select('mpAccessToken');
  const hasMpToken = !!user?.mpAccessToken;

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Crear Link de Cobro" />
      <main className="p-6">
        {!hasMpToken ? (
          <div className="max-w-lg bg-amber-50 border border-amber-200 rounded-xl px-5 py-6 space-y-3">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">Conectá tu cuenta de MercadoPago</p>
                <p className="text-xs text-amber-700 mt-1">
                  Para crear links de pago necesitás conectar tu cuenta de MercadoPago primero.
                </p>
              </div>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Ir a Configuración →
            </Link>
          </div>
        ) : (
          <PaymentLinkForm mode="create" isPro={session?.user?.plan === 'pro'} />
        )}
      </main>
    </div>
  );
}
