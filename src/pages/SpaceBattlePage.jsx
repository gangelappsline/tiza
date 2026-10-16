import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Rocket } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import BackLink from '../components/ui/BackLink';
import PreferenceToggles from '../components/ui/PreferenceToggles';
import { STORAGE_KEYS } from '../config';
import { DEFAULT_SETTINGS, DIFFICULTIES, SpaceBattleGame, WORLD } from '../games/spaceBattle/engine';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { launchConfetti } from '../lib/confetti';
import { sfx } from '../lib/sound';
import { readString, writeString } from '../lib/storage';
import { cn } from '../lib/utils';

const SOUND = {
  laser: sfx.laser,
  hit: sfx.hit,
  explosion: sfx.explosion,
  win: () => setTimeout(sfx.win, 250),
  lose: () => setTimeout(sfx.lose, 200),
};

function isInteractiveTarget(target) {
  return Boolean(target?.closest?.('input, select, textarea, button, a, [contenteditable="true"]'));
}

function HudItem({ icon, label, value, className }) {
  return (
    <div className={cn('flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 ring-1 ring-white/10', className)}>
      <span className="text-lg" aria-hidden="true">
        {icon}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[0.65rem] font-bold tracking-wider text-white/60 uppercase">{label}</span>
        <span className="font-display text-xl font-bold tabular-nums">{value}</span>
      </span>
    </div>
  );
}

function Instructions({ onStart }) {
  return (
    <div className="flex h-full flex-col">
      <h2 className="mb-4 text-2xl font-bold text-yellow-300">📖 Instrucciones</h2>
      <div className="flex-1 space-y-3 text-[0.95rem]">
        <div className="rounded-2xl bg-white/5 p-4">
          <h3 className="mb-1.5 font-sans text-base font-bold text-cyan-300">🎯 Objetivo</h3>
          <p className="text-white/85">Derrota a la nave enemiga sumando exactamente la cantidad de corazones que tenga.</p>
        </div>
        <div className="rounded-2xl bg-white/5 p-4">
          <h3 className="mb-1.5 font-sans text-base font-bold text-emerald-300">🎮 Controles</h3>
          <ul className="space-y-1 text-white/85">
            <li className="hidden lg:list-item">
              <strong>← →</strong> o <strong>A D</strong>: mover la nave
            </li>
            <li className="hidden lg:list-item">
              <strong>Espacio</strong>: disparar · <strong>P</strong>: pausa
            </li>
            <li className="lg:hidden">
              Mantén presionados los botones <strong>← →</strong> o desliza el dedo sobre el juego para moverte
            </li>
            <li className="lg:hidden">
              Botón <strong>🚀</strong> para disparar
            </li>
          </ul>
        </div>
        <div className="rounded-2xl bg-white/5 p-4">
          <h3 className="mb-1.5 font-sans text-base font-bold text-pink-300">⚡ Mecánicas</h3>
          <ul className="list-inside list-disc space-y-1 text-white/85">
            <li>Dispara a los asteroides con números</li>
            <li>Cada número se suma al poder de tu nave</li>
            <li>Debes alcanzar exactamente la vida del enemigo</li>
            <li>Si te pasas, pierdes</li>
            <li>Si un asteroide te golpea, pierdes</li>
          </ul>
        </div>
        <div className="rounded-2xl bg-white/5 p-4">
          <h3 className="mb-1.5 font-sans text-base font-bold text-orange-300">⚠️ Consejos</h3>
          <ul className="list-inside list-disc space-y-1 text-white/85">
            <li>Calcula bien antes de disparar: ¿cuánto te falta?</li>
            <li>Evita los asteroides innecesarios</li>
            <li>¡La suma exacta te dará la victoria!</li>
          </ul>
        </div>
      </div>
      {onStart && (
        <button type="button" onClick={onStart} className="btn btn-lg mt-5 w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:brightness-110">
          ✨ Comenzar
        </button>
      )}
    </div>
  );
}

