import { Heart, Moon, Utensils } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import BackLink from '../components/ui/BackLink';
import PreferenceToggles from '../components/ui/PreferenceToggles';
import ProgressBar from '../components/ui/ProgressBar';
import { STORAGE_KEYS } from '../config';
import { drawPet, MOOD_LABELS, MOODS, PETS, stageForLevel } from '../games/virtualPet/drawPet';
import {
  createPetQuestion,
  createProfile,
  levelFromXp,
  normalizeProfile,
  tickNeeds,
  XP_PER_ANSWER,
  XP_PER_LEVEL,
} from '../games/virtualPet/petLogic';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { launchConfetti } from '../lib/confetti';
import { sfx } from '../lib/sound';
import { readJSON, removeKey, writeJSON } from '../lib/storage';
import { cn } from '../lib/utils';

const CANVAS_SIZE = 400;
const clampNeed = (value) => Math.min(100, Math.max(0, value));

function needTone(value) {
  if (value > 70) return 'bg-emerald-500';
  if (value > 40) return 'bg-amber-400';
  return 'bg-rose-500';
}

function NeedBar({ icon, label, value }) {
  const rounded = Math.round(value);
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm font-bold text-slate-700">
        <span>
          <span aria-hidden="true">{icon}</span> {label}
        </span>
        <span className="tabular-nums">{rounded}%</span>
      </div>
      <div
        className="h-3.5 overflow-hidden rounded-full bg-slate-200"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rounded}
      >
        <div className={cn('h-full rounded-full transition-all duration-500', needTone(value))} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function AdoptionScreen({ onAdopt }) {
  const [selected, setSelected] = useState(PETS[0].id);
  const [name, setName] = useState('');
  const nameId = useId();

  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <BackLink className="-ml-3 mb-4" />
      <form
        className="card animate-fade-in-up p-6 sm:p-10"
        onSubmit={(event) => {
          event.preventDefault();
          onAdopt(selected, name);
        }}
      >
        <div className="mb-8 text-center">
          <p className="mb-2 text-5xl" aria-hidden="true">
            🥚
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">Elige tu Mascota IA</h1>
          <p className="mt-2 text-slate-600">Cuídala, aliméntala y entrénala resolviendo operaciones para que crezca.</p>
        </div>
        <fieldset className="mb-8">
          <legend className="sr-only">Tipo de mascota</legend>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PETS.map((pet) => {
              const active = selected === pet.id;
              return (
                <label
                  key={pet.id}
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 p-5 transition has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-emerald-500',
                    active
                      ? 'scale-105 border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/15'
                      : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-300',
                  )}
                >
                  <input
                    type="radio"
                    name="mascota"
                    value={pet.id}
                    checked={active}
                    onChange={() => setSelected(pet.id)}
                    className="sr-only"
                  />
                  <span className={cn('text-5xl transition', active && 'animate-wiggle')} aria-hidden="true">
                    {pet.emoji}
                  </span>
                  <span className="font-bold text-slate-800">{pet.name}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="mb-8">
          <label htmlFor={nameId} className="label">
            ¿Cómo se llamará? <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <input
            id={nameId}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder={`Por ejemplo: ${PETS.find((p) => p.id === selected)?.name}`}
            className="input"
          />
        </div>
        <button type="submit" className="btn btn-lg btn-primary w-full py-5 text-xl">
          💚 ¡Adoptar!
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

export default function VirtualPetPage() {
  useDocumentTitle(
    'Mascota Virtual',
    'Adopta una mascota virtual, cuídala y hazla crecer resolviendo sumas, restas y multiplicaciones.',
  );
  const [profile, setProfile] = useState(() => normalizeProfile(readJSON(STORAGE_KEYS.pet)));
  const [mood, setMood] = useState(MOODS.IDLE);
  const [question, setQuestion] = useState(() => createPetQuestion(profile?.level ?? 1));
  const [answer, setAnswer] = useState('');
  const [thinking, setThinking] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const canvasRef = useRef(null);
  const moodRef = useRef(mood);
  const visualRef = useRef({ petId: null, color: '#000', stageName: 'Bebé', stageScale: 0.8 });
  const animRef = useRef({ phase: 0, blink: 0, eyesOpen: true, scale: 1, targetScale: 1 });
  const particlesRef = useRef([]);
  const timers = useRef([]);
  const moodTimer = useRef(null);
  const answerId = useId();

  const petId = profile?.pet.id ?? null;
  const stage = profile ? stageForLevel(profile.level) : null;

  // Sincronizar los datos que usa la animación.
  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);
  useEffect(() => {
    if (!profile) return;
    const s = stageForLevel(profile.level);
    visualRef.current = { petId: profile.pet.id, color: profile.pet.color, stageName: s.name, stageScale: s.scale };
  }, [profile]);

  // Guardar el progreso.
  useEffect(() => {
    if (profile) writeJSON(STORAGE_KEYS.pet, { ...profile, lastUpdated: Date.now() });
  }, [profile]);

  // Las necesidades bajan poco a poco (cada 5 segundos, como en el original).
  useEffect(() => {
    if (!petId) return undefined;
    const id = setInterval(() => setProfile((p) => (p ? { ...p, needs: tickNeeds(p.needs) } : p)), 5000);
    return () => clearInterval(id);
  }, [petId]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      clearTimeout(moodTimer.current);
    },
    [],
  );

  // Bucle de animación (las partículas viven en una ref para no re-renderizar a 60 fps).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !petId) return undefined;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    const ctx = canvas.getContext('2d');
    const anim = animRef.current;
    let raf = 0;
    let last = performance.now();

    const render = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const currentMood = moodRef.current;
      const visual = visualRef.current;
      const sleeping = currentMood === MOODS.SLEEPING;
      const excited = currentMood === MOODS.EXCITED;

      anim.phase += dt * (excited ? 9 : sleeping ? 1.3 : 3);
      const offsetY = Math.sin(anim.phase) * (excited ? 16 : sleeping ? 3 : 9);
      anim.blink += dt;
      if (anim.blink > 3.2) {
        anim.eyesOpen = false;
        if (anim.blink > 3.35) {
          anim.blink = 0;
          anim.eyesOpen = true;
        }
      }
      anim.scale += (anim.targetScale - anim.scale) * Math.min(1, dt * 12);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      drawPet(ctx, {
        petId: visual.petId,
        color: visual.color,
        mood: currentMood,
        eyesOpen: anim.eyesOpen,
        offsetY,
        scale: visual.stageScale * anim.scale,
        stage: visual.stageName,
      });

      const particles = particlesRef.current;
      for (const p of particles) {
        p.x += p.vx * dt * 60;
        p.y -= p.vy * dt * 60;
        p.life -= dt;
      }
      particlesRef.current = particles.filter((p) => p.life > 0);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const p of particlesRef.current) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.font = `${p.size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        ctx.fillText(p.emoji, p.x, p.y);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [petId]);

  /* ------------------------------ Acciones ------------------------------ */

  const later = useCallback((fn, ms) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const spawn = (emoji, count = 8) => {
    const items = Array.from({ length: count }, () => ({
      x: 200 + (Math.random() - 0.5) * 120,
      y: 200,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 3 + 1.5,
      life: 1.1,
      maxLife: 1.1,
      size: 22 + Math.random() * 12,
      emoji,
    }));
    particlesRef.current = [...particlesRef.current, ...items];
  };

  const temporaryMood = (nextMood, ms) => {
    clearTimeout(moodTimer.current);
    setMood(nextMood);
    moodTimer.current = setTimeout(() => setMood(MOODS.IDLE), ms);
  };

  const updateNeeds = (fn) => setProfile((p) => (p ? { ...p, needs: fn(p.needs) } : p));

  const petThePet = () => {
    if (!profile || thinking) return;
    temporaryMood(MOODS.HAPPY, 700);
    spawn('💖', 8);
    sfx.pop();
    updateNeeds((n) => ({ ...n, happiness: clampNeed(n.happiness + 5) }));
    animRef.current.targetScale = 1.18;
    later(() => {
      animRef.current.targetScale = 1;
    }, 220);
  };

  const feed = () => {
    if (!profile || thinking) return;
    if (profile.needs.energy < 10) {
      setFeedback({ tone: 'warn', text: 'Tu mascota está muy cansada para comer. ¡Déjala dormir un poco!' });
      return;
    }
    temporaryMood(MOODS.EATING, 1500);
    spawn('🍖', 5);
    sfx.eat();
    updateNeeds((n) => ({ ...n, hunger: clampNeed(n.hunger + 30), energy: clampNeed(n.energy - 5) }));
    setFeedback({ tone: 'info', text: '¡Ñam, ñam! Qué rico 🍖' });
  };

  const sleep = () => {
    if (!profile || thinking) return;
    temporaryMood(MOODS.SLEEPING, 2200);
    spawn('💤', 3);
    sfx.sleep();
    updateNeeds((n) => ({ ...n, energy: clampNeed(n.energy + 40) }));
    setFeedback({ tone: 'info', text: 'Zzz… tu mascota recuperó energía 💤' });
  };

  const handleCanvasClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * CANVAS_SIZE;
    const y = ((event.clientY - rect.top) / rect.height) * CANVAS_SIZE;
    if (Math.hypot(x - 200, y - 212) < 110) petThePet();
  };

  const handleAnswer = (event) => {
    event.preventDefault();
    if (!profile || thinking || answer === '') return;
    if (profile.needs.energy < 5) {
      setFeedback({ tone: 'warn', text: 'Tu mascota está muy cansada. ¡Déjala descansar!' });
      temporaryMood(MOODS.SLEEPING, 2000);
      return;
    }
    const correct = Number(answer) === question.answer;
    const expected = question.answer;
    const newXp = profile.xp + (correct ? XP_PER_ANSWER : 0);
    const newLevel = levelFromXp(newXp);
    const leveledUp = newLevel > profile.level;
    const oldStage = stageForLevel(profile.level).name;
    const newStage = stageForLevel(newLevel).name;

    setThinking(true);
    clearTimeout(moodTimer.current);
    setMood(MOODS.THINKING);

    later(() => {
      setThinking(false);
      if (correct) {
        setProfile((p) =>
          p
            ? {
                ...p,
                xp: p.xp + XP_PER_ANSWER,
                level: levelFromXp(p.xp + XP_PER_ANSWER),
                practices: p.practices + 1,
                needs: {
                  hunger: clampNeed(p.needs.hunger - 3),
                  happiness: clampNeed(p.needs.happiness + 10),
                  energy: clampNeed(p.needs.energy - 2),
                },
              }
            : p,
        );
        if (leveledUp) {
          temporaryMood(MOODS.EXCITED, 2200);
          spawn('⭐', 15);
          sfx.levelUp();
          launchConfetti({ particleCount: 110 });
          setFeedback({
            tone: 'success',
            text:
              newStage !== oldStage
                ? `¡SUBISTE DE NIVEL! ✨🎉 ¡Ahora es ${newStage}!`
                : `¡SUBISTE DE NIVEL! ✨🎉 Nivel ${newLevel}`,
          });
        } else {
          temporaryMood(MOODS.HAPPY, 1100);
          spawn('💚', 8);
          sfx.correct();
          setFeedback({ tone: 'success', text: `¡Correcto! Tu mascota creció ✨ (+${XP_PER_ANSWER} XP)` });
        }
      } else {
        temporaryMood(MOODS.SAD, 1500);
        spawn('💔', 5);
        sfx.wrong();
        updateNeeds((n) => ({ ...n, happiness: clampNeed(n.happiness - 5), energy: clampNeed(n.energy - 2) }));
        setFeedback({ tone: 'error', text: `Casi, intenta otra vez 💪 (la respuesta era ${expected})` });
      }
      setAnswer('');
      setQuestion(createPetQuestion(newLevel));
    }, 550);
  };

  const adopt = (selectedPet, name) => {
    const newProfile = createProfile(selectedPet, name);
    setProfile(newProfile);
    setQuestion(createPetQuestion(1));
    setFeedback({ tone: 'success', text: `¡Bienvenido a casa, ${newProfile.petName}! 🏡` });
    particlesRef.current = [];
    sfx.win();
  };

  const releasePet = () => {
    if (!window.confirm('¿Quieres cambiar de mascota? Se perderá el progreso de tu mascota actual.')) return;
    removeKey(STORAGE_KEYS.pet);
    setProfile(null);
    setFeedback(null);
    setMood(MOODS.IDLE);
  };

  /* -------------------------------- Vistas -------------------------------- */

  if (!profile) return <AdoptionScreen onAdopt={adopt} />;

  const { needs } = profile;
  const xpInLevel = profile.xp % XP_PER_LEVEL;
  const displayMood = mood === MOODS.IDLE && (needs.hunger < 25 || needs.happiness < 25) ? MOODS.SAD : mood;
  const bubble =
    mood !== MOODS.IDLE
      ? null
      : needs.hunger < 30
        ? '🍖 ¡Tengo hambre!'
        : needs.energy < 20
          ? '😴 Tengo sueño…'
          : needs.happiness < 30
            ? '🥺 ¡Juega conmigo!'
            : null;

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-sky-50 to-violet-50">
      <div className="container-page max-w-6xl py-6 sm:py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <BackLink className="-ml-3" />
          <PreferenceToggles />
        </div>
        <h1 className="sr-only">Mascota Virtual</h1>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Mascota */}
          <section className="card overflow-hidden" aria-label={`Tu mascota ${profile.petName}`}>
            <div className="bg-gradient-to-br from-sky-50 to-indigo-50 p-6 text-center sm:p-8">
              <h2 className="text-3xl font-bold">
                <span aria-hidden="true">{profile.pet.emoji}</span> {profile.petName}
              </h2>
              <p className="mt-1 text-lg font-semibold text-slate-600">
                Etapa: {stage.name} | Nivel {profile.level}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-500" aria-live="polite">
                {MOOD_LABELS[displayMood]}
              </p>

              <div className="relative mx-auto mt-4 w-full max-w-[360px]">
                {bubble && (
                  <span className="animate-pop absolute top-3 right-0 z-10 rounded-2xl rounded-br-sm bg-white px-3 py-2 text-sm font-extrabold text-slate-700 shadow-lg">
                    {bubble}
                  </span>
                )}
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="aspect-square w-full cursor-pointer rounded-3xl bg-gradient-to-b from-white to-sky-100 shadow-inner"
                  role="img"
                  aria-label={`${profile.petName}, ${profile.pet.name.toLowerCase()} en etapa ${stage.name}. ${MOOD_LABELS[displayMood]}`}
                />
              </div>
              <p className="mt-2 text-sm text-slate-500">👆 ¡Haz clic en tu mascota para acariciarla!</p>
            </div>

            <div className="space-y-5 p-6 sm:p-8">
              <div>
                <div className="mb-1 flex justify-between text-sm font-bold text-slate-700">
                  <span>✨ Experiencia</span>
                  <span className="tabular-nums">
                    {xpInLevel}/{XP_PER_LEVEL} XP
                  </span>
                </div>
                <ProgressBar value={xpInLevel} max={XP_PER_LEVEL} tone="amber" label="Experiencia para el siguiente nivel" />
              </div>
              <NeedBar icon="🍖" label="Comida" value={needs.hunger} />
              <NeedBar icon="😊" label="Felicidad" value={needs.happiness} />
              <NeedBar icon="⚡" label="Energía" value={needs.energy} />

              <div className="grid grid-cols-3 gap-3 pt-2">
                <button type="button" onClick={feed} disabled={thinking} className="btn btn-md bg-orange-500 text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600">
                  <Utensils className="size-5" aria-hidden="true" />
                  <span className="hidden sm:inline">Alimentar</span>
                  <span className="sm:hidden">Comer</span>
                </button>
                <button type="button" onClick={sleep} disabled={thinking} className="btn btn-md bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-600">
                  <Moon className="size-5" aria-hidden="true" />
                  Dormir
                </button>
                <button type="button" onClick={petThePet} disabled={thinking} className="btn btn-md bg-pink-500 text-white shadow-lg shadow-pink-500/25 hover:bg-pink-600">
                  <Heart className="size-5" aria-hidden="true" />
                  <span className="hidden sm:inline">Acariciar</span>
                  <span className="sm:hidden">Mimar</span>
                </button>
              </div>
            </div>
          </section>

          {/* Entrenamiento */}
          <section className="flex flex-col gap-6" aria-labelledby="titulo-entrenamiento">
            <div className="card bg-gradient-to-br from-violet-50 to-pink-50 p-6 text-center sm:p-8">
              <h2 id="titulo-entrenamiento" className="mb-2 text-3xl font-bold text-violet-800">
                🧠 ¡Entrena tu Mascota!
              </h2>
              <p className="mb-6 text-slate-600">Cada respuesta correcta le da {XP_PER_ANSWER} XP a {profile.petName}.</p>
              <form onSubmit={handleAnswer}>
                <label htmlFor={answerId} className="sr-only">
                  Resultado de {question.text}
                </label>
                <div className="mb-6 rounded-3xl bg-white py-8 font-display text-5xl font-bold text-slate-800 shadow-inner sm:text-6xl" aria-hidden="true">
                  {question.text} = ?
                </div>
                <input
                  id={answerId}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="?"
                  disabled={thinking}
                  className="w-44 rounded-2xl border-4 border-violet-200 bg-white p-4 text-center font-display text-3xl font-bold shadow-lg transition focus:border-violet-500 focus:outline-none"
                />
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={thinking || answer === ''}
                    className="btn btn-lg bg-gradient-to-r from-violet-500 to-pink-500 px-10 text-white shadow-lg shadow-violet-500/25 hover:brightness-110"
                  >
                    {thinking ? '🤔 Pensando…' : '✅ Responder'}
                  </button>
                </div>
              </form>
              <div className="mt-6 min-h-14" aria-live="polite">
                {feedback && (
                  <p
                    key={feedback.text}
                    className={cn(
                      'animate-pop rounded-2xl px-5 py-3.5 text-lg font-bold shadow-sm',
                      feedback.tone === 'success' && 'bg-emerald-100 text-emerald-800',
                      feedback.tone === 'error' && 'bg-rose-100 text-rose-800',
                      feedback.tone === 'warn' && 'bg-amber-100 text-amber-900',
                      feedback.tone === 'info' && 'bg-white text-slate-700',
                    )}
                  >
                    {feedback.text}
                  </p>
                )}
              </div>
            </div>

            <div className="card grid grid-cols-2 gap-4 p-6 text-center">
              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="font-display text-3xl font-bold text-amber-600">{profile.xp}</p>
                <p className="text-sm font-bold text-amber-800">✨ XP total</p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-4">
                <p className="font-display text-3xl font-bold text-sky-600">{profile.practices}</p>
                <p className="text-sm font-bold text-sky-800">📚 Prácticas</p>
              </div>
              <p className="col-span-2 text-sm text-slate-500">
                Etapas: Bebé (nivel 1-2) · Joven (3-5) · Adulto (6-9) · Maestro (10+) 🎓
              </p>
              <button type="button" onClick={releasePet} className="col-span-2 text-sm font-bold text-slate-400 underline-offset-4 hover:text-rose-600 hover:underline">
                Cambiar de mascota
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
