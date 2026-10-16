import { GraduationCap, Search, Sparkles, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import heroLarge from '../assets/hero-880.webp';
import heroSmall from '../assets/hero-480.webp';
import ActivityCard from '../components/activities/ActivityCard';
import CategoryFilter from '../components/activities/CategoryFilter';
import SortTabs from '../components/activities/SortTabs';
import ProgressBar from '../components/ui/ProgressBar';
import { ACTIVITIES, CATEGORIES, PAGE_SIZE, SORT_OPTIONS } from '../data/activities';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { countByCategory, filterActivities, sortActivities } from '../lib/catalog';

const PLAYABLE = ACTIVITIES.filter((a) => a.link);
const GAMES = PLAYABLE.filter((a) => a.type === 'game');

function FloatingBadge({ className, children }) {
  return (
    <span
      className={`absolute hidden rounded-2xl bg-white/95 px-3.5 py-2 text-sm font-extrabold shadow-xl ring-1 ring-slate-900/5 sm:block ${className}`}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

function Hero({ search, onSearchChange, onSearchSubmit }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-sky-50">
      <div className="bg-dots pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-sky-200/40 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full bg-emerald-200/40 blur-3xl" aria-hidden="true" />

      <div className="container-page relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-12 lg:py-20">
        <div className="animate-fade-in-up lg:col-span-7">
          <span className="chip mb-5 bg-white text-sm text-emerald-700 shadow-sm ring-1 ring-emerald-200">
            <Sparkles className="size-4" aria-hidden="true" />
            Plataforma educativa gamificada
          </span>
          <h1 className="mb-5 text-4xl leading-[1.08] font-bold sm:text-5xl lg:text-6xl">
            Biblioteca Pública de <span className="text-gradient">Actividades</span>
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
            Sube de nivel tu aprendizaje con aventuras interactivas, tareas gamificadas y desafíos interestelares.
          </p>

          <form role="search" className="relative mt-8 max-w-2xl" onSubmit={onSearchSubmit}>
            <label htmlFor="buscar-actividades" className="sr-only">
              Buscar actividades
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-5 size-6 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="buscar-actividades"
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar actividades, temas o habilidades..."
              autoComplete="off"
              className="w-full rounded-2xl border-2 border-slate-200 bg-white py-5 pr-32 pl-14 text-base shadow-lg shadow-slate-900/5 transition placeholder:text-slate-400 hover:shadow-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute top-1/2 right-28 grid size-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">Borrar búsqueda</span>
              </button>
            )}
            <button type="submit" className="btn btn-primary absolute top-1/2 right-2.5 -translate-y-1/2 px-6 py-3">
              Buscar
            </button>
          </form>

          <ul className="mt-8 flex flex-wrap gap-3 text-sm font-bold text-slate-600">
            <li className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
              <span aria-hidden="true">🎯</span> {PLAYABLE.length} aventuras para jugar
            </li>
            <li className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
              <span aria-hidden="true">🎮</span> {GAMES.length} juegos espaciales
            </li>
            <li className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
              <span aria-hidden="true">⚡</span> Sin registro: ¡juega al instante!
            </li>
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
          <div className="animate-float-slow relative">
            <img
              src={heroLarge}
              srcSet={`${heroSmall} 480w, ${heroLarge} 880w`}
              sizes="(min-width: 1024px) 40vw, (min-width: 640px) 28rem, 90vw"
              width="880"
              height="880"
              alt="Cohete hecho de lápices despegando de un libro abierto, rodeado de números, letras y planetas"
              fetchPriority="high"
              className="aspect-square w-full rounded-[2.5rem] object-cover shadow-2xl shadow-emerald-900/20 ring-8 ring-white"
            />
            <FloatingBadge className="top-8 -left-6 text-emerald-600">+10 XP ✨</FloatingBadge>
            <FloatingBadge className="top-1/2 -right-5 text-amber-600">⭐ ¡Nivel 3!</FloatingBadge>
            <FloatingBadge className="bottom-10 -left-4 text-sky-600">🎯 ¡Correcto!</FloatingBadge>
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyState({ onReset, category }) {
  const label = CATEGORIES.find((c) => c.id === category)?.label;
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 text-6xl" aria-hidden="true">
        🔭
      </div>
      <h3 className="mb-2 text-2xl font-semibold">No encontramos aventuras</h3>
      <p className="mb-6 max-w-md text-slate-600">
        {category !== 'all' && label
          ? `Muy pronto habrá nuevas actividades de ${label}. Mientras tanto, prueba con otra categoría o búsqueda.`
          : 'Prueba con otra palabra o explora otra categoría.'}
      </p>
      <button type="button" onClick={onReset} className="btn btn-md btn-primary">
        Ver todas las actividades
      </button>
    </div>
  );
}

function TeacherCallout() {
  return (
    <section className="container-page pb-16">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 p-8 text-white shadow-xl shadow-emerald-900/10 sm:p-12">
        <div className="pointer-events-none absolute -top-10 -right-10 text-[10rem] leading-none opacity-15" aria-hidden="true">
          🎓
        </div>
        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 flex items-center gap-2 font-bold text-emerald-50">
              <GraduationCap className="size-5" aria-hidden="true" />
              ¿Eres maestro o maestra?
            </p>
            <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl">Lleva estas aventuras a tu salón</h2>
            <p className="text-lg text-emerald-50">
              Inicia sesión para crear actividades de matemáticas y español, aplicar encuestas y seguir el progreso de
              tus grupos.
            </p>
          </div>
          <Link to="/login" className="btn btn-lg shrink-0 bg-white text-emerald-700 shadow-lg hover:bg-emerald-50">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  useDocumentTitle(null);
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(() => params.get('q') ?? '');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const resultsRef = useRef(null);

  const categoryParam = params.get('categoria');
  const sortParam = params.get('orden');
  const category = CATEGORIES.some((c) => c.id === categoryParam) ? categoryParam : 'all';
  const sort = SORT_OPTIONS.some((s) => s.id === sortParam) ? sortParam : 'featured';

  const updateParam = (key, value, defaultValue) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (!value || value === defaultValue) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
    setVisibleCount(PAGE_SIZE);
  };

  const counts = useMemo(() => countByCategory(ACTIVITIES, search), [search]);
  const results = useMemo(
    () => sortActivities(filterActivities(ACTIVITIES, { category, query: search }), sort),
    [category, search, sort],
  );
  const visible = results.slice(0, visibleCount);
  const hasMore = visible.length < results.length;

  const handleSearchChange = (value) => {
    setSearch(value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetFilters = () => {
    setSearch('');
    setVisibleCount(PAGE_SIZE);
    setParams({}, { replace: true, preventScrollReset: true });
  };

  return (
    <>
      <Hero search={search} onSearchChange={handleSearchChange} onSearchSubmit={handleSearchSubmit} />

      <section ref={resultsRef} id="biblioteca" className="container-page scroll-mt-24 py-12 sm:py-16" aria-labelledby="titulo-biblioteca">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="titulo-biblioteca" className="text-3xl font-bold sm:text-4xl">
              Explora la biblioteca
            </h2>
            <p className="mt-1 text-slate-600">Elige una aventura y empieza a jugar: no necesitas cuenta.</p>
          </div>
        </div>

        <div className="mb-6">
          <CategoryFilter active={category} counts={counts} onChange={(id) => updateParam('categoria', id, 'all')} />
        </div>
        <div className="mb-8">
          <SortTabs active={sort} onChange={(id) => updateParam('orden', id, 'featured')} />
        </div>

        {search.trim() && (
          <p className="mb-6 flex flex-wrap items-center gap-2 text-slate-600" aria-live="polite">
            <span>
              {results.length === 1 ? '1 resultado' : `${results.length} resultados`} para{' '}
              <strong className="text-slate-900">“{search.trim()}”</strong>
            </span>
            <button type="button" onClick={() => handleSearchChange('')} className="font-bold text-emerald-600 hover:underline">
              Limpiar búsqueda
            </button>
          </p>
        )}

        {visible.length > 0 ? (
          <ul className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {visible.map((activity, index) => (
              <li
                key={activity.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${(index % PAGE_SIZE) * 60}ms` }}
              >
                <ActivityCard activity={activity} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mb-12">
            <EmptyState onReset={resetFilters} category={category} />
          </div>
        )}

        {results.length > 0 && (
          <div className="mx-auto flex max-w-sm flex-col items-center gap-4 text-center">
            <p className="font-semibold text-slate-600" aria-live="polite">
              Viendo {visible.length} de {results.length} {results.length === 1 ? 'actividad' : 'actividades'}
            </p>
            <ProgressBar value={visible.length} max={results.length} className="h-2 w-full" label="Actividades mostradas" />
            {hasMore && (
              <button
                type="button"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className="btn btn-lg btn-secondary mt-2"
              >
                Cargar Más Aventuras
              </button>
            )}
          </div>
        )}
      </section>

      <TeacherCallout />
    </>
  );
}
