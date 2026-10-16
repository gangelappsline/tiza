/** Configuración global de la aplicación. */

export const APP_NAME = 'Tiza';
export const SITE_URL = 'https://tiza.appsline.com.mx';

const DEFAULT_API_URL = 'https://tiza-api.appsline.com.mx/api';

/**
 * URL base de la API.
 * - Se puede sobrescribir con la variable VITE_API_URL (ver .env.example).
 * - En desarrollo se usa el proxy de Vite (/api) para evitar problemas de CORS.
 */
export const API_URL = (
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : DEFAULT_API_URL)
).replace(/\/+$/, '');

export const API_TIMEOUT_MS = 30_000;

/** Claves de localStorage (se conservan las del sitio original para no perder sesiones ni progreso). */
export const STORAGE_KEYS = {
  user: 'tiza_user',
  token: 'tiza_token',
  sound: 'tiza_sound_enabled',
  voice: 'tiza_voice_enabled',
  memoryBest: 'tiza_memorama_record',
  spaceRecord: 'tiza_nave_record',
  pet: 'mascota_ia_profile_v1',
};

/** Rutas del panel según el rol devuelto por la API. */
export function getPanelPathForRole(role) {
  switch (String(role || '').toLowerCase()) {
    case 'administrator':
    case 'admin':
      return '/admin/dashboard';
    case 'teacher':
    case 'maestro':
      return '/maestro/dashboard';
    default:
      return null;
  }
}