function Settings({ settings, onChange }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-violet-300">⚙️ Configuración</h2>
      <div className="rounded-2xl bg-white/5 p-4">
        <label htmlFor="meteor-speed" className="mb-3 block font-bold text-cyan-300">
          🌠 Velocidad de Meteoritos
        </label>
        <input
          id="meteor-speed"
          type="range"
          min="0.1"
          max="0.5"
          step="0.05"
          value={settings.meteorSpeed}
          onChange={(e) => onChange({ meteorSpeed: Number.parseFloat(e.target.value) })}
          className="w-full accent-cyan-400"
        />
        <div className="mt-1 flex justify-between text-sm text-white/70">
          <span>Lento</span>
          <span className="font-bold text-cyan-300">{settings.meteorSpeed.toFixed(2)}</span>
          <span>Rápido</span>
        </div>
      </div>
      <div className="rounded-2xl bg-white/5 p-4">
        <label htmlFor="meteor-rate" className="mb-3 block font-bold text-emerald-300">
          ⏱️ Frecuencia de Meteoritos
        </label>
        <input
          id="meteor-rate"
          type="range"
          min="1000"
          max="3000"
          step="200"
          value={settings.meteorSpawnRate}
          onChange={(e) => onChange({ meteorSpawnRate: Number.parseInt(e.target.value, 10) })}
          className="w-full accent-emerald-400"
        />
        <div className="mt-1 flex justify-between text-sm text-white/70">
          <span>Muchos</span>
          <span className="font-bold text-emerald-300">{(settings.meteorSpawnRate / 1000).toFixed(1)}s</span>
          <span>Pocos</span>
        </div>
      </div>
      <fieldset className="rounded-2xl bg-white/5 p-4">
        <legend className="mb-3 font-bold text-pink-300">🧮 Dificultad de las Sumas</legend>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(DIFFICULTIES).map(([id, d]) => {
            const selected = settings.difficultyLevel === id;
            const tone = id === 'facil' ? 'bg-emerald-600' : id === 'media' ? 'bg-amber-500' : 'bg-rose-600';
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange({ difficultyLevel: id })}
                aria-pressed={selected}
                className={cn(
                  'rounded-xl px-2 py-3 font-bold transition',
                  selected ? `${tone} scale-105 text-white shadow-lg` : 'bg-white/10 text-white/70 hover:bg-white/20',
                )}
              >
                {d.label}
                <span className="block text-xs font-semibold opacity-80">({d.range})</span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <p className="text-sm text-white/60">Los cambios se aplican al momento, incluso durante la partida.</p>
    </div>
  );
}

function Overlay({ status, hud, onStart, onResume, onNext, onRestart, newRecord }) {
  if (status.state === 'playing') return null;

  let content = null;
  if (status.state === 'ready') {
    content = (
      <>
        <p className="mb-2 text-5xl" aria-hidden="true">
          🚀
        </p>
        <h2 className="mb-2 text-3xl font-bold text-white">¿Listo, piloto?</h2>
        <p className="mb-6 max-w-xs text-white/80">
          Suma exactamente <strong className="text-pink-300">{hud.enemy}</strong> para derrotar a la nave enemiga.
        </p>
        <button type="button" onClick={onStart} className="btn btn-lg btn-primary">
          ✨ Comenzar
        </button>
      </>
    );
  } else if (status.state === 'paused') {
    content = (
      <>
        <h2 className="mb-2 text-4xl font-bold text-yellow-300">⏸️ PAUSA</h2>
        <p className="mb-6 text-white/80">Tómate un respiro y piensa tu siguiente disparo.</p>
        <button type="button" onClick={onResume} className="btn btn-lg btn-primary">
          ▶️ Continuar
        </button>
      </>
    );
  } else if (status.state === 'won') {
    content = (
      <>
        <h2 className="mb-1 text-4xl font-bold text-yellow-300 sm:text-5xl">¡VICTORIA!</h2>
        <p className="mb-4 text-2xl font-bold text-emerald-300">¡Enemigo Derrotado!</p>
        <p className="text-lg text-white">
          Suma exacta: <strong>{status.power}</strong> = <strong>{status.enemy}</strong>
        </p>
        <p className="mb-2 text-lg text-white">
          Puntuación: <strong>{status.score}</strong>
        </p>
        {newRecord && <p className="mb-2 font-bold text-amber-300">🏅 ¡Nuevo récord!</p>}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onNext} className="btn btn-lg btn-primary">
            Siguiente nivel ➡️
          </button>
          <button type="button" onClick={onRestart} className="btn btn-md border-2 border-white/30 text-white hover:bg-white/10">
            🔄 Reiniciar
          </button>
        </div>
      </>
    );
  } else if (status.state === 'lost') {
    const overshoot = status.reason === 'overshoot';
    content = (
      <>
        <h2 className="mb-2 text-4xl font-bold text-rose-400 sm:text-5xl">¡JUEGO PERDIDO!</h2>
        <p className="mb-2 text-xl font-bold text-rose-200">
          {overshoot ? 'Te pasaste del valor del enemigo' : '¡Un asteroide impactó tu nave!'}
        </p>
        <p className="mb-2 text-lg text-white">
          {overshoot ? (
            <>
              Tu suma: <strong>{status.power}</strong> &gt; <strong>{status.enemy}</strong>
            </>
          ) : (
            'Debes evitar los asteroides'
          )}
        </p>
        <p className="mb-4 text-white/80">Puntuación final: {status.score}</p>
        {newRecord && <p className="mb-3 font-bold text-amber-300">🏅 ¡Nuevo récord!</p>}
        <button type="button" onClick={onRestart} className="btn btn-lg btn-primary">
          🔄 Jugar de nuevo
        </button>
      </>
    );
  }

  return (
    <div className="animate-pop absolute inset-0 z-10 grid place-items-center rounded-3xl bg-slate-950/75 p-6 text-center backdrop-blur-[2px]">
      <div className="flex flex-col items-center">{content}</div>
    </div>
  );
}

