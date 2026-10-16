import { MessageCircle, MessageCircleOff, Volume2, VolumeX } from 'lucide-react';
import { useSoundEnabled, useVoiceEnabled } from '../../lib/preferences';
import { speechSupported, stopSpeaking } from '../../lib/speech';
import { cn } from '../../lib/utils';

const base =
  'inline-flex size-11 items-center justify-center rounded-2xl border-2 transition focus-visible:outline-offset-2';

/** Botones para activar/desactivar efectos de sonido y lectura en voz alta. */
export default function PreferenceToggles({ voice = false, dark = false, className }) {
  const [soundOn, setSoundOn] = useSoundEnabled();
  const [voiceOn, setVoiceOn] = useVoiceEnabled();
  const tone = dark
    ? 'border-white/15 bg-white/10 text-white hover:bg-white/20'
    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        className={cn(base, tone)}
        onClick={() => setSoundOn((v) => !v)}
        aria-pressed={soundOn}
        title={soundOn ? 'Silenciar efectos de sonido' : 'Activar efectos de sonido'}
      >
        {soundOn ? <Volume2 className="size-5" aria-hidden="true" /> : <VolumeX className="size-5" aria-hidden="true" />}
        <span className="sr-only">{soundOn ? 'Silenciar efectos de sonido' : 'Activar efectos de sonido'}</span>
      </button>
      {voice && speechSupported && (
        <button
          type="button"
          className={cn(base, tone)}
          onClick={() => {
            if (voiceOn) stopSpeaking();
            setVoiceOn((v) => !v);
          }}
          aria-pressed={voiceOn}
          title={voiceOn ? 'Desactivar lectura en voz alta' : 'Activar lectura en voz alta'}
        >
          {voiceOn ? (
            <MessageCircle className="size-5" aria-hidden="true" />
          ) : (
            <MessageCircleOff className="size-5" aria-hidden="true" />
          )}
          <span className="sr-only">{voiceOn ? 'Desactivar lectura en voz alta' : 'Activar lectura en voz alta'}</span>
        </button>
      )}
    </div>
  );
}
