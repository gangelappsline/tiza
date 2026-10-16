import { ChevronDown, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { getPanelPathForRole } from '../../config';
import { useAuth } from '../../context/auth-context';
import { cn } from '../../lib/utils';
import Logo from '../ui/Logo';

const NAV_LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/actividades', label: 'Mis Actividades' },
  { to: '/clasificacion', label: 'Clasificación' },
  { to: '/aula', label: 'Aula Virtual' },
];

const GAME_LINKS = [
  { to: '/juegos/nave', label: 'Nave Espacial', description: 'Batalla espacial de sumas', emoji: '🚀' },
  { to: '/juegos/tamagochi', label: 'Tamagochi', description: 'Cuida y entrena a tu mascota', emoji: '🐶' },
];

const linkClass = ({ isActive }) =>
  cn(
    'relative rounded-xl px-3 py-2 text-[0.95rem] font-bold transition',
    isActive ? 'text-emerald-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  );

function initials(user) {
  const source = user?.username || user?.name || user?.email || 'TU';
  return source
    .replace(/@.*/, '')
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function GamesDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={cn(
          'flex items-center gap-1 rounded-xl px-3 py-2 text-[0.95rem] font-bold transition',
          open ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        )}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        Juegos
        <ChevronDown className={cn('size-4 transition', open && 'rotate-180')} aria-hidden="true" />
      </button>
      <div
        id={menuId}
        className={cn(
          'absolute top-full left-1/2 z-50 w-72 -translate-x-1/2 pt-2 transition',
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0',
        )}
      >
        <ul className="card overflow-hidden p-2 shadow-xl">
          {GAME_LINKS.map((game) => (
            <li key={game.to}>
              <Link
                to={game.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-emerald-50"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-emerald-100 text-2xl" aria-hidden="true">
                  {game.emoji}
                </span>
                <span className="flex flex-col">
                  <span className="font-bold text-slate-900">{game.label}</span>
                  <span className="text-sm text-slate-500">{game.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const panelPath = user ? getPanelPathForRole(user.role) : null;
  const mobileMenuId = useId();

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    logout();
    closeMobile();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90">
      <div className="container-page flex h-[4.5rem] items-center justify-between gap-4">
        <Logo imgClassName="h-10 sm:h-11" />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegación principal">
          {NAV_LINKS.slice(0, 2).map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
          <GamesDropdown />
          {NAV_LINKS.slice(2).map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to={panelPath || '/'} className="btn btn-sm btn-ghost" title="Ir a mi panel">
                <span
                  className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-xs font-bold text-white"
                  aria-hidden="true"
                >
                  {initials(user)}
                </span>
                <span className="hidden md:inline">{panelPath ? 'Mi panel' : user.username || 'Mi cuenta'}</span>
              </Link>
              <button type="button" onClick={handleLogout} className="btn btn-sm btn-ghost" title="Cerrar sesión">
                <LogOut className="size-4" aria-hidden="true" />
                <span className="sr-only">Cerrar sesión</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-sm hidden border-2 border-emerald-500 px-4 text-emerald-700 hover:bg-emerald-50 sm:inline-flex"
            >
              Iniciar Sesión
            </Link>
          )}

          <button
            type="button"
            className="btn btn-sm btn-ghost size-11 p-0 lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls={mobileMenuId}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
            <span className="sr-only">{mobileOpen ? 'Cerrar menú' : 'Abrir menú'}</span>
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      <div
        id={mobileMenuId}
        className={cn(
          'border-t border-slate-200 bg-white lg:hidden',
          mobileOpen ? 'block animate-fade-in-up' : 'hidden',
        )}
      >
        <nav className="container-page flex flex-col gap-1 py-4" aria-label="Navegación móvil">
          {NAV_LINKS.slice(0, 2).map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass} onClick={closeMobile}>
              {link.label}
            </NavLink>
          ))}
          <p className="mt-2 px-3 text-xs font-bold tracking-wider text-slate-400 uppercase">Juegos</p>
          {GAME_LINKS.map((game) => (
            <NavLink key={game.to} to={game.to} className={linkClass} onClick={closeMobile}>
              <span className="mr-2" aria-hidden="true">
                {game.emoji}
              </span>
              {game.label}
            </NavLink>
          ))}
          <div className="my-2 h-px bg-slate-100" />
          {NAV_LINKS.slice(2).map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass} onClick={closeMobile}>
              {link.label}
            </NavLink>
          ))}
          <div className="mt-3 grid gap-2 sm:hidden">
            {user ? (
              <>
                <Link to={panelPath || '/'} className="btn btn-md btn-secondary" onClick={closeMobile}>
                  <LayoutDashboard className="size-5" aria-hidden="true" />
                  {panelPath ? 'Mi panel' : 'Mi cuenta'}
                </Link>
                <button type="button" onClick={handleLogout} className="btn btn-md btn-ghost">
                  <LogOut className="size-5" aria-hidden="true" />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-md btn-primary" onClick={closeMobile}>
                Iniciar Sesión
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
