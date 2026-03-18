import Header from '@/components/dashboard/Header';
import PaymentLinkForm from '@/components/links/PaymentLinkForm';

export default function NewLinkPage() {
  return (
    <div className="flex-1 overflow-auto">
      <Header title="Crear Link de Cobro" />
      <main className="p-6">
        <PaymentLinkForm mode="create" />
      </main>
    </div>
  );
}
