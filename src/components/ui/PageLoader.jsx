/** Indicador de carga para páginas que se cargan bajo demanda. */
export default function PageLoader({ label = 'Cargando aventura…' }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="animate-float text-6xl" aria-hidden="true">
          🚀
        </span>
        <span className="relative h-2 w-40 overflow-hidden rounded-full bg-emerald-100">
          <span className="animate-progress absolute inset-y-0 left-0 w-1/3 rounded-full bg-emerald-500" />
        </span>
        <p className="font-display text-lg font-semibold text-slate-600">{label}</p>
      </div>
    </div>
  );
}
