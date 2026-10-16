import { Link } from 'react-router';
import Logo from '../ui/Logo';

const COLUMNS = [
  {
    title: 'Actividades',
    links: [
      { to: '/actividad/memorama', label: 'Memoria de Vocales' },
      { to: '/actividad/matematicas', label: 'Práctica de Matemáticas' },
      { to: '/actividad/ordenar-oraciones', label: 'Ordenar Oraciones' },
    ],
  },
  {
    title: 'Juegos',
    links: [
      { to: '/juegos/nave', label: 'Nave Espacial' },
      { to: '/juegos/tamagochi', label: 'Tamagochi' },
      { to: '/', label: 'Biblioteca Pública' },
    ],
  },
  {
    title: 'Soporte',
    links: [
      { to: '/ayuda', label: 'Centro de Ayuda' },
      { to: '/contacto', label: 'Contáctanos' },
      { to: '/privacidad', label: 'Política de Privacidad' },
      { to: '/terminos', label: 'Términos de Servicio' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo imgClassName="h-12" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
            Aprende de forma divertida con Tiza, la plataforma educativa gamificada para niños y jóvenes.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-8">
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="mb-3 font-sans text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                {column.title}
              </h2>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm font-semibold text-slate-600 transition hover:text-emerald-600">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-100">
        <p className="container-page py-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Tiza Interactive. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
