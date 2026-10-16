import { useCallback, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS } from '../config';
import { ApiError, authApi } from '../lib/api';
import { readJSON, readString, removeKey, writeJSON, writeString } from '../lib/storage';
import { AuthContext } from './auth-context';

/** Revisa si un JWT ya expiró (si el token no es JWT se considera válido). */
function isTokenExpired(token) {
  try {
    const [, payload] = token.split('.');
    if (!payload) return false;
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof json.exp === 'number' && json.exp * 1000 < Date.now();
  } catch {
    return false;
  }
}

function clearSession() {
  removeKey(STORAGE_KEYS.user);
  removeKey(STORAGE_KEYS.token);
}

function readSession() {
  const user = readJSON(STORAGE_KEYS.user);
  const token = readString(STORAGE_KEYS.token);
  if (!user || !token) return null;
  if (isTokenExpired(token)) {
    clearSession();
    return null;
  }
  return user;
}

/**
 * Sesión del usuario. A diferencia del sitio original, NO existe ningún
 * usuario/contraseña de respaldo en el código: el acceso depende solo de la API.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  const login = useCallback(async (identifier, password) => {
    const response = await authApi.login(identifier.trim(), password);
    const sessionUser = response?.data?.user;
    const token = response?.data?.access_token;
    if (!sessionUser || !token) {
      throw new ApiError('Respuesta inesperada del servidor. Inténtalo de nuevo.');
    }
    writeJSON(STORAGE_KEYS.user, sessionUser);
    writeString(STORAGE_KEYS.token, token);
    setUser(sessionUser);
    return sessionUser;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  // Mantiene la sesión sincronizada entre pestañas.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === STORAGE_KEYS.user || event.key === STORAGE_KEYS.token || event.key === null) {
        setUser(readSession());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(() => ({ user, isAuthenticated: Boolean(user), login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
