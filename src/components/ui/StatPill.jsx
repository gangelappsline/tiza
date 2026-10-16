import { cn } from '../../lib/utils';

const TONES = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  slate: 'bg-white text-slate-700 ring-slate-200',
};

/** Indicador compacto: icono + etiqueta + valor. */
export default function StatPill({ icon, label, value, tone = 'slate', className }) {
  return (
    <div className={cn('flex items-center gap-2.5 rounded-2xl px-4 py-2.5 ring-1', TONES[tone], className)}>
      <span className="text-xl leading-none" aria-hidden="true">
        {icon}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[0.7rem] font-bold tracking-wide uppercase opacity-75">{label}</span>
        <span className="font-display text-xl font-bold tabular-nums">{value}</span>
      </span>
    </div>
  );
}
