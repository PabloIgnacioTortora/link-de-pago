import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import connectDB from '@/lib/db/mongoose';
import PaymentLink from '@/models/PaymentLink';
import Header from '@/components/dashboard/Header';
import PaymentLinkForm from '@/components/links/PaymentLinkForm';

export default async function EditLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  await connectDB();
  const link = await PaymentLink.findOne({ _id: id, merchantId: session?.user?.id }).lean();
  if (!link) notFound();

  const serialized = JSON.parse(JSON.stringify(link));

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Editar Link" />
      <main className="p-6">
        <PaymentLinkForm mode="edit" initialData={{ ...serialized, _id: String(serialized._id) }} isPro={session?.user?.plan === 'pro'} />
      </main>
    </div>
  );
}
