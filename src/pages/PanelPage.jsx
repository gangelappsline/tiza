import { LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import Logo from '../components/ui/Logo';
import { useAuth } from '../context/auth-context';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Página temporal para /admin/* y /maestro/*.
 * Los paneles privados no forman parte de esta reconstrucción (solo páginas públicas).
 */
export default function PanelPage({ area }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = area === 'admin';
  useDocumentTitle(isAdmin ? 'Panel de administración' : 'Panel del maestro');

  return (
    <div className="grid min-h-dvh place-items-center bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-4 py-10">
      <div className="card w-full max-w-lg p-8 text-center sm:p-10">
        <Logo className="mb-6 justify-center" imgClassName="h-14" />
        <div className="mb-4 text-6xl" aria-hidden="true">
          {isAdmin ? '🛠️' : '👩‍🏫'}
        </div>
        <h1 className="mb-2 text-3xl font-bold">¡Hola{user?.username ? `, ${user.username}` : ''}!</h1>
        <p className="mb-2 font-bold text-emerald-700">{isAdmin ? 'Panel de administración' : 'Panel del maestro'}</p>
        <p className="mb-8 text-slate-600">
          Estamos dando mantenimiento a este panel. Muy pronto volverá a estar disponible con todas sus herramientas.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="btn btn-md btn-primary">
            Ir a la biblioteca
          </Link>
          <button
            type="button"
            className="btn btn-md btn-secondary"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
