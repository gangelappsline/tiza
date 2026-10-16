import { SORT_OPTIONS } from '../../data/activities';
import { cn } from '../../lib/utils';

export default function SortTabs({ active, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b-2 border-slate-200" role="group" aria-label="Ordenar actividades">
      {SORT_OPTIONS.map((option) => {
        const selected = active === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={selected}
            className={cn(
              'relative shrink-0 rounded-t-xl px-5 py-3.5 font-extrabold transition sm:px-8',
              selected ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-100 hover:text-emerald-700',
            )}
          >
            {option.label}
            {selected && <span className="absolute inset-x-0 -bottom-0.5 h-1 rounded-full bg-emerald-500" />}
          </button>
        );
      })}
    </div>
  );
}
