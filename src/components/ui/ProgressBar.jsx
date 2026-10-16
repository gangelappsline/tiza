import { cn } from '../../lib/utils';

const TONES = {
  emerald: 'from-emerald-400 to-emerald-600',
  sky: 'from-sky-400 to-sky-600',
  violet: 'from-violet-400 to-violet-600',
  amber: 'from-amber-300 to-amber-500',
};

export default function ProgressBar({ value, max = 100, tone = 'emerald', className, label }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      className={cn('h-3 overflow-hidden rounded-full bg-slate-200/80', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
    >
      <div
        className={cn('h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ease-out', TONES[tone] ?? TONES.emerald)}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
