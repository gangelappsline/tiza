import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

/** Acceso a la sesión: { user, isAuthenticated, login, logout }. */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return context;
}
