import { Outlet, useNavigation } from 'react-router';
import Footer from './Footer';
import Header from './Header';

/** Estructura pública: encabezado + contenido + pie de página. */
export default function Layout() {
  const navigation = useNavigation();
  const loading = navigation.state === 'loading';

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      {loading && (
        <div className="fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden bg-emerald-100" role="progressbar" aria-label="Cargando página">
          <div className="animate-progress h-full w-1/3 bg-emerald-500" />
        </div>
      )}
      <Header />
      <main id="contenido" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
