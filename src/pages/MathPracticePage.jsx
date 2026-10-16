import { ArrowRight, Flame, Target, Timer } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import ActivityHero from '../components/ui/ActivityHero';
import PreferenceToggles from '../components/ui/PreferenceToggles';
import ProgressBar from '../components/ui/ProgressBar';
import ResultSubmission from '../components/ui/ResultSubmission';
import StudentNameForm from '../components/ui/StudentNameForm';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useResultSubmission } from '../hooks/useResultSubmission';
import { useStopwatch } from '../hooks/useStopwatch';
import { activityApi } from '../lib/api';
import { launchConfetti } from '../lib/confetti';
import {
  createQuestionSet,
  LEVELS,
  normalizeLevel,
  OPERATION_IDS,
  OPERATIONS,
  parseOperations,
  parseQuestionsParam,
  QUESTION_COUNTS,
} from '../lib/mathQuestions';
import { sfx } from '../lib/sound';
import { cn, formatTime, percentage, scoreEmoji, scoreMessage } from '../lib/utils';

const LEVEL_SELECTED = {
  emerald: 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/15',
  amber: 'border-amber-500 bg-amber-50 ring-4 ring-amber-500/15',
  rose: 'border-rose-500 bg-rose-50 ring-4 ring-rose-500/15',
  violet: 'border-violet-500 bg-violet-50 ring-4 ring-violet-500/15',
};

const LEVEL_DOT = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
};

function displaySymbol(question) {
  return OPERATIONS[question.operation]?.display ?? question.symbol;
}

function parseCount(value) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 100) : null;
}

/* ------------------------------------------------------------------------ */

