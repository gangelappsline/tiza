import { useCallback, useEffect, useState } from 'react';

/**
 * Cronómetro que se actualiza cada segundo mientras está activo.
 * Devuelve los segundos transcurridos y funciones para controlarlo.
 */
export function useStopwatch() {
  const [startedAt, setStartedAt] = useState(null);
  const [stoppedAt, setStoppedAt] = useState(null);
  const [now, setNow] = useState(0);

  const running = startedAt !== null && stoppedAt === null;

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const start = useCallback(() => {
    const t = Date.now();
    setStartedAt(t);
    setStoppedAt(null);
    setNow(t);
  }, []);

  /** Detiene el cronómetro y devuelve los segundos totales. */
  const stop = useCallback(() => {
    const t = Date.now();
    setStoppedAt(t);
    setNow(t);
    return startedAt === null ? 0 : Math.floor((t - startedAt) / 1000);
  }, [startedAt]);

  const reset = useCallback(() => {
    setStartedAt(null);
    setStoppedAt(null);
    setNow(0);
  }, []);

  const end = stoppedAt ?? now;
  const elapsed = startedAt === null ? 0 : Math.max(0, Math.floor((end - startedAt) / 1000));

  return { elapsed, running, started: startedAt !== null, start, stop, reset };
}
