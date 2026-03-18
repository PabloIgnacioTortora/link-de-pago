'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ShareQRProps {
  url: string;
}

export default function ShareQR({ url }: ShareQRProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        {open ? 'Ocultar QR' : 'Mostrar QR para compartir'}
      </button>

      {open && (
        <div className="mt-3 flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <QRCodeSVG value={url} size={180} includeMargin />
          <button
            onClick={() => navigator.clipboard.writeText(url)}
            className="text-xs text-indigo-600 hover:underline"
          >
            Copiar link
          </button>
        </div>
      )}
    </div>
  );
}
