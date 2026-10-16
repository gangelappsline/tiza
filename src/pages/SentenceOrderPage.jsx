import {
  closestCenter,
  DndContext,
  DragOverlay,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowRight, Eraser, Target, Timer, Volume2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import ActivityHero from '../components/ui/ActivityHero';
import PreferenceToggles from '../components/ui/PreferenceToggles';
import ProgressBar from '../components/ui/ProgressBar';
import ResultSubmission from '../components/ui/ResultSubmission';
import StudentNameForm from '../components/ui/StudentNameForm';
import { DEFAULT_SENTENCES } from '../data/sentences';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useResultSubmission } from '../hooks/useResultSubmission';
import { useStopwatch } from '../hooks/useStopwatch';
import { activityApi } from '../lib/api';
import { launchConfetti } from '../lib/confetti';
import { createTokens, isSentenceCorrect, parseSentencesParam, shuffleTokens } from '../lib/sentences';
import { sfx } from '../lib/sound';
import { speak, speechSupported } from '../lib/speech';
import { cn, formatTime, percentage, scoreEmoji, scoreMessage } from '../lib/utils';

const CONTAINERS = ['answer', 'bank'];

/** Detección de colisiones: primero lo que está bajo el puntero, si no lo más cercano. */
function collisionDetection(args) {
  const within = pointerWithin(args);
  return within.length ? within : closestCenter(args);
}

function buildBoard(sentence, sentenceIndex) {
  const bank = shuffleTokens(createTokens(sentence, sentenceIndex)).map((token, bankIndex) => ({ ...token, bankIndex }));
  return { answer: [], bank };
}

function containerOf(board, id) {
  if (CONTAINERS.includes(id)) return id;
  return CONTAINERS.find((key) => board[key].some((token) => token.id === id)) ?? null;
}

/* ------------------------------------------------------------------------ */

function Chip({ text, variant, overlay = false }) {
  return (
    <span
      className={cn(
        'inline-flex min-h-12 items-center rounded-xl px-4 py-2 text-lg font-bold shadow-sm select-none',
        variant === 'answer'
          ? 'bg-sky-500 text-white shadow-sky-500/30'
          : 'border-2 border-slate-200 bg-white text-slate-800',
        overlay && 'scale-105 rotate-2 cursor-grabbing shadow-xl ring-4 ring-sky-300/50',
      )}
    >
      {text}
    </span>
  );
}

function SortableWord({ token, container, disabled, onActivate }) {
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: token.id, disabled });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('touch-manipulation', isDragging && 'opacity-30')}
    >
      <button
        type="button"
        {...listeners}
        onClick={() => !disabled && onActivate(token)}
        disabled={disabled}
        aria-label={container === 'answer' ? `${token.text}: quitar de la respuesta` : `${token.text}: agregar a la respuesta`}
        className={cn(
          'rounded-xl transition hover:-translate-y-0.5 focus-visible:outline-offset-2 disabled:cursor-default disabled:hover:translate-y-0',
          !disabled && 'cursor-grab active:cursor-grabbing',
        )}
      >
        <Chip text={token.text} variant={container} />
      </button>
    </li>
  );
}

function DropZone({ id, tokens, highlighted, status, disabled, onActivate, label, emptyText }) {
  const { setNodeRef } = useDroppable({ id });
  const isAnswer = id === 'answer';
  return (
    <section
      ref={setNodeRef}
      aria-label={label}
      className={cn(
        'rounded-2xl p-4 transition-colors',
        isAnswer ? 'min-h-36 border-[3px] border-dashed' : 'border-2 bg-slate-50',
        isAnswer && !status && (highlighted ? 'border-sky-500 bg-sky-100/70' : 'border-sky-300 bg-sky-50'),
        isAnswer && status === 'correct' && 'border-solid border-emerald-400 bg-emerald-50',
        isAnswer && status === 'incorrect' && 'border-solid border-rose-400 bg-rose-50',
        !isAnswer && (highlighted ? 'border-slate-400' : 'border-slate-200'),
      )}
    >
      <p className={cn('mb-3 text-sm font-extrabold', isAnswer ? 'text-sky-700' : 'text-slate-500')}>{label}</p>
      <SortableContext id={id} items={tokens.map((t) => t.id)} strategy={rectSortingStrategy}>
        <ul className="flex min-h-14 flex-wrap gap-2.5">
          {tokens.length === 0 ? (
            <li className="w-full py-3 text-center text-slate-400 italic">{emptyText}</li>
          ) : (
            tokens.map((token) => (
              <SortableWord key={token.id} token={token} container={id} disabled={disabled} onActivate={onActivate} />
            ))
          )}
        </ul>
      </SortableContext>
    </section>
  );
}

