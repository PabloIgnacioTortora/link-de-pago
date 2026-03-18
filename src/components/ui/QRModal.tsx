'use client';

import { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

export default function QRModal({ url, title, onClose }: QRModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col items-center gap-4">
        <div className="flex items-center justify-between w-full">
          <h2 className="font-semibold text-gray-800">Código QR</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-500 text-center">{title}</p>

        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <QRCodeSVG value={url} size={200} includeMargin />
        </div>

        <p className="text-xs text-gray-400 text-center break-all">{url}</p>

        <button
          onClick={() => navigator.clipboard.writeText(url)}
          className="w-full py-2 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Copiar link
        </button>
      </div>
    </div>
  );
}