export default function SpaceBattlePage() {
  useDocumentTitle(
    'Batalla Espacial Matemática',
    'Juego de sumas en el espacio: dispara a los asteroides y suma exactamente la vida de la nave enemiga.',
  );
  const canvasRef = useRef(null);
  const boardRef = useRef(null);
  const gameRef = useRef(null);

  const [hud, setHud] = useState({ power: 0, enemy: 0, score: 0, level: 1 });
  const [status, setStatus] = useState({ state: 'ready' });
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [panel, setPanel] = useState('instructions');
  const [record, setRecord] = useState(() => Number(readString(STORAGE_KEYS.spaceRecord)) || 0);
  const [newRecord, setNewRecord] = useState(false);
  const recordRef = useRef(record);

  // Crear el motor del juego una sola vez.
  useEffect(() => {
    const game = new SpaceBattleGame(canvasRef.current, {
      settings: DEFAULT_SETTINGS,
      sound: SOUND,
      onHud: setHud,
      onState: (snapshot) => {
        setStatus(snapshot);
        if (snapshot.state === 'won') launchConfetti({ particleCount: 90, duration: 2000 });
        if ((snapshot.state === 'won' || snapshot.state === 'lost') && snapshot.score > recordRef.current) {
          recordRef.current = snapshot.score;
          writeString(STORAGE_KEYS.spaceRecord, String(snapshot.score));
          setRecord(snapshot.score);
          setNewRecord(true);
        }
      },
    });
    gameRef.current = game;
    return () => game.destroy();
  }, []);

  useEffect(() => {
    gameRef.current?.setSettings(settings);
  }, [settings]);

  // Tamaño del lienzo (nítido en pantallas de alta densidad).
  useEffect(() => {
    const board = boardRef.current;
    const canvas = canvasRef.current;
    if (!board || !canvas) return undefined;
    const resize = () => {
      const size = board.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(board);
    return () => observer.disconnect();
  }, []);

  // Teclado, pérdida de foco y cambio de pestaña.
  useEffect(() => {
    const onKeyDown = (event) => {
      const game = gameRef.current;
      if (!game || event.altKey || event.ctrlKey || event.metaKey || isInteractiveTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') {
        game.input.left = true;
        event.preventDefault();
      } else if (key === 'arrowright' || key === 'd') {
        game.input.right = true;
        event.preventDefault();
      } else if (key === ' ' || key === 'spacebar') {
        event.preventDefault();
        if (!event.repeat) game.fire();
      } else if (key === 'p' || key === 'escape') {
        game.togglePause();
      } else if (key === 'enter' && game.state === 'ready') {
        game.start();
      }
    };
    const onKeyUp = (event) => {
      const game = gameRef.current;
      if (!game) return;
      const key = event.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') game.input.left = false;
      if (key === 'arrowright' || key === 'd') game.input.right = false;
    };
    const releaseAll = () => {
      const game = gameRef.current;
      if (game) Object.assign(game.input, { left: false, right: false, targetX: null });
    };
    const onVisibility = () => {
      if (document.hidden) {
        releaseAll();
        gameRef.current?.pause();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', releaseAll);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', releaseAll);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const focusBoard = () => boardRef.current?.focus({ preventScroll: true });

  /** Ejecuta una acción del motor (start, pause, resume, restart, nextLevel). */
  const run = (action) => {
    const game = gameRef.current;
    if (!game) return;
    if (action !== 'resume') setNewRecord(false);
    game[action]();
    focusBoard();
  };

  // Mover la nave deslizando el dedo (o el ratón presionado) sobre el lienzo.
  const pointerToWorld = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return ((event.clientX - rect.left) / rect.width) * WORLD.width;
  };
  const onBoardPointerDown = (event) => {
    const game = gameRef.current;
    if (!game || game.state !== 'playing' || isInteractiveTarget(event.target)) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    game.input.targetX = pointerToWorld(event);
  };
  const onBoardPointerMove = (event) => {
    const game = gameRef.current;
    if (game && game.input.targetX !== null) game.input.targetX = pointerToWorld(event);
  };
  const onBoardPointerUp = () => {
    if (gameRef.current) gameRef.current.input.targetX = null;
  };

  const hold = (direction) => ({
    onPointerDown: (event) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      gameRef.current.input[direction] = true;
    },
    onPointerUp: () => {
      gameRef.current.input[direction] = false;
    },
    onPointerCancel: () => {
      gameRef.current.input[direction] = false;
    },
    onLostPointerCapture: () => {
      gameRef.current.input[direction] = false;
    },
    onContextMenu: (event) => event.preventDefault(),
  });

  const playing = status.state === 'playing';
  const paused = status.state === 'paused';
  const remainingText = hud.enemy - hud.power;

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-950 via-indigo-950 to-black text-white">
      <div className="container-page py-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <BackLink className="-ml-3 text-white/80 hover:bg-white/10 hover:text-white hover:shadow-none" />
          <PreferenceToggles dark />
        </div>
        <h1 className="mb-6 text-center text-3xl font-bold text-white sm:text-4xl">🚀 Batalla Espacial Matemática</h1>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Juego */}
          <section className="lg:col-span-7" aria-label="Juego">
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <HudItem icon="⚡" label="Poder" value={hud.power} className="text-yellow-300" />
              <HudItem icon="❤️" label="Enemigo" value={hud.enemy} className="text-pink-300" />
              <HudItem icon="🏆" label="Puntos" value={hud.score} className="text-emerald-300" />
              <HudItem icon="⭐" label={`Nivel · Récord ${record}`} value={hud.level} className="text-sky-300" />
            </div>

            <div
              ref={boardRef}
              tabIndex={-1}
              className="relative mx-auto aspect-square w-full max-w-[600px] touch-none rounded-3xl outline-none select-none"
              onPointerDown={onBoardPointerDown}
              onPointerMove={onBoardPointerMove}
              onPointerUp={onBoardPointerUp}
              onPointerCancel={onBoardPointerUp}
            >
              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full rounded-3xl border-2 border-violet-500/60 shadow-2xl shadow-violet-900/40"
                role="img"
                aria-label={`Tablero del juego. Poder ${hud.power} de ${hud.enemy}. Nivel ${hud.level}.`}
              />
              <Overlay
                status={status}
                hud={hud}
                newRecord={newRecord}
                onStart={() => run('start')}
                onResume={() => run('resume')}
                onNext={() => run('nextLevel')}
                onRestart={() => run('restart')}
              />
            </div>

            <p className="mt-3 text-center text-sm font-semibold text-white/70" aria-live="polite">
              {playing && remainingText > 0
                ? `Te faltan ${remainingText} para derrotar al enemigo`
                : 'Mover: ← → | Disparar: Espacio | Pausa: P'}
            </p>

            {/* Controles táctiles */}
            <div className="mx-auto mt-4 grid max-w-md grid-cols-3 gap-3 lg:hidden">
              <button
                type="button"
                {...hold('left')}
                className="grid touch-none place-items-center rounded-2xl bg-violet-600 py-5 shadow-lg select-none active:scale-95 active:bg-violet-700"
                aria-label="Mover a la izquierda"
              >
                <ChevronLeft className="size-9" aria-hidden="true" />
              </button>
              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  gameRef.current?.fire();
                }}
                onContextMenu={(event) => event.preventDefault()}
                className="grid touch-none place-items-center rounded-2xl bg-rose-600 py-5 shadow-lg select-none active:scale-95 active:bg-rose-700"
                aria-label="Disparar"
              >
                <Rocket className="size-8" aria-hidden="true" />
              </button>
              <button
                type="button"
                {...hold('right')}
                className="grid touch-none place-items-center rounded-2xl bg-violet-600 py-5 shadow-lg select-none active:scale-95 active:bg-violet-700"
                aria-label="Mover a la derecha"
              >
                <ChevronRight className="size-9" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => run(paused ? 'resume' : 'pause')}
                disabled={!playing && !paused}
                className={cn('btn btn-md text-white shadow-lg', paused ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600')}
              >
                {paused ? <Play className="size-5" aria-hidden="true" /> : <Pause className="size-5" aria-hidden="true" />}
                {paused ? 'Continuar' : 'Pausar'}
              </button>
              <button type="button" onClick={() => run('restart')} className="btn btn-md bg-sky-600 text-white shadow-lg hover:bg-sky-700">
                <RotateCcw className="size-5" aria-hidden="true" />
                Reiniciar
              </button>
            </div>
          </section>

          {/* Panel lateral */}
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-6 lg:order-first lg:col-span-5">
            <div className="mb-5 flex rounded-2xl bg-black/30 p-1" role="group" aria-label="Panel">
              {[
                { id: 'instructions', label: '📖 Instrucciones' },
                { id: 'settings', label: '⚙️ Configuración' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPanel(tab.id)}
                  aria-pressed={panel === tab.id}
                  className={cn(
                    'flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition',
                    panel === tab.id ? 'bg-white text-slate-900 shadow' : 'text-white/70 hover:text-white',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {panel === 'instructions' ? (
              <Instructions onStart={status.state === 'ready' ? () => run('start') : null} />
            ) : (
              <Settings settings={settings} onChange={(change) => setSettings((prev) => ({ ...prev, ...change }))} />
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
