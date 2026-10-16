import { useId, useState } from 'react';
import { cn } from '../../lib/utils';

/**
 * Pantalla "¿Cuál es tu nombre?" para actividades asignadas por un maestro
 * (los resultados se envían con este nombre).
 */
export default function StudentNameForm({ title = '¡Bienvenido!', tone = 'emerald', children, onSubmit }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputId = useId();
  const errorId = useId();

  const handleSubmit = (event) => {
    event.preventDefault();
    const clean = name.trim().replace(/\s+/g, ' ');
    if (clean.length < 2) {
      setError('Escribe tu nombre para que tu maestro reciba tus resultados.');
      return;
    }
    onSubmit(clean);
  };

  const button = tone === 'sky' ? 'btn-blue' : 'btn-primary';

  return (
    <div className="container-page max-w-2xl py-10 sm:py-16">
      <div className="card animate-fade-in-up p-6 sm:p-10">
        <div className="mb-8 text-center">
          <div className="animate-wiggle mb-5 inline-block text-6xl" aria-hidden="true">
            👋
          </div>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">{title}</h1>
          <p className="text-lg text-slate-600">Antes de comenzar, necesitamos saber quién eres</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label htmlFor={inputId} className="label">
              ¿Cuál es tu nombre? <span className="text-rose-500">*</span>
            </label>
            <input
              id={inputId}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Escribe tu nombre completo"
              autoComplete="name"
              maxLength={80}
              autoFocus
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              className={cn('input py-4 text-lg', error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15')}
            />
            {error && (
              <p id={errorId} className="mt-2 text-sm font-semibold text-rose-600" role="alert">
                {error}
              </p>
            )}
          </div>
          {children}
          <button type="submit" className={cn('btn btn-lg w-full py-5', button)}>
            🚀 Comenzar Actividad
          </button>
        </form>
      </div>
    </div>
  );
}
