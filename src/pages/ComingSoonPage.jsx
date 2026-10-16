import { Link } from 'react-router';
import { COMING_SOON_SECTIONS } from '../data/sections';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function ComingSoonPage({ section }) {
  const info = COMING_SOON_SECTIONS[section] ?? COMING_SOON_SECTIONS.actividades;
  useDocumentTitle(info.title);
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-14">
      <div className="card relative w-full max-w-xl overflow-hidden p-8 text-center sm:p-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400" />
        <div className="animate-float mb-5 text-7xl" aria-hidden="true">
          {info.emoji}
        </div>
        <span className="chip mb-4 bg-amber-100 text-amber-800">🚧 Próximamente</span>
        <h1 className="mb-3 text-3xl font-bold sm:text-4xl">{info.title}</h1>
        <p className="mb-8 text-lg text-slate-600">{info.text}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="btn btn-md btn-primary">
            Explorar actividades
          </Link>
          <Link to="/ayuda" className="btn btn-md btn-secondary">
            Centro de Ayuda
          </Link>
        </div>
      </div>
    </div>
  );
}
