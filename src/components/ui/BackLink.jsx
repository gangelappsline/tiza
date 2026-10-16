import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '../../lib/utils';

export default function BackLink({ to = '/', children = 'Volver a Actividades', className }) {
  return (
    <Link
      to={to}
      className={cn(
        'group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-emerald-700 hover:shadow-sm',
        className,
      )}
    >
      <ArrowLeft className="size-4 transition group-hover:-translate-x-0.5" aria-hidden="true" />
      {children}
    </Link>
  );
}
