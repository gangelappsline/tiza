import { ArrowRight, Clock, Gamepad2, Hourglass } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { CATEGORIES, DIFFICULTIES, unsplashUrl } from '../../data/activities';
import { cn } from '../../lib/utils';

function Cover({ activity }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative aspect-[3/2] overflow-hidden bg-gradient-to-br from-emerald-100 via-sky-100 to-violet-100">
      {!failed && activity.photo ? (
        <img
          src={unsplashUrl(activity.photo, 600)}
          srcSet={`${unsplashUrl(activity.photo, 400)} 400w, ${unsplashUrl(activity.photo, 800)} 800w`}
          sizes="(min-width: 1024px) 380px, (min-width: 768px) 50vw, 100vw"
          alt=""
          width="600"
          height="400"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="grid h-full place-items-center text-7xl" aria-hidden="true">
          {activity.emoji}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/45 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
      <span
        className="absolute top-4 left-4 grid size-12 place-items-center rounded-2xl bg-white/95 text-2xl shadow-md ring-1 ring-black/5"
        aria-hidden="true"
      >
        {activity.emoji}
      </span>
      {activity.type === 'game' && (
        <span className="chip absolute top-4 right-4 bg-violet-600 text-white shadow">
          <Gamepad2 className="size-3.5" aria-hidden="true" />
          Juego
        </span>
      )}
      {!activity.link && (
        <span className="chip absolute top-4 right-4 bg-slate-900/80 text-white backdrop-blur">
          <Hourglass className="size-3.5" aria-hidden="true" />
          Próximamente
        </span>
      )}
    </div>
  );
}

export default function ActivityCard({ activity }) {
  const difficulty = DIFFICULTIES[activity.difficulty] ?? DIFFICULTIES.EASY;
  const category = CATEGORIES.find((c) => c.id === activity.category);
  const available = Boolean(activity.link);

  const body = (
    <>
      <Cover activity={activity} />
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className={cn('chip uppercase', difficulty.className)}>{difficulty.label}</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-slate-500">
            <Clock className="size-4" aria-hidden="true" />
            {activity.duration} mins
          </span>
        </div>
        <h3
          className={cn(
            'mb-2 text-xl leading-snug font-semibold transition-colors',
            available && 'group-hover:text-emerald-600',
          )}
        >
          {activity.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">{activity.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          {category && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <category.icon className="size-4" aria-hidden="true" />
              {category.label}
            </span>
          )}
          {available ? (
            <span className="flex items-center gap-1 text-sm font-extrabold text-emerald-600">
              {activity.type === 'game' ? 'Jugar' : 'Comenzar'}
              <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" />
            </span>
          ) : (
            <span className="text-sm font-bold text-slate-400">En desarrollo</span>
          )}
        </div>
      </div>
    </>
  );

  const shell = 'group card flex h-full flex-col overflow-hidden transition duration-300';

  if (!available) {
    return (
      <article className={cn(shell, 'opacity-95')} aria-label={`${activity.title} (próximamente)`}>
        {body}
      </article>
    );
  }

  return (
    <Link to={activity.link} className={cn(shell, 'hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/10')}>
      {body}
    </Link>
  );
}
