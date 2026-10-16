import { RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import ActivityHero from '../components/ui/ActivityHero';
import PreferenceToggles from '../components/ui/PreferenceToggles';
import StatPill from '../components/ui/StatPill';
import { STORAGE_KEYS } from '../config';
import { VOWELS } from '../data/vowels';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useStopwatch } from '../hooks/useStopwatch';
import { launchConfetti } from '../lib/confetti';
import { sfx } from '../lib/sound';
import { speak } from '../lib/speech';
import { readJSON, writeJSON } from '../lib/storage';
import { cn, formatTime, shuffle } from '../lib/utils';

const VOWEL_BY_ID = Object.fromEntries(VOWELS.map((v) => [v.id, v]));

function buildDeck() {
  return shuffle(
    VOWELS.flatMap((v) => [
      { key: `${v.id}-letra`, vowelId: v.id, kind: 'letter' },
      { key: `${v.id}-imagen`, vowelId: v.id, kind: 'picture' },
    ]),
  );
}

function starsFor(errors) {
  if (errors <= 1) return 3;
  if (errors <= 4) return 2;
  return 1;
}

function isBetter(result, record) {
  if (!record) return true;
  if (result.errors !== record.errors) return result.errors < record.errors;
  return result.seconds < record.seconds;
}

function CardFace({ card, uppercase }) {
  const vowel = VOWEL_BY_ID[card.vowelId];
  if (card.kind === 'letter') {
    const letter = uppercase ? vowel.letter : vowel.letter.toLowerCase();
    return (
      <span className={cn('font-display text-5xl font-bold sm:text-6xl', vowel.text)}>
        {letter}
      </span>
    );
  }
  const word = uppercase ? vowel.word : vowel.word.toLowerCase();
  return (
    <span className="flex flex-col items-center gap-1">
      <span className="text-4xl sm:text-5xl" aria-hidden="true">
        {vowel.emoji}
      </span>
      <span className="text-sm font-extrabold text-slate-700 sm:text-base">
        <span className={vowel.text}>{word[0]}</span>
        {word.slice(1)}
      </span>
    </span>
  );
}

