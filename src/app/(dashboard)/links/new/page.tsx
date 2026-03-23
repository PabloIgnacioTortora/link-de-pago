import { auth } from '@/auth';
import Header from '@/components/dashboard/Header';
import PaymentLinkForm from '@/components/links/PaymentLinkForm';

export default async function NewLinkPage() {
  const session = await auth();
  return (
    <div className="flex-1 overflow-auto">
      <Header title="Crear Link de Cobro" />
      <main className="p-6">
        <PaymentLinkForm mode="create" isPro={session?.user?.plan === 'pro'} />
      </main>
    </div>
  );
}
