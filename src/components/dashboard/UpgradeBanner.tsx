'use client';

import { useState } from 'react';

export default function UpgradeBanner() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    const res = await fetch('/api/subscription/create', { method: 'POST' });
    const data = await res.json();
    if (data.initPoint) {
      window.location.href = data.initPoint;
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="mx-4 md:mx-6 mt-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="text-white">
        <p className="font-semibold text-sm">Estás en el plan Free</p>
        <p className="text-xs text-indigo-200 mt-0.5">Hasta 2 links activos · Sin marca propia · Sin QR · Sin emails</p>
      </div>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="shrink-0 bg-white text-indigo-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-60"
      >
        {loading ? 'Redirigiendo...' : 'Ir a Pro — $15.000/mes'}
      </button>
    </div>
  );
}
