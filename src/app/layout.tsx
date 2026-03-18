import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/auth/SessionProvider';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'LinkPago — Cobra con un link',
  description: 'Genera links de cobro y recibe pagos al instante con MercadoPago.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geist.variable} font-sans antialiased bg-gray-50`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
