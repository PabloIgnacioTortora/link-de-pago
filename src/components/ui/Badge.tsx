import { clsx } from 'clsx';

type BadgeVariant = 'approved' | 'pending' | 'rejected' | 'cancelled' | 'refunded' | 'active' | 'inactive';

const variants: Record<BadgeVariant, string> = {
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
  refunded: 'bg-purple-100 text-purple-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-600',
};

const labels: Record<BadgeVariant, string> = {
  approved: 'Aprobado',
  pending: 'Pendiente',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  active: 'Activo',
  inactive: 'Inactivo',
};

export default function Badge({ variant }: { variant: BadgeVariant }) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant])}>
      {labels[variant]}
    </span>
  );
}
