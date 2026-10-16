import { Link } from 'react-router';
import logo from '../../assets/logo.jpg';
import { cn } from '../../lib/utils';

/** Logo original de Tiza (enlaza al inicio). */
export default function Logo({ className, imgClassName, linked = true }) {
  const image = (
    <img
      src={logo}
      alt="Tiza"
      width="200"
      height="89"
      className={cn('h-11 w-auto select-none', imgClassName)}
      draggable="false"
    />
  );
  if (!linked) return <span className={cn('inline-flex', className)}>{image}</span>;
  return (
    <Link to="/" className={cn('inline-flex shrink-0 rounded-xl', className)} aria-label="Tiza, ir al inicio">
      {image}
    </Link>
  );
}