export default function MemoryGamePage() {
  useDocumentTitle(
    'Memoria de Vocales',
    'Juego de memoria para aprender las vocales: encuentra cada vocal y la imagen que empieza con ella.',
  );

  const [deck, setDeck] = useState(buildDeck);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState(() => new Set());
  const [mismatch, setMismatch] = useState([]);
  const [errors, setErrors] = useState(0);
  const [moves, setMoves] = useState(0);
  const [uppercase, setUppercase] = useState(true);
  const [result, setResult] = useState(null);
  const [record, setRecord] = useState(() => readJSON(STORAGE_KEYS.memoryBest));
  const stopwatch = useStopwatch();
  const timeouts = useRef([]);

  const later = useCallback((fn, ms) => {
    timeouts.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

  const locked = flipped.length === 2;

  const restart = () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    setDeck(buildDeck());
    setFlipped([]);
    setMatched(new Set());
    setMismatch([]);
    setErrors(0);
    setMoves(0);
    setResult(null);
    stopwatch.reset();
  };

  const finish = (finalErrors, finalMoves) => {
    const seconds = stopwatch.stop();
    const summary = { errors: finalErrors, moves: finalMoves, seconds, stars: starsFor(finalErrors) };
    const newRecord = isBetter(summary, record);
    if (newRecord) {
      writeJSON(STORAGE_KEYS.memoryBest, { errors: summary.errors, seconds: summary.seconds });
      setRecord({ errors: summary.errors, seconds: summary.seconds });
    }
    setResult({ ...summary, newRecord });
    sfx.win();
    launchConfetti();
    later(() => speak('¡Felicidades! Encontraste todas las parejas.'), 400);
  };

  const handleFlip = (index) => {
    const card = deck[index];
    if (locked || flipped.includes(index) || matched.has(card.vowelId) || result) return;
    if (!stopwatch.started) stopwatch.start();

    const vowel = VOWEL_BY_ID[card.vowelId];
    sfx.flip();
    speak(card.kind === 'letter' ? vowel.letter : vowel.word);

    const next = [...flipped, index];
    setFlipped(next);
    if (next.length < 2) return;

    const totalMoves = moves + 1;
    setMoves(totalMoves);
    const [first, second] = next.map((i) => deck[i]);

    if (first.vowelId === second.vowelId) {
      const nextMatched = new Set(matched).add(first.vowelId);
      later(() => {
        setMatched(nextMatched);
        setFlipped([]);
        sfx.match();
        speak(`${vowel.letter} de ${vowel.word}`);
        if (nextMatched.size === VOWELS.length) later(() => finish(errors, totalMoves), 700);
      }, 450);
    } else {
      setErrors((e) => e + 1);
      later(() => {
        setMismatch(next);
        sfx.wrong();
      }, 450);
      later(() => {
        setFlipped([]);
        setMismatch([]);
      }, 1300);
    }
  };

  const pairsFound = matched.size;

  return (
    <div className="bg-gradient-to-b from-violet-50 via-slate-50 to-slate-50">
      <div className="container-page max-w-5xl py-8 sm:py-10">
        <ActivityHero
          emoji="🎮"
          title="Memoria de Vocales"
          description="Encuentra las parejas de vocales y sus imágenes. ¡Demuestra tu memoria!"
          actions={<PreferenceToggles voice />}
        />

        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          <StatPill icon="✓" label="Aciertos" value={`${pairsFound}/${VOWELS.length}`} tone="emerald" />
          <StatPill icon="✗" label="Errores" value={errors} tone="rose" />
          <StatPill icon="⏱️" label="Tiempo" value={formatTime(stopwatch.elapsed)} tone="sky" />
          <div className="flex items-center gap-2">
            <div className="flex rounded-2xl bg-white p-1 ring-1 ring-slate-200" role="group" aria-label="Tipo de letra">
              {[
                { value: true, label: 'A', title: 'Mayúsculas' },
                { value: false, label: 'a', title: 'Minúsculas' },
              ].map((option) => (
                <button
                  key={option.title}
                  type="button"
                  title={option.title}
                  aria-pressed={uppercase === option.value}
                  onClick={() => setUppercase(option.value)}
                  className={cn(
                    'size-10 rounded-xl font-display text-lg font-bold transition',
                    uppercase === option.value ? 'bg-violet-500 text-white shadow' : 'text-slate-500 hover:bg-slate-100',
                  )}
                >
                  {option.label}
                  <span className="sr-only"> ({option.title})</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={restart} className="btn btn-md btn-violet">
              <RotateCcw className="size-4" aria-hidden="true" />
              Reiniciar
            </button>
          </div>
        </div>

        {result ? (
          <div className="card animate-pop mx-auto mb-10 max-w-xl p-8 text-center sm:p-10" role="status">
            <div className="mb-3 text-5xl" aria-hidden="true">
              🎉
            </div>
            <h2 className="mb-2 text-3xl font-bold sm:text-4xl">¡Felicitaciones!</h2>
            <p className="mb-6 text-lg text-slate-600">Has completado el juego de memoria</p>
            <p className="mb-6 text-5xl tracking-widest" aria-label={`${result.stars} de 3 estrellas`}>
              {'⭐'.repeat(result.stars)}
              <span className="opacity-25">{'⭐'.repeat(3 - result.stars)}</span>
            </p>
            <div className="mb-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="font-display text-3xl font-bold text-emerald-600">{VOWELS.length}</p>
                <p className="text-xs font-bold tracking-wide text-emerald-700 uppercase">Aciertos</p>
              </div>
              <div className="rounded-2xl bg-rose-50 p-4">
                <p className="font-display text-3xl font-bold text-rose-500">{result.errors}</p>
                <p className="text-xs font-bold tracking-wide text-rose-600 uppercase">Errores</p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-4">
                <p className="font-display text-3xl font-bold text-sky-600">{formatTime(result.seconds)}</p>
                <p className="text-xs font-bold tracking-wide text-sky-700 uppercase">Tiempo</p>
              </div>
            </div>
            {result.newRecord ? (
              <p className="mb-6 font-bold text-amber-600">🏅 ¡Nuevo récord personal!</p>
            ) : (
              record && (
                <p className="mb-6 text-sm font-semibold text-slate-500">
                  Tu récord: {record.errors} errores en {formatTime(record.seconds)}
                </p>
              )
            )}
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={restart} className="btn btn-lg btn-violet">
                🔄 Jugar de nuevo
              </button>
              <Link to="/" className="btn btn-lg btn-secondary">
                Más actividades
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mx-auto mb-10 grid max-w-3xl grid-cols-4 gap-3 sm:grid-cols-5 sm:gap-4" aria-label="Tablero de cartas">
            {deck.map((card, index) => {
              const vowel = VOWEL_BY_ID[card.vowelId];
              const isMatched = matched.has(card.vowelId);
              const faceUp = isMatched || flipped.includes(index);
              const label = faceUp
                ? card.kind === 'letter'
                  ? `Letra ${uppercase ? vowel.letter : vowel.letter.toLowerCase()}`
                  : `Imagen: ${vowel.word}`
                : `Carta ${index + 1}, boca abajo`;
              return (
                <li key={card.key} className={cn(index >= 8 && 'max-sm:col-span-2 max-sm:mx-auto max-sm:w-1/2')}>
                  <button
                    type="button"
                    className={cn('flip-card block aspect-[3/4] w-full', mismatch.includes(index) && 'animate-shake')}
                    data-flipped={faceUp}
                    onClick={() => handleFlip(index)}
                    aria-label={label}
                    aria-disabled={isMatched || undefined}
                  >
                    <span className="flip-card-inner">
                      <span className="flip-card-face grid place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-violet-900/20 ring-1 ring-white/20 transition hover:brightness-110">
                        <span className="font-display text-4xl font-bold opacity-90 sm:text-5xl">?</span>
                        <span className="absolute top-2 left-3 text-xs opacity-60" aria-hidden="true">
                          ✦
                        </span>
                        <span className="absolute right-3 bottom-2 text-xs opacity-60" aria-hidden="true">
                          ✦
                        </span>
                      </span>
                      <span
                        className={cn(
                          'flip-card-face flip-card-back grid place-items-center rounded-2xl bg-white p-2 shadow-lg ring-4',
                          isMatched ? 'ring-emerald-400' : vowel.ring,
                          mismatch.includes(index) && 'ring-rose-400',
                          isMatched ? 'bg-emerald-50' : vowel.soft,
                        )}
                      >
                        <CardFace card={card} uppercase={uppercase} />
                        {isMatched && (
                          <span className="animate-pop absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                            ✓
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <section className="card mx-auto max-w-3xl p-6 sm:p-8" aria-labelledby="instrucciones-memorama">
          <h2 id="instrucciones-memorama" className="mb-4 text-2xl font-semibold">
            📖 Instrucciones
          </h2>
          <ul className="space-y-2.5 text-slate-600">
            {[
              'Haz clic en una carta para voltearla',
              'Encuentra cada vocal con la imagen que empieza con ella (por ejemplo, A con 🐝 Abeja)',
              'Si dos cartas coinciden, se quedarán visibles',
              'Si no coinciden, se voltearán de nuevo',
              '¡Intenta completar el juego con el menor número de errores!',
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="font-bold text-violet-500" aria-hidden="true">
                  →
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-500">
            Consejo: activa la voz 💬 para escuchar cada vocal y cada palabra al voltear las cartas.
          </p>
        </section>
      </div>
    </div>
  );
}
