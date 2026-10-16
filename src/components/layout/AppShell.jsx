import { Outlet, ScrollRestoration } from 'react-router';

/** Raíz de la aplicación: restaura el scroll al navegar. */
export default function AppShell() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}
