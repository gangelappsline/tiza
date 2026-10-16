import { createBrowserRouter } from 'react-router';
import AppShell from './components/layout/AppShell';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import RouteError from './components/RouteError';
import PageLoader from './components/ui/PageLoader';
import { COMING_SOON_SECTIONS } from './data/sections';
import ComingSoonPage from './pages/ComingSoonPage';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import PanelPage from './pages/PanelPage';

/** Carga diferida: cada página se descarga solo cuando se visita. */
const page = (load) => async () => ({ Component: (await load()).default });

const memoryGame = page(() => import('./pages/MemoryGamePage'));
const mathPractice = page(() => import('./pages/MathPracticePage'));
const sentenceOrder = page(() => import('./pages/SentenceOrderPage'));

export const router = createBrowserRouter([
  {
    Component: AppShell,
    ErrorBoundary: RouteError,
    HydrateFallback: PageLoader,
    children: [
      {
        Component: Layout,
        children: [
          { index: true, Component: HomePage },
          // Actividades (se conservan también las rutas alternativas del sitio original)
          { path: 'actividad/memorama', lazy: memoryGame },
          { path: 'actividad/matematicas', lazy: mathPractice },
          { path: 'math-practice', lazy: mathPractice },
          { path: 'actividad/ordenar-oraciones', lazy: sentenceOrder },
          { path: 'actividad/espanol', lazy: sentenceOrder },
          // Juegos
          { path: 'juegos/nave', lazy: page(() => import('./pages/SpaceBattlePage')) },
          { path: 'juegos/tamagochi', lazy: page(() => import('./pages/VirtualPetPage')) },
          // Información
          { path: 'ayuda', lazy: page(() => import('./pages/HelpPage')) },
          ...Object.keys(COMING_SOON_SECTIONS).map((section) => ({
            path: section,
            element: <ComingSoonPage section={section} />,
          })),
          { path: '*', Component: NotFoundPage },
        ],
      },
      { path: 'login', lazy: page(() => import('./pages/LoginPage')) },
      // Paneles privados (fuera del alcance de esta reconstrucción)
      {
        path: 'admin/*',
        element: (
          <ProtectedRoute>
            <PanelPage area="admin" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'maestro/*',
        element: (
          <ProtectedRoute>
            <PanelPage area="maestro" />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
