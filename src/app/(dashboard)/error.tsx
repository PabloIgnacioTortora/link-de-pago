'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Algo salió mal</h2>
        <p className="text-sm text-gray-500 mb-6">{error.message ?? 'Error inesperado. Intentá de nuevo.'}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
