import { cn } from '../../lib/utils';
import BackLink from './BackLink';

/** Encabezado común de las páginas de actividad. */
export default function ActivityHero({ emoji, title, description, actions, className, backTo = '/' }) {
  return (
    <div className={cn('mb-8', className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <BackLink to={backTo} className="-ml-3" />
        {actions}
      </div>
      <div className="text-center">
        <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
          {emoji && (
            <span className="mr-2 inline-block" aria-hidden="true">
              {emoji}
            </span>
          )}
          {title}
        </h1>
        {description && <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 sm:text-lg">{description}</p>}
      </div>
    </div>
  );
}
