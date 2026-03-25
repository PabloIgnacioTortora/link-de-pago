import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import connectDB from '@/lib/db/mongoose';
import PaymentLink from '@/models/PaymentLink';
import User from '@/models/User';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import PaymentOptions from '@/components/payment/PaymentOptions';
import ShareQR from '@/components/payment/ShareQR';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const link = await PaymentLink.findOne({ slug }).lean();
  if (!link) return {};

  const merchant = await User.findById(link.merchantId).select('businessName name plan').lean();
  const merchantName = merchant?.plan === 'pro'
    ? (merchant?.businessName ?? merchant?.name ?? 'LinkPago')
    : 'LinkPago';

  const title = `${link.title} — ${merchantName}`;
  const description = link.description
    ? `${link.description} · Pagá ${formatCurrency(link.amount, link.currency)} de forma segura con MercadoPago.`
    : `Pagá ${formatCurrency(link.amount, link.currency)} de forma segura con MercadoPago.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    robots: { index: false, follow: false },
  };
}

export default async function PayPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;

  await connectDB();

  const link = await PaymentLink.findOne({ slug }).lean();
  if (!link) notFound();

  const merchant = await User.findById(link.merchantId).select('name businessName brandColor brandLogo mpAccessToken transferCbu transferAlias transferHolder plan').lean();

  const isExpired = link.expiresAt && new Date() > new Date(link.expiresAt);
  const isMaxed = link.maxPayments && link.paymentCount >= link.maxPayments;
  const isUnavailable = !link.isActive || isExpired || isMaxed;

  const isPro = merchant?.plan === 'pro';
  const brandColor = isPro ? (merchant?.brandColor ?? '#6366f1') : '#6366f1';
  const merchantName = isPro
    ? (merchant?.businessName ?? merchant?.name ?? 'Comerciante')
    : 'LinkPago';
  const brandLogo = isPro ? (merchant?.brandLogo ?? null) : null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header de marca */}
        <div
          className="rounded-t-2xl p-6 text-white text-center"
          style={{ backgroundColor: brandColor }}
        >
          {brandLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brandLogo} alt={merchantName} className="h-12 w-auto mx-auto mb-2 rounded object-contain" />
          ) : (
            <p className="text-sm font-medium opacity-80 mb-1">Pago para</p>
          )}
          <h1 className="text-xl font-bold">{merchantName}</h1>
        </div>

        {/* Card de pago */}
        <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">{link.title}</h2>
          {link.description && <p className="text-sm text-gray-500 mb-5">{link.description}</p>}

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
            <p className="text-xs text-gray-400 mb-1">Total a pagar</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(link.amount, link.currency)}
            </p>
          </div>

          {error && (
            <div role="alert" className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 mb-4 text-sm text-red-600">
              Hubo un problema con el pago. Por favor intentá de nuevo.
            </div>
          )}

          {isUnavailable ? (
            <div role="status" className="bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-4 text-center text-sm text-yellow-700">
              {!link.isActive && 'Este link de cobro no está disponible.'}
              {isExpired && 'Este link ha expirado.'}
              {isMaxed && 'Este link ya alcanzó el límite de pagos.'}
            </div>
          ) : (
            <PaymentOptions
              slug={slug}
              amount={link.amount}
              currency={link.currency}
              brandColor={brandColor}
              hasCard={!!merchant?.mpAccessToken}
              transfer={
                (merchant?.transferCbu || merchant?.transferAlias)
                  ? { cbu: merchant.transferCbu, alias: merchant.transferAlias, holder: merchant.transferHolder }
                  : undefined
              }
            />
          )}

          <p className="text-xs text-gray-400 text-center mt-4">
            Pago seguro procesado por MercadoPago
          </p>

          <ShareQR url={`${process.env.NEXT_PUBLIC_APP_URL}/pay/${slug}`} title={link.title} />
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Generado con <span className="font-medium text-indigo-500">LinkPago</span>
        </p>
      </div>
    </div>
  );
}