function SetupScreen({ config, setConfig, countOptions, onStart }) {
  const toggleOperation = (id) => {
    setConfig((prev) => ({
      ...prev,
      operations: prev.operations.includes(id) ? prev.operations.filter((op) => op !== id) : [...prev.operations, id],
    }));
  };
  const noOperation = config.operations.length === 0;

  return (
    <div className="card animate-fade-in-up p-6 sm:p-8 lg:p-10">
      <fieldset className="mb-8">
        <legend className="mb-1 text-lg font-bold text-slate-900 sm:text-xl">Selecciona las Operaciones</legend>
        <p className="mb-4 text-sm text-slate-500">Puedes elegir varias.</p>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {OPERATION_IDS.map((id) => {
            const op = OPERATIONS[id];
            const selected = config.operations.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleOperation(id)}
                aria-pressed={selected}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-4 transition duration-200 sm:p-6',
                  selected
                    ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10 ring-4 ring-emerald-500/15'
                    : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md',
                )}
              >
                {selected && (
                  <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                    ✓
                  </span>
                )}
                <span className="text-3xl sm:text-4xl" aria-hidden="true">
                  {op.emoji}
                </span>
                <span className="font-bold text-slate-900">{op.name}</span>
                <span className="font-display text-2xl text-slate-400" aria-hidden="true">
                  {op.display}
                </span>
              </button>
            );
          })}
        </div>
        {noOperation && (
          <p className="mt-3 text-sm font-semibold text-rose-600" role="alert">
            Selecciona al menos una operación para comenzar.
          </p>
        )}
      </fieldset>

      <fieldset className="mb-8">
        <legend className="mb-1 text-lg font-bold text-slate-900 sm:text-xl">Nivel de Dificultad</legend>
        <p className="mb-4 text-sm text-slate-500">En multiplicación y división se usan tablas acordes a cada nivel.</p>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Object.entries(LEVELS).map(([id, level]) => {
            const selected = config.level === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, level: id }))}
                aria-pressed={selected}
                className={cn(
                  'flex flex-col gap-1.5 rounded-2xl border-2 p-4 text-left transition duration-200 sm:p-5',
                  selected ? LEVEL_SELECTED[level.tone] : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md',
                )}
              >
                <span className="flex items-center gap-2 font-bold text-slate-900 sm:text-lg">
                  <span className={cn('size-2.5 rounded-full', LEVEL_DOT[level.tone])} aria-hidden="true" />
                  {level.name}
                </span>
                <span className="text-sm text-slate-600">
                  Números del {level.range[0]} al {level.range[1]}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mb-10">
        <legend className="mb-4 text-lg font-bold text-slate-900 sm:text-xl">Cantidad de Operaciones</legend>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {countOptions.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setConfig((prev) => ({ ...prev, count }))}
              aria-pressed={config.count === count}
              className={cn(
                'min-w-20 rounded-2xl border-2 px-6 py-3.5 font-display text-xl font-semibold transition duration-200',
                config.count === count
                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-emerald-400',
              )}
            >
              {count}
            </button>
          ))}
        </div>
      </fieldset>

      <button type="button" onClick={onStart} disabled={noOperation} className="btn btn-lg btn-primary w-full py-5 text-xl">
        🚀 Comenzar Práctica
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function QuestionCard({ question, answer, onAnswerChange, onSubmit, feedback, inputRef }) {
  const symbol = displaySymbol(question);
  const isDivision = question.operation === 'division';
  const inputClasses = cn(
    'w-full rounded-2xl border-4 bg-white px-3 py-2 text-center font-display text-4xl font-bold text-slate-900 transition focus:outline-none sm:text-5xl',
    !feedback && 'border-slate-200 focus:border-emerald-400',
    feedback?.correct && 'border-emerald-400 bg-emerald-50 text-emerald-700',
    feedback && !feedback.correct && 'border-rose-400 bg-rose-50 text-rose-700',
  );

  const input = (
    <input
      ref={inputRef}
      id="answer-input"
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      enterKeyHint="send"
      aria-label={`Resultado de ${question.num1} ${OPERATIONS[question.operation]?.name ?? ''} ${question.num2}`}
      value={answer}
      onChange={(e) => onAnswerChange(e.target.value.replace(/\D/g, '').slice(0, 7))}
      readOnly={Boolean(feedback)}
      placeholder="?"
      className={inputClasses}
    />
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col items-center">
      <span className="chip mb-6 bg-slate-100 px-4 py-2 text-sm text-slate-700">
        <span aria-hidden="true">{question.emoji}</span> {OPERATIONS[question.operation]?.name}
      </span>

      {isDivision ? (
        <div className="mb-8 flex flex-wrap items-center justify-center gap-3 font-display text-4xl font-bold text-slate-900 sm:text-5xl">
          <span>{question.num1}</span>
          <span className="text-emerald-500">{symbol}</span>
          <span>{question.num2}</span>
          <span className="text-slate-400">=</span>
          <span className="w-36 sm:w-44">{input}</span>
        </div>
      ) : (
        <div className="mb-8 w-full max-w-[17rem] rounded-3xl border-4 border-slate-100 bg-white p-6 shadow-xl sm:max-w-[19rem] sm:p-8">
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 font-display text-4xl font-bold text-slate-900 tabular-nums sm:text-5xl">
            <span />
            <span className="text-right">{question.num1}</span>
            <span className="text-emerald-500">{symbol}</span>
            <span className="text-right">{question.num2}</span>
          </div>
          <div className="my-4 border-t-4 border-slate-900" />
          {input}
        </div>
      )}

      <div className="min-h-16 w-full" aria-live="assertive">
        {feedback && (
          <div
            className={cn(
              'animate-pop flex flex-col items-center justify-between gap-3 rounded-2xl px-5 py-4 sm:flex-row',
              feedback.correct ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800',
            )}
          >
            <p className="text-lg font-extrabold">
              {feedback.correct ? '✅ ¡Correcto!' : `❌ Casi… la respuesta era ${feedback.expected}`}
            </p>
            <button type="submit" className={cn('btn btn-md', feedback.correct ? 'btn-primary' : 'btn-secondary')}>
              {feedback.last ? 'Ver resultados' : 'Siguiente'}
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {!feedback && (
        <button type="submit" disabled={answer === ''} className="btn btn-lg btn-primary w-full py-5 text-xl">
          Responder ✅
        </button>
      )}
    </form>
  );
}

/* ------------------------------------------------------------------------ */

export default function MathPracticePage() {
  useDocumentTitle(
    'Práctica de Matemáticas',
    'Practica sumas, restas, multiplicaciones y divisiones con ejercicios personalizados por nivel.',
  );
  const [params] = useSearchParams();

  const assigned = useMemo(() => parseQuestionsParam(params.get('questions') || params.get('preguntas')), [params]);
  const activityId = params.get('activity_id') || params.get('activityId') || null;
  const initialCount = parseCount(params.get('cantidad') || params.get('count')) ?? 10;
  const countOptions = useMemo(
    () => [...new Set([...QUESTION_COUNTS, initialCount])].sort((a, b) => a - b),
    [initialCount],
  );

  const [phase, setPhase] = useState(assigned ? 'name' : 'setup');
  const [studentName, setStudentName] = useState('');
  const [config, setConfig] = useState(() => ({
    level: normalizeLevel(params.get('nivel') || params.get('level')) || 'facil',
    operations: parseOperations(params.get('operaciones') || params.get('operations')) || ['suma', 'resta'],
    count: initialCount,
  }));
  const [questions, setQuestions] = useState(assigned ?? []);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [answers, setAnswers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [streak, setStreak] = useState(0);
  const [finalSeconds, setFinalSeconds] = useState(0);

  const stopwatch = useStopwatch();
  const submission = useResultSubmission(activityApi.submitMathResults);
  const inputRef = useRef(null);
  const advanceTimer = useRef(null);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  useEffect(() => {
    if (phase === 'playing' && !feedback) inputRef.current?.focus({ preventScroll: true });
  }, [phase, index, feedback]);

  const correctCount = answers.filter((a) => a.correct).length;
  const level = LEVELS[config.level];

  const beginPlaying = (questionList) => {
    clearTimeout(advanceTimer.current);
    setQuestions(questionList);
    setIndex(0);
    setAnswer('');
    setAnswers([]);
    setFeedback(null);
    setStreak(0);
    submission.reset();
    setPhase('playing');
    stopwatch.start();
  };

  const startPractice = () => {
    if (config.operations.length === 0) return;
    beginPlaying(createQuestionSet({ operations: config.operations, level: config.level, count: config.count }));
  };

  const finish = (finalAnswers) => {
    const seconds = stopwatch.stop();
    setFinalSeconds(seconds);
    setPhase('results');
    const correct = finalAnswers.filter((a) => a.correct).length;
    const score = percentage(correct, finalAnswers.length);
    if (score >= 90) {
      sfx.win();
      launchConfetti();
    }
    if (studentName) {
      submission.submit({
        activity_id: activityId,
        student_name: studentName,
        difficulty_level: assigned ? normalizeLevel(params.get('nivel') || params.get('level')) || 'personalizado' : config.level,
        total_questions: finalAnswers.length,
        correct_answers: correct,
        score_percentage: score,
        time_spent_seconds: seconds,
        answers: finalAnswers.map((item, i) => ({
          question_number: i + 1,
          num1: item.question.num1,
          num2: item.question.num2,
          operation: item.question.operation,
          symbol: item.question.symbol,
          correct_answer: item.question.answer,
          user_answer: item.userAnswer,
          is_correct: item.correct,
        })),
      });
    }
  };

  const goNext = (finalAnswers) => {
    clearTimeout(advanceTimer.current);
    if (index >= questions.length - 1) {
      finish(finalAnswers);
      return;
    }
    setFeedback(null);
    setAnswer('');
    setIndex((i) => i + 1);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (feedback) {
      goNext(answers);
      return;
    }
    if (answer === '') return;
    const question = questions[index];
    const userAnswer = Number(answer);
    const correct = userAnswer === question.answer;
    const nextAnswers = [...answers, { question, userAnswer, correct }];
    setAnswers(nextAnswers);
    setStreak((s) => (correct ? s + 1 : 0));
    setFeedback({ correct, expected: question.answer, last: index >= questions.length - 1 });
    if (correct) sfx.correct();
    else sfx.wrong();
    advanceTimer.current = setTimeout(() => goNext(nextAnswers), correct ? 1000 : 2200);
  };

  const exitPractice = () => {
    if (answers.length > 0 && !window.confirm('¿Seguro que quieres salir? Se perderá tu progreso.')) return;
    clearTimeout(advanceTimer.current);
    stopwatch.reset();
    setFeedback(null);
    setPhase(assigned ? 'name' : 'setup');
  };

  const playAgain = () => {
    if (assigned) beginPlaying(assigned);
    else {
      stopwatch.reset();
      setPhase('setup');
    }
  };

  /* ---------------------------------- Vistas ---------------------------------- */

  if (phase === 'name') {
    return (
      <StudentNameForm
        onSubmit={(name) => {
          setStudentName(name);
          beginPlaying(assigned);
        }}
      >
        <div className="flex items-start gap-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
          <span className="text-2xl" aria-hidden="true">
            📋
          </span>
          <div>
            <h2 className="mb-1 font-sans text-base font-bold text-slate-900">Información de la actividad</h2>
            <ul className="space-y-1 text-sm text-slate-700">
              <li>
                • <strong>{assigned.length}</strong> preguntas
              </li>
              <li>
                • Nivel:{' '}
                <strong>{LEVELS[normalizeLevel(params.get('nivel') || params.get('level'))]?.name || 'Personalizado'}</strong>
              </li>
              <li>• Tus resultados se enviarán a tu maestro</li>
            </ul>
          </div>
        </div>
      </StudentNameForm>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="container-page max-w-5xl py-8 sm:py-10">
        <ActivityHero
          emoji="🧮"
          title="Práctica de Matemáticas"
          description="Mejora tus habilidades matemáticas con ejercicios personalizados"
          actions={<PreferenceToggles />}
        />
        <SetupScreen config={config} setConfig={setConfig} countOptions={countOptions} onStart={startPractice} />
      </div>
    );
  }

  if (phase === 'results') {
    const score = percentage(correctCount, answers.length);
    return (
      <div className="container-page max-w-4xl py-8 sm:py-12">
        <div className="card animate-pop mb-6 p-6 text-center sm:p-10">
          <div className="mb-4 text-6xl sm:text-7xl" aria-hidden="true">
            {scoreEmoji(score)}
          </div>
          <h1 className="mb-2 text-3xl font-bold sm:text-5xl">¡Práctica Completada!</h1>
          <p className="mb-6 text-lg text-slate-600">{scoreMessage(score)}</p>
          <div className="mb-4">
            <p className="font-display text-6xl font-bold text-emerald-500 sm:text-7xl">
              {correctCount}/{answers.length}
            </p>
            <p className="text-xl font-semibold text-slate-600 sm:text-2xl">{score}% Correcto</p>
          </div>
          <p className="mb-6 text-lg font-semibold text-slate-600">⏱️ Tiempo: {formatTime(finalSeconds)}</p>
          <ResultSubmission
            status={submission.status}
            error={submission.error}
            onRetry={submission.retry}
            studentName={studentName}
          />
        </div>

        <section className="card mb-6 p-5 sm:p-8" aria-labelledby="resumen-respuestas">
          <h2 id="resumen-respuestas" className="mb-5 text-2xl font-semibold">
            Resumen de Respuestas
          </h2>
          <ol className="flex flex-col gap-2">
            {answers.map((item, i) => (
              <li
                key={i}
                className={cn(
                  'flex flex-wrap items-center gap-3 rounded-2xl border-2 px-4 py-3',
                  item.correct ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50',
                )}
              >
                <span className="min-w-9 font-bold text-slate-500">#{i + 1}</span>
                <span className="flex-1 font-display text-lg font-semibold text-slate-900">
                  {item.question.num1} {displaySymbol(item.question)} {item.question.num2} =
                </span>
                <span className="flex items-center gap-2 font-bold">
                  <span className={item.correct ? 'text-emerald-700' : 'text-rose-600 line-through'}>{item.userAnswer}</span>
                  {!item.correct && (
                    <>
                      <span className="text-slate-400" aria-hidden="true">
                        →
                      </span>
                      <span className="text-emerald-700">{item.question.answer}</span>
                    </>
                  )}
                </span>
                <span className="text-xl" aria-label={item.correct ? 'Correcta' : 'Incorrecta'}>
                  {item.correct ? '✅' : '❌'}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={playAgain} className="btn btn-lg btn-primary flex-1">
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
  const question = questions[index];
  return (
    <div className="container-page max-w-3xl py-8 sm:py-10">
      <div className="card mb-6 p-4 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3 text-sm font-bold text-slate-600 sm:text-base">
          <span>
            Pregunta {index + 1} de {questions.length}
          </span>
          {!assigned && level && <span className="chip bg-slate-100 text-slate-600">Nivel {level.name}</span>}
        </div>
        <ProgressBar value={index + (feedback ? 1 : 0)} max={questions.length} label="Progreso de la práctica" />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 font-bold text-slate-800">
          <span className="flex items-center gap-1.5">
            <Target className="size-5 text-emerald-500" aria-hidden="true" /> {correctCount} Correctas
          </span>
          {streak >= 3 && (
            <span className="animate-pop chip bg-orange-100 px-3 py-1.5 text-sm text-orange-700">
              <Flame className="size-4" aria-hidden="true" /> ¡Racha de {streak}!
            </span>
          )}
          <span className="flex items-center gap-1.5 tabular-nums">
            <Timer className="size-5 text-sky-500" aria-hidden="true" /> {formatTime(stopwatch.elapsed)}
          </span>
        </div>
      </div>

      <div className="card p-6 sm:p-10">
        <QuestionCard
          key={index}
          question={question}
          answer={answer}
          onAnswerChange={setAnswer}
          onSubmit={handleSubmit}
          feedback={feedback}
          inputRef={inputRef}
        />
        <button type="button" onClick={exitPractice} className="btn btn-md btn-danger-outline mt-4 w-full">
          ❌ Salir
        </button>
      </div>
    </div>
  );
}
