import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

/** Pantalla amigable cuando ocurre un error inesperado en una ruta. */
export default function RouteError() {
  const error = useRouteError();
  const isChunkError = error instanceof Error && /dynamically imported module|Importing a module script failed/i.test(error.message);
  const title = isRouteErrorResponse(error) ? `Error ${error.status}` : '¡Ups! Algo salió mal';
  const message = isChunkError
    ? 'Hay una nueva versión de Tiza disponible. Recarga la página para continuar.'
    : 'Ocurrió un error inesperado. Intenta recargar la página o vuelve al inicio.';

  if (import.meta.env.DEV) console.error(error);

  return (
    <div className="grid min-h-dvh place-items-center bg-slate-50 px-4">
      <div className="card max-w-lg p-8 text-center sm:p-10">
        <div className="mb-4 text-6xl" aria-hidden="true">
          🛸
        </div>
        <h1 className="mb-3 text-3xl font-bold">{title}</h1>
        <p className="mb-8 text-slate-600">{message}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" className="btn btn-md btn-primary" onClick={() => window.location.reload()}>
            🔄 Recargar página
          </button>
          <Link to="/" reloadDocument className="btn btn-md btn-secondary">
            🏠 Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