/* ------------------------------------------------------------------------ */

export default function SentenceOrderPage() {
  useDocumentTitle(
    'Ordenar Oraciones',
    'Arrastra las palabras para formar oraciones correctas en español. Funciona con ratón, pantalla táctil y teclado.',
  );
  const [params] = useSearchParams();
  const assigned = useMemo(() => parseSentencesParam(params.get('oraciones') || params.get('sentences')), [params]);
  const activityId = params.get('activity_id') || params.get('activityId') || null;
  const sentences = assigned ?? DEFAULT_SENTENCES;

  const [phase, setPhase] = useState(assigned ? 'name' : 'intro');
  const [studentName, setStudentName] = useState('');
  const [index, setIndex] = useState(0);
  const [board, setBoard] = useState(() => buildBoard(sentences[0], 0));
  const [results, setResults] = useState([]);
  const [checked, setChecked] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [overContainer, setOverContainer] = useState(null);
  const [finalSeconds, setFinalSeconds] = useState(0);

  const stopwatch = useStopwatch();
  const submission = useResultSubmission(activityApi.submitSpanishResults);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const sentence = sentences[index];
  const correctCount = results.filter((r) => r.correct).length;
  const missing = board.bank.length;
  const activeToken = activeId ? [...board.answer, ...board.bank].find((t) => t.id === activeId) : null;
  const activeContainer = activeId ? containerOf(board, activeId) : null;

  const start = (name = '') => {
    setStudentName(name);
    setIndex(0);
    setBoard(buildBoard(sentences[0], 0));
    setResults([]);
    setChecked(null);
    submission.reset();
    setPhase('playing');
    stopwatch.start();
  };

  /* ---- Mover palabras ---- */
  const moveToken = (token) => {
    if (checked) return;
    sfx.click();
    setBoard((prev) => {
      if (prev.bank.some((t) => t.id === token.id)) {
        return { answer: [...prev.answer, token], bank: prev.bank.filter((t) => t.id !== token.id) };
      }
      const bank = [...prev.bank, token].sort((a, b) => a.bankIndex - b.bankIndex);
      return { answer: prev.answer.filter((t) => t.id !== token.id), bank };
    });
  };

  const clearAnswer = () => {
    setBoard((prev) => ({ answer: [], bank: [...prev.bank, ...prev.answer].sort((a, b) => a.bankIndex - b.bankIndex) }));
  };

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragOver = ({ over }) => {
    const next = over ? containerOf(board, over.id) : null;
    if (next !== overContainer) setOverContainer(next);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    setOverContainer(null);
    if (!over || checked) return;
    setBoard((prev) => {
      const from = containerOf(prev, active.id);
      const to = containerOf(prev, over.id);
      if (!from || !to) return prev;
      if (from === to) {
        const list = prev[from];
        const oldIndex = list.findIndex((t) => t.id === active.id);
        const newIndex = over.id === to ? list.length - 1 : list.findIndex((t) => t.id === over.id);
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return prev;
        return { ...prev, [from]: arrayMove(list, oldIndex, newIndex) };
      }
      const moving = prev[from].find((t) => t.id === active.id);
      const target = [...prev[to]];
      const overIndex = target.findIndex((t) => t.id === over.id);
      target.splice(overIndex >= 0 ? overIndex : target.length, 0, moving);
      const next = { ...prev, [from]: prev[from].filter((t) => t.id !== active.id), [to]: target };
      if (to === 'bank') next.bank.sort((a, b) => a.bankIndex - b.bankIndex);
      return next;
    });
  };

  /* ---- Comprobar y avanzar ---- */
  const check = () => {
    const words = board.answer.map((t) => t.text);
    const correct = isSentenceCorrect(words, sentence.text);
    setChecked(correct ? 'correct' : 'incorrect');
    setResults((prev) => [...prev, { sentence, userSentence: words.join(' '), correct }]);
    if (correct) {
      sfx.correct();
      speak(sentence.text);
    } else {
      sfx.wrong();
    }
  };

  const finish = (allResults) => {
    const seconds = stopwatch.stop();
    setFinalSeconds(seconds);
    setPhase('results');
    const correct = allResults.filter((r) => r.correct).length;
    const score = percentage(correct, allResults.length);
    if (score >= 90) {
      sfx.win();
      launchConfetti();
    }
    if (studentName) {
      submission.submit({
        activity_id: activityId,
        student_name: studentName,
        total_sentences: allResults.length,
        correct_sentences: correct,
        score_percentage: score,
        time_spent_seconds: seconds,
        answers: allResults.map((r, i) => ({
          sentence_number: i + 1,
          correct_sentence: r.sentence.text,
          user_sentence: r.userSentence,
          is_correct: r.correct,
        })),
      });
    }
  };

  const next = () => {
    if (index >= sentences.length - 1) {
      finish(results);
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setBoard(buildBoard(sentences[nextIndex], nextIndex));
    setChecked(null);
  };

  const exit = () => {
    if (results.length > 0 && !window.confirm('¿Seguro que quieres salir? Se perderá tu progreso.')) return;
    stopwatch.reset();
    setPhase(assigned ? 'name' : 'intro');
  };

  /* ---------------------------------- Vistas ---------------------------------- */

  if (phase === 'name') {
    return (
      <StudentNameForm title="¡Bienvenido a Español!" tone="sky" onSubmit={(name) => start(name)}>
        <div className="flex items-start gap-3 rounded-2xl border-2 border-sky-200 bg-sky-50 p-4">
          <span className="text-2xl" aria-hidden="true">
            📝
          </span>
          <div className="text-sm text-slate-700">
            <h2 className="mb-1 font-sans text-base font-bold text-slate-900">Instrucciones</h2>
            <p>Ordena las palabras para formar oraciones correctas. Arrastra las palabras a la zona de respuesta.</p>
            <p className="mt-2">
              <strong>{sentences.length}</strong> oraciones para ordenar
            </p>
          </div>
        </div>
      </StudentNameForm>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="container-page max-w-4xl py-8 sm:py-10">
        <ActivityHero
          emoji="📚"
          title="Ordena las Oraciones"
          description="Arrastra las palabras para formar oraciones correctas"
          actions={<PreferenceToggles voice />}
        />
        <div className="card animate-fade-in-up p-6 sm:p-10">
          <div className="mb-8 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
            <h2 className="mb-4 font-sans text-lg font-bold text-slate-900">📋 Instrucciones:</h2>
            <ol className="space-y-3 text-slate-700">
              {[
                'Lee las palabras desordenadas',
                'Arrastra las palabras a la zona de respuesta en el orden correcto',
                'También puedes tocar o hacer clic en las palabras para agregarlas o quitarlas',
                `Tienes ${sentences.length} oraciones para ordenar`,
              ].map((text, i) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sky-500 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{text}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="mb-8 rounded-2xl border-2 border-dashed border-slate-200 p-5 text-center">
            <p className="mb-3 text-sm font-bold text-slate-500">Ejemplo</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['El', 'chocolate', 'está', 'caliente'].map((w) => (
                <Chip key={w} text={w} variant="answer" />
              ))}
            </div>
          </div>
          <button type="button" onClick={() => start()} className="btn btn-lg btn-blue w-full py-5 text-xl">
            🚀 Comenzar Práctica
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    const score = percentage(correctCount, results.length);
    return (
      <div className="container-page max-w-4xl py-8 sm:py-12">
        <div className="card animate-pop mb-6 p-6 text-center sm:p-10">
          <div className="mb-4 text-6xl sm:text-7xl" aria-hidden="true">
            {scoreEmoji(score)}
          </div>
          <h1 className="mb-2 text-3xl font-bold sm:text-5xl">¡Actividad Completada!</h1>
          <p className="mb-6 text-lg text-slate-600">{scoreMessage(score)}</p>
          <p className="font-display text-6xl font-bold text-sky-500 sm:text-7xl">
            {correctCount}/{results.length}
          </p>
          <p className="mb-4 text-xl font-semibold text-slate-600 sm:text-2xl">{score}% Correcto</p>
          <p className="mb-6 text-lg font-semibold text-slate-600">⏱️ Tiempo: {formatTime(finalSeconds)}</p>
          <ResultSubmission status={submission.status} error={submission.error} onRetry={submission.retry} studentName={studentName} />
        </div>

        <section className="card mb-6 p-5 sm:p-8" aria-labelledby="resumen-oraciones">
          <h2 id="resumen-oraciones" className="mb-5 text-2xl font-semibold">
            Resumen de Respuestas
          </h2>
          <ol className="space-y-3">
            {results.map((r, i) => (
              <li
                key={i}
                className={cn(
                  'rounded-2xl border-2 p-4',
                  r.correct ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50',
                )}
              >
                <div className="mb-2 flex items-center gap-3">
                  <span className="font-bold text-slate-500">#{i + 1}</span>
                  <span className="text-xl" aria-label={r.correct ? 'Correcta' : 'Incorrecta'}>
                    {r.correct ? '✅' : '❌'}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-500">Tu respuesta:</p>
                <p className="font-semibold text-slate-900">{r.userSentence || '(sin respuesta)'}</p>
                {!r.correct && (
                  <>
                    <p className="mt-2 text-sm font-bold text-slate-500">Respuesta correcta:</p>
                    <p className="font-semibold text-emerald-700">{r.sentence.text}</p>
                  </>
                )}
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => start(studentName)} className="btn btn-lg btn-blue flex-1">
            🔄 Practicar de Nuevo
          </button>
          <Link to="/" className="btn btn-lg btn-secondary flex-1">
            🏠 Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  /* phase === 'playing' */
  const isLast = index >= sentences.length - 1;
  return (
    <div className="container-page max-w-4xl py-8 sm:py-10">
      <div className="card mb-6 p-4 sm:p-6">
        <div className="mb-3 flex items-center justify-between text-sm font-bold text-slate-600 sm:text-base">
          <span>
            Oración {index + 1} de {sentences.length}
          </span>
          <PreferenceToggles voice />
        </div>
        <ProgressBar value={index + (checked ? 1 : 0)} max={sentences.length} tone="sky" label="Progreso de la actividad" />
        <div className="mt-4 flex items-center justify-between font-bold text-slate-800">
          <span className="flex items-center gap-1.5">
            <Target className="size-5 text-sky-500" aria-hidden="true" /> {correctCount} Correctas
          </span>
          <span className="flex items-center gap-1.5 tabular-nums">
            <Timer className="size-5 text-sky-500" aria-hidden="true" /> {formatTime(stopwatch.elapsed)}
          </span>
        </div>
      </div>

      <div className="card p-5 sm:p-8 lg:p-10">
        <div className="mb-6 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <h2 className="text-xl font-semibold sm:text-2xl">Ordena las palabras para formar la oración</h2>
          {speechSupported && (
            <button type="button" onClick={() => speak(sentence.text, { force: true })} className="btn btn-sm btn-secondary shrink-0">
              <Volume2 className="size-4" aria-hidden="true" />
              Escuchar oración
            </button>
          )}
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setActiveId(null);
            setOverContainer(null);
          }}
        >
          <div className="space-y-5">
            <DropZone
              id="answer"
              label="Tu respuesta:"
              emptyText="Arrastra las palabras aquí o tócalas"
              tokens={board.answer}
              highlighted={overContainer === 'answer' && activeContainer !== 'answer'}
              status={checked}
              disabled={Boolean(checked)}
              onActivate={moveToken}
            />
            <DropZone
              id="bank"
              label="Palabras disponibles:"
              emptyText="¡Usaste todas las palabras!"
              tokens={board.bank}
              highlighted={overContainer === 'bank' && activeContainer !== 'bank'}
              disabled={Boolean(checked)}
              onActivate={moveToken}
            />
          </div>
          <DragOverlay dropAnimation={null}>
            {activeToken ? <Chip text={activeToken.text} variant={activeContainer} overlay /> : null}
          </DragOverlay>
        </DndContext>

        <div className="mt-6 min-h-16" aria-live="polite">
          {checked === 'correct' && (
            <p className="animate-pop rounded-2xl bg-emerald-50 px-5 py-4 text-center text-lg font-extrabold text-emerald-700">
              ✅ ¡Muy bien! La oración es correcta.
            </p>
          )}
          {checked === 'incorrect' && (
            <div className="animate-pop rounded-2xl bg-rose-50 px-5 py-4 text-center text-rose-800">
              <p className="text-lg font-extrabold">❌ ¡Casi! La oración correcta es:</p>
              <p className="mt-1 text-lg font-bold text-emerald-700">“{sentence.text}”</p>
            </div>
          )}
          {!checked && missing > 0 && board.answer.length > 0 && (
            <p className="text-center text-sm font-semibold text-slate-500">
              Te {missing === 1 ? 'falta 1 palabra' : `faltan ${missing} palabras`} por acomodar.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          {!checked ? (
            <>
              <button
                type="button"
                onClick={clearAnswer}
                disabled={board.answer.length === 0}
                className="btn btn-lg btn-secondary sm:w-auto"
              >
                <Eraser className="size-5" aria-hidden="true" />
                Borrar
              </button>
              <button type="button" onClick={check} disabled={missing > 0} className="btn btn-lg btn-blue flex-1">
                Comprobar ✅
              </button>
            </>
          ) : (
            <button type="button" onClick={next} className="btn btn-lg btn-blue flex-1" autoFocus>
              {isLast ? 'Finalizar ✅' : 'Siguiente'}
              {!isLast && <ArrowRight className="size-5" aria-hidden="true" />}
            </button>
          )}
        </div>
        <button type="button" onClick={exit} className="btn btn-md btn-danger-outline mt-4 w-full">
          ❌ Salir
        </button>
      </div>
    </div>
  );
}
