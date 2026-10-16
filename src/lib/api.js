import { API_TIMEOUT_MS, API_URL, STORAGE_KEYS } from '../config';
import { readString } from './storage';

/** Error de la API con un mensaje listo para mostrar al usuario. */
export class ApiError extends Error {
  constructor(message, { status = 0, data = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const STATUS_MESSAGES = {
  400: 'La solicitud no es válida. Revisa los datos e inténtalo de nuevo.',
  401: 'Usuario o contraseña incorrectos.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No encontramos lo que buscabas.',
  409: 'Ya existe un registro con esos datos.',
  422: 'Revisa los datos ingresados.',
  429: 'Demasiados intentos. Espera un momento antes de volver a intentarlo.',
  500: 'Ocurrió un error en el servidor. Inténtalo más tarde.',
  503: 'El servicio no está disponible en este momento. Inténtalo más tarde.',
};

function messageForStatus(status) {
  return STATUS_MESSAGES[status] || `Ocurrió un error inesperado (código ${status}).`;
}

/**
 * Petición genérica a la API de Tiza.
 * @param {string} path Ruta relativa, p. ej. "/auth/login".
 * @param {{ method?: string, body?: unknown, auth?: boolean, timeout?: number, signal?: AbortSignal }} options
 */
export async function request(path, { method = 'GET', body, auth = true, timeout = API_TIMEOUT_MS, signal } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener('abort', onExternalAbort, { once: true });

  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = readString(STORAGE_KEYS.token);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    if (signal?.aborted) throw new ApiError('La operación fue cancelada.');
    if (controller.signal.aborted) {
      throw new ApiError('El servidor tardó demasiado en responder. Inténtalo de nuevo.');
    }
    throw new ApiError('No pudimos conectar con el servidor. Revisa tu conexión a internet.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onExternalAbort);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const apiMessage = typeof data?.message === 'string' ? data.message : null;
    throw new ApiError(apiMessage || messageForStatus(response.status), { status: response.status, data });
  }
  return data;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

/** Autenticación y recuperación de contraseña (mismos endpoints que el sitio original). */
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }, { auth: false }),
  requestPasswordCode: (email) => api.post('/password/request-code', { email }, { auth: false }),
  verifyPasswordCode: (email, code) => api.post('/password/verify-code', { email, code }, { auth: false }),
  resetPassword: (email, code, newPassword) =>
    api.post('/password/reset', { email, code, newPassword }, { auth: false }),
};

/** Envío de resultados de actividades asignadas por un maestro. */
export const activityApi = {
  submitMathResults: (payload) => api.post('/actividades/matematicas/respuestas', payload),
  submitSpanishResults: (payload) => api.post('/actividades/espanol/respuestas', payload),
};
