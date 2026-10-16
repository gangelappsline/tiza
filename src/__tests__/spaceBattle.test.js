import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SpaceBattleGame } from '../games/spaceBattle/engine';

/** Lienzo falso: acepta cualquier llamada de dibujo. */
function fakeCanvas() {
  const ctx = new Proxy(
    {},
    {
      get: (target, prop) => (prop in target ? target[prop] : () => ({ addColorStop() {}, width: 10 })),
      set: (target, prop, value) => {
        target[prop] = value;
        return true;
      },
    },
  );
  return { width: 600, height: 600, getContext: () => ctx };
}

describe('Batalla Espacial Matemática', () => {
  let game;
  let states;

  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', () => 1);
    vi.stubGlobal('cancelAnimationFrame', () => {});
    states = [];
    game = new SpaceBattleGame(fakeCanvas(), { onState: (s) => states.push(s.state) });
    game.enemyValue = 15;
    game.start();
  });

  afterEach(() => {
    game.destroy();
    vi.unstubAllGlobals();
  });

  it('gana al sumar exactamente la vida del enemigo', () => {
    game.handleAsteroidHit({ x: 100, y: 100, value: 9 });
    expect(game.state).toBe('playing');
    game.handleAsteroidHit({ x: 100, y: 100, value: 6 });
    expect(game.state).toBe('won');
    expect(game.score).toBe(20);
  });

  it('pierde si se pasa del valor del enemigo', () => {
    game.handleAsteroidHit({ x: 100, y: 100, value: 9 });
    game.handleAsteroidHit({ x: 100, y: 100, value: 7 });
    expect(game.state).toBe('lost');
    expect(game.loseReason).toBe('overshoot');
  });

  it('sube de nivel con un enemigo más fuerte', () => {
    game.handleAsteroidHit({ x: 0, y: 0, value: 15 });
    game.nextLevel();
    expect(game.level).toBe(2);
    expect(game.enemyValue).toBeGreaterThanOrEqual(15);
    expect(game.power).toBe(0);
    expect(game.state).toBe('playing');
  });

  it('pausa y reanuda', () => {
    game.pause();
    expect(game.state).toBe('paused');
    game.resume();
    expect(game.state).toBe('playing');
    expect(states).toContain('paused');
  });

  it('el movimiento no depende de los cuadros por segundo', () => {
    game.input.right = true;
    const start = game.ship.x;
    for (let i = 0; i < 30; i += 1) game.update(1 / 60);
    const at60 = game.ship.x - start;
    game.ship.x = start;
    for (let i = 0; i < 72; i += 1) game.update(1 / 144);
    const at144 = game.ship.x - start;
    expect(Math.abs(at60 - at144)).toBeLessThan(2);
  });

  it('un asteroide que choca con la nave termina la partida', () => {
    game.asteroids.push({ x: game.ship.x, y: game.ship.y, r: 22, value: 3, rot: 0, spin: 0, speedFactor: 0, shape: [], craters: [] });
    game.update(0.016);
    expect(game.state).toBe('lost');
    expect(game.loseReason).toBe('collision');
  });
});
