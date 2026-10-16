import { useCallback, useRef, useState } from 'react';

/** Maneja el envío de resultados (enviando / enviado / error + reintento). */
export function useResultSubmission(send) {
  const [state, setState] = useState({ status: 'idle', error: '' });
  const lastPayload = useRef(null);

  const submit = useCallback(
    async (payload) => {
      lastPayload.current = payload;
      setState({ status: 'sending', error: '' });
      try {
        await send(payload);
        setState({ status: 'sent', error: '' });
      } catch (error) {
        setState({ status: 'error', error: error?.message || '' });
      }
    },
    [send],
  );

  const retry = useCallback(() => {
    if (lastPayload.current) submit(lastPayload.current);
  }, [submit]);

  const reset = useCallback(() => {
    lastPayload.current = null;
    setState({ status: 'idle', error: '' });
  }, []);

  return { ...state, submit, retry, reset };
}
