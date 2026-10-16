import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/auth-context';

/** Redirige al inicio de sesión si no hay una sesión activa. */
export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
