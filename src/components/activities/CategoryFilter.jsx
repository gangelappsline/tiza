import { CATEGORIES } from '../../data/activities';
import { cn } from '../../lib/utils';

export default function CategoryFilter({ active, counts, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5" role="group" aria-label="Filtrar por categoría">
      <span className="mr-1 text-sm font-extrabold tracking-wide text-slate-500 uppercase">Filtros:</span>
      {CATEGORIES.map(({ id, label, icon: Icon }) => {
        const selected = active === id;
        const count = counts?.[id] ?? 0;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={selected}
            className={cn(
              'flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold transition duration-200',
              selected
                ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
            <span
              className={cn(
                'min-w-6 rounded-full px-1.5 text-xs tabular-nums',
                selected ? 'bg-white/25' : 'bg-slate-100 text-slate-500',
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
