export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Cargando"
    />
  );
}
