import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-indigo-500 mb-4">404</p>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Página no encontrada</h1>
        <p className="text-sm text-gray-500 mb-6">El link que buscás no existe o fue desactivado.</p>
        <Link
          href="/"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
