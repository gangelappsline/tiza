import { Link } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('Página no encontrada');
  return (
    <div className="container-page grid min-h-[65vh] place-items-center py-14">
      <div className="text-center">
        <div className="relative mx-auto mb-6 w-fit">
          <span className="animate-float block text-8xl" aria-hidden="true">
            🧑‍🚀
          </span>
          <span className="animate-twinkle absolute -top-2 -right-6 text-3xl" aria-hidden="true">
            ✨
          </span>
        </div>
        <p className="mb-2 font-display text-7xl font-bold text-gradient">404</p>
        <h1 className="mb-3 text-3xl font-bold sm:text-4xl">¡Houston, tenemos un problema!</h1>
        <p className="mx-auto mb-8 max-w-md text-lg text-slate-600">
          Esta página se perdió en el espacio. Revisa la dirección o regresa a la biblioteca para seguir aprendiendo.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="btn btn-lg btn-primary">
            🏠 Volver al inicio
          </Link>
          <Link to="/juegos/nave" className="btn btn-lg btn-secondary">
            🚀 Jugar Nave Espacial
          </Link>
        </div>
      </div>
    </div>
  );
}
