import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { APP_NAME, SITE_URL } from '../config';

const DEFAULT_TITLE = 'Tiza - Plataforma Educativa Interactiva';
const DEFAULT_DESCRIPTION =
  'Aprende de forma divertida con Tiza, la plataforma educativa gamificada para niños y jóvenes: juegos de vocales, matemáticas, oraciones y desafíos espaciales.';

/** Actualiza el título, la meta descripción y la URL canónica de cada página. */
export function useDocumentTitle(title, description) {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : DEFAULT_TITLE;

    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description || DEFAULT_DESCRIPTION);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
    canonical.setAttribute('href', `${SITE_URL}${path}`);
  }, [title, description, pathname]);
}
