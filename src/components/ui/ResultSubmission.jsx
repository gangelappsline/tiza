import { CircleAlert, CircleCheck, LoaderCircle, RotateCcw } from 'lucide-react';

/** Estado del envío de resultados al maestro, con opción de reintentar. */
export default function ResultSubmission({ status, error, onRetry, studentName }) {
  if (status === 'idle') return null;

  if (status === 'sending') {
    return (
      <p className="flex items-center justify-center gap-2 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700" role="status">
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        Enviando tus resultados…
      </p>
    );
  }

  if (status === 'sent') {
    return (
      <p className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status">
        <CircleCheck className="size-4" aria-hidden="true" />
        ¡Listo{studentName ? `, ${studentName}` : ''}! Tus resultados se enviaron a tu maestro.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 sm:flex-row" role="alert">
      <span className="flex items-center gap-2">
        <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
        No pudimos enviar tus resultados. {error}
      </span>
      <button type="button" onClick={onRetry} className="btn btn-sm border-2 border-rose-200 bg-white text-rose-700 hover:border-rose-400">
        <RotateCcw className="size-4" aria-hidden="true" />
        Reintentar
      </button>
    </div>
  );
}
