import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/auth/SessionProvider';
import { auth } from '@/auth';
import { Toaster } from 'sonner';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

const APP_URL = 'https://link-de-pago.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'LinkPago — Cobros simples con un link',
    template: '%s | LinkPago',
  },
  description:
    'Creá links de cobro en segundos y compartílos por WhatsApp o Instagram. Tus clientes pagan con tarjeta o transferencia vía MercadoPago. Empezá gratis.',
  keywords: [
    'link de pago',
    'cobros online',
    'MercadoPago',
    'link de cobro',
    'pagar con link',
    'generar link de pago',
    'cobrar por WhatsApp',
    'pagos digitales Argentina',
    'plataforma de cobros',
  ],
  authors: [{ name: 'LinkPago', url: APP_URL }],
  creator: 'LinkPago',
  publisher: 'LinkPago',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: APP_URL,
    siteName: 'LinkPago',
    title: 'LinkPago — Cobros simples con un link',
    description:
      'Creá links de cobro en segundos y compartílos por WhatsApp o Instagram. Tus clientes pagan con MercadoPago. Empezá gratis.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'LinkPago' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkPago — Cobros simples con un link',
    description:
      'Creá links de cobro en segundos y compartílos por WhatsApp o Instagram. Empezá gratis.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: APP_URL,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="es">
      <body className={`${geist.variable} font-sans antialiased bg-gray-50`}>
        <SessionProvider session={session}>{children}</SessionProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
