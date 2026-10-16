/**
 * Motor de "Batalla Espacial Matemática".
 *
 * Reglas (iguales al juego original):
 *  - La nave enemiga tiene un valor de vida (corazones).
 *  - Cada asteroide destruido suma su número al poder de tu nave.
 *  - Ganas si tu poder llega EXACTAMENTE a la vida del enemigo.
 *  - Pierdes si te pasas o si un asteroide choca con tu nave.
 *
 * Mejoras: animación independiente de los FPS, sprites dibujados con
 * vectores (nítidos en cualquier pantalla), niveles progresivos y partículas.
 */

export const WORLD = { width: 600, height: 600 };

export const DIFFICULTIES = {
  facil: { label: 'Fácil', range: '1-5', max: 5 },
  media: { label: 'Media', range: '1-9', max: 9 },
  dificil: { label: 'Difícil', range: '1-15', max: 15 },
};

export const DEFAULT_SETTINGS = {
  meteorSpeed: 0.15, // 0.1 – 0.5 (como en el original)
  meteorSpawnRate: 1800, // milisegundos entre asteroides
  difficultyLevel: 'media',
};

const SHIP_SPEED = 320; // px/s
const BULLET_SPEED = 470; // px/s
const FIRE_COOLDOWN = 0.22; // s
const MAX_ASTEROIDS = 14;

const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function makeAsteroidShape(radius) {
  const points = 11;
  return Array.from({ length: points }, (_, i) => {
    const angle = (i / points) * Math.PI * 2;
    const r = radius * rand(0.84, 1.08);
    return [Math.cos(angle) * r, Math.sin(angle) * r];
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHeart(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-8, -1, -8, -9, -2.5, -9);
  ctx.bezierCurveTo(-1, -9, 0, -8, 0, -6.5);
  ctx.bezierCurveTo(0, -8, 1, -9, 2.5, -9);
  ctx.bezierCurveTo(8, -9, 8, -1, 0, 5);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export class SpaceBattleGame {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ settings?: object, onState?: Function, onHud?: Function, sound?: Record<string, Function> }} options
   */
  constructor(canvas, { settings, onState, onHud, sound } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.onState = onState ?? (() => {});
    this.onHud = onHud ?? (() => {});
    this.sound = sound ?? {};
    this.input = { left: false, right: false, targetX: null };
    this.stars = Array.from({ length: 110 }, () => ({
      x: rand(0, WORLD.width),
      y: rand(0, WORLD.height),
      size: rand(0.5, 2.1),
      speed: rand(6, 34),
      phase: rand(0, Math.PI * 2),
    }));
    this.level = 1;
    this.score = 0;
    this.state = 'ready';
    this.time = 0;
    this.lastTime = 0;
    this.loop = this.loop.bind(this);
    this.resetRound();
    this.raf = requestAnimationFrame(this.loop);
  }

  /* ------------------------------ Control ------------------------------ */

  setSettings(settings) {
    this.settings = { ...this.settings, ...settings };
  }

  start() {
    if (this.state === 'ready') this.setState('playing');
  }

  pause() {
    if (this.state === 'playing') this.setState('paused');
  }

  resume() {
    if (this.state === 'paused') this.setState('playing');
  }

  togglePause() {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') this.resume();
  }

  /** Empieza de cero (nivel 1, 0 puntos). */
  restart() {
    this.level = 1;
    this.score = 0;
    this.resetRound();
    this.setState('playing');
  }

  nextLevel() {
    this.level += 1;
    this.resetRound();
    this.setState('playing');
  }

  fire() {
    if (this.state !== 'playing' || this.fireCooldown > 0) return;
    this.bullets.push({ x: this.ship.x, y: this.ship.y - 34, r: 5 });
    this.fireCooldown = FIRE_COOLDOWN;
    this.sound.laser?.();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
  }

  /* ------------------------------ Estado ------------------------------ */

  resetRound() {
    const min = 11 + (this.level - 1) * 4;
    const max = 24 + (this.level - 1) * 6;
    this.enemyValue = randInt(min, max);
    this.power = 0;
    this.ship = { x: WORLD.width / 2, y: WORLD.height - 72, w: 52, tilt: 0 };
    this.enemy = {
      x: WORLD.width / 2,
      y: 92,
      w: 112,
      dir: Math.random() > 0.5 ? 1 : -1,
      speed: 36 + (this.level - 1) * 8,
      flash: 0,
      alive: true,
    };
    this.bullets = [];
    this.asteroids = [];
    this.particles = [];
    this.floaters = [];
    this.spawnTimer = 0.5;
    this.fireCooldown = 0;
    this.loseReason = null;
    this.emitHud();
  }

  snapshot() {
    return {
      state: this.state,
      reason: this.loseReason,
      level: this.level,
      score: this.score,
      power: this.power,
      enemy: this.enemyValue,
    };
  }

  setState(state) {
    this.state = state;
    this.onState(this.snapshot());
  }

  emitHud() {
    this.onHud({ power: this.power, enemy: this.enemyValue, score: this.score, level: this.level });
  }

  /* ------------------------------ Lógica ------------------------------ */

  spawnAsteroid() {
    if (this.asteroids.length >= MAX_ASTEROIDS) return;
    const max = DIFFICULTIES[this.settings.difficultyLevel]?.max ?? 9;
    let value = randInt(1, max);
    // Ayuda: a veces aparece un número que todavía cabe en la suma.
    const remaining = this.enemyValue - this.power;
    if (remaining > 0 && remaining < max && Math.random() < 0.35) value = randInt(1, remaining);

    const radius = 21 + Math.min(value, 15) * 0.45;
    let x = rand(40, WORLD.width - 40);
    for (let tries = 0; tries < 6; tries += 1) {
      const crowded = this.asteroids.some((a) => a.y < 70 && Math.abs(a.x - x) < a.r + radius + 12);
      if (!crowded) break;
      x = rand(40, WORLD.width - 40);
    }
    this.asteroids.push({
      x,
      y: -radius - 6,
      r: radius,
      value,
      rot: rand(0, Math.PI * 2),
      spin: rand(-0.9, 0.9),
      speedFactor: rand(0.85, 1.2),
      shape: makeAsteroidShape(radius),
      craters: Array.from({ length: 3 }, () => ({
        x: rand(-radius * 0.5, radius * 0.5),
        y: rand(-radius * 0.5, radius * 0.5),
        r: rand(radius * 0.12, radius * 0.24),
      })),
    });
  }

  explode(x, y, colors, count, speed = 220) {
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const v = rand(speed * 0.3, speed);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        life: rand(0.5, 1.1),
        maxLife: 1.1,
        size: rand(2, 5),
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  handleAsteroidHit(asteroid) {
    this.power += asteroid.value;
    this.explode(asteroid.x, asteroid.y, ['#a8a29e', '#d6d3d1', '#fbbf24', '#fde68a'], 16, 160);
    this.floaters.push({ x: asteroid.x, y: asteroid.y, text: `+${asteroid.value}`, life: 1 });
    this.sound.hit?.();

    if (this.power === this.enemyValue) {
      this.enemy.alive = false;
      this.explode(this.enemy.x, this.enemy.y, ['#ff6b35', '#f7931e', '#fdc500', '#ff0000', '#ff4500', '#ffffff'], 70, 280);
      this.score += 20 * this.level;
      this.sound.explosion?.();
      this.sound.win?.();
      this.emitHud();
      this.setState('won');
    } else if (this.power > this.enemyValue) {
      this.loseReason = 'overshoot';
      this.sound.lose?.();
      this.emitHud();
      this.setState('lost');
    } else {
      this.enemy.flash = 0.3;
      this.emitHud();
    }
  }

  update(dt) {
    this.time += dt;
    const playing = this.state === 'playing';

    for (const star of this.stars) {
      star.y += star.speed * dt * (playing ? 1 : 0.35);
      if (star.y > WORLD.height) {
        star.y = -2;
        star.x = rand(0, WORLD.width);
      }
    }

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy = p.vy * 0.98 + 60 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    for (const f of this.floaters) {
      f.y -= 40 * dt;
      f.life -= dt;
    }
    this.floaters = this.floaters.filter((f) => f.life > 0);

    if (!playing) return;

    // Nave del jugador
    const ship = this.ship;
    let direction = 0;
    if (this.input.left) direction -= 1;
    if (this.input.right) direction += 1;
    if (direction === 0 && this.input.targetX !== null) {
      const dx = this.input.targetX - ship.x;
      if (Math.abs(dx) > 3) direction = Math.sign(dx) * Math.min(1, Math.abs(dx) / 30);
    }
    ship.x = clamp(ship.x + direction * SHIP_SPEED * dt, ship.w / 2 + 4, WORLD.width - ship.w / 2 - 4);
    ship.tilt += (direction * 0.18 - ship.tilt) * Math.min(1, dt * 10);
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);

    // Nave enemiga
    const enemy = this.enemy;
    const margin = enemy.w / 2 + 12;
    enemy.x += enemy.dir * enemy.speed * dt;
    if (enemy.x < margin) {
      enemy.x = margin;
      enemy.dir = 1;
    } else if (enemy.x > WORLD.width - margin) {
      enemy.x = WORLD.width - margin;
      enemy.dir = -1;
    }
    enemy.flash = Math.max(0, enemy.flash - dt);

    // Asteroides nuevos
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnAsteroid();
      this.spawnTimer = (this.settings.meteorSpawnRate / 1000) * rand(0.8, 1.2);
    }

    // Movimiento
    for (const bullet of this.bullets) bullet.y -= BULLET_SPEED * dt;
    const fallSpeed = this.settings.meteorSpeed * 120 * (1 + (this.level - 1) * 0.08);
    for (const asteroid of this.asteroids) {
      asteroid.y += asteroid.speedFactor * fallSpeed * dt;
      asteroid.rot += asteroid.spin * dt;
    }

    // Disparos contra asteroides
    for (const asteroid of this.asteroids) {
      if (asteroid.dead) continue;
      for (const bullet of this.bullets) {
        if (bullet.dead) continue;
        if (Math.hypot(asteroid.x - bullet.x, asteroid.y - bullet.y) < asteroid.r + bullet.r) {
          asteroid.dead = true;
          bullet.dead = true;
          this.handleAsteroidHit(asteroid);
          break;
        }
      }
      if (this.state !== 'playing') break;
    }

    // Choque con la nave
    if (this.state === 'playing') {
      for (const asteroid of this.asteroids) {
        if (asteroid.dead) continue;
        if (Math.hypot(asteroid.x - ship.x, asteroid.y - (ship.y + 4)) < asteroid.r + ship.w * 0.36) {
          asteroid.dead = true;
          this.explode(ship.x, ship.y, ['#f97316', '#facc15', '#ef4444', '#ffffff', '#38bdf8'], 50, 240);
          this.loseReason = 'collision';
          this.sound.explosion?.();
          this.sound.lose?.();
          this.setState('lost');
          break;
        }
      }
    }

    this.bullets = this.bullets.filter((b) => !b.dead && b.y > -20);
    this.asteroids = this.asteroids.filter((a) => !a.dead && a.y < WORLD.height + a.r + 10);
  }

  /* ------------------------------ Dibujo ------------------------------ */

  draw() {
    const { ctx, canvas } = this;
    const scale = canvas.width / WORLD.width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    this.drawBackground();
    for (const asteroid of this.asteroids) this.drawAsteroid(asteroid);
    if (this.enemy.alive) this.drawEnemy();
    this.drawBullets();
    if (!(this.state === 'lost' && this.loseReason === 'collision')) this.drawShip();
    this.drawParticles();
    this.drawFloaters();
  }

  drawBackground() {
    const { ctx } = this;
    const gradient = ctx.createLinearGradient(0, 0, 0, WORLD.height);
    gradient.addColorStop(0, '#0b1030');
    gradient.addColorStop(0.55, '#1e1b4b');
    gradient.addColorStop(1, '#05030f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    // Nebulosas suaves
    const nebula = (x, y, r, color) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    nebula(120, 180, 220, 'rgba(139, 92, 246, 0.16)');
    nebula(500, 420, 240, 'rgba(14, 165, 233, 0.12)');

    for (const star of this.stars) {
      const alpha = 0.45 + 0.55 * Math.abs(Math.sin(this.time * 1.5 + star.phase));
      ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawShip() {
    const { ctx, ship, time } = this;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.tilt);

    // Fuego del propulsor
    const flame = 16 + Math.sin(time * 38) * 4 + (this.state === 'playing' ? 6 : 0);
    const fire = ctx.createLinearGradient(0, 22, 0, 22 + flame);
    fire.addColorStop(0, '#fde047');
    fire.addColorStop(0.5, '#fb923c');
    fire.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = fire;
    ctx.beginPath();
    ctx.moveTo(-9, 22);
    ctx.quadraticCurveTo(0, 22 + flame * 1.25, 9, 22);
    ctx.closePath();
    ctx.fill();

    // Aletas
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-11, 4);
    ctx.lineTo(-27, 26);
    ctx.lineTo(-11, 22);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(11, 4);
    ctx.lineTo(27, 26);
    ctx.lineTo(11, 22);
    ctx.closePath();
    ctx.fill();

    // Cuerpo
    const body = ctx.createLinearGradient(-15, 0, 15, 0);
    body.addColorStop(0, '#e2e8f0');
    body.addColorStop(0.5, '#ffffff');
    body.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.bezierCurveTo(16, -22, 16, 6, 12, 24);
    ctx.lineTo(-12, 24);
    ctx.bezierCurveTo(-16, 6, -16, -22, 0, -34);
    ctx.closePath();
    ctx.fill();

    // Punta
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(-20, -40, 40, 18);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-20, 16, 40, 10);
    ctx.restore();

    // Ventana
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, -4, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, -4, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(-2.2, -6.2, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawEnemy() {
    const { ctx, enemy, time } = this;
    const y = enemy.y + Math.sin(time * 2.2) * 4;
    ctx.save();
    ctx.translate(enemy.x, y);

    // Halo
    const halo = ctx.createRadialGradient(0, 4, 10, 0, 4, 80);
    halo.addColorStop(0, 'rgba(167, 139, 250, 0.35)');
    halo.addColorStop(1, 'rgba(167, 139, 250, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(-80, -70, 160, 150);

    // Cúpula con alien
    ctx.fillStyle = 'rgba(103, 232, 249, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, -6, 27, 25, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.ellipse(0, -10, 12, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#052e16';
    ctx.beginPath();
    ctx.ellipse(-4.5, -11, 2.6, 3.6, 0, 0, Math.PI * 2);
    ctx.ellipse(4.5, -11, 2.6, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, -20);
    ctx.lineTo(-9, -28);
    ctx.moveTo(5, -20);
    ctx.lineTo(9, -28);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.ellipse(-12, -18, 5, 8, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // Platillo
    const hull = ctx.createLinearGradient(0, -8, 0, 22);
    hull.addColorStop(0, '#c084fc');
    hull.addColorStop(1, '#6d28d9');
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.ellipse(0, 6, enemy.w / 2, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4c1d95';
    ctx.beginPath();
    ctx.ellipse(0, 12, enemy.w / 2 - 14, 7, 0, 0, Math.PI);
    ctx.fill();

    // Luces
    const colors = ['#facc15', '#22d3ee', '#f472b6'];
    for (let i = 0; i < 7; i += 1) {
      const lx = -42 + i * 14;
      const on = Math.floor(time * 6 + i) % 3;
      ctx.fillStyle = colors[on];
      ctx.beginPath();
      ctx.arc(lx, 7, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (enemy.flash > 0) {
      ctx.globalAlpha = Math.min(0.6, enemy.flash * 2);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(0, 2, enemy.w / 2 + 6, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Insignia de vida
    const label = String(this.enemyValue);
    ctx.font = '700 20px "Fredoka Variable", "Nunito Variable", system-ui, sans-serif';
    const textWidth = ctx.measureText(label).width;
    const badgeW = textWidth + 44;
    roundRect(ctx, -badgeW / 2, 30, badgeW, 30, 15);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fill();
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawHeart(ctx, -badgeW / 2 + 17, 46, 15, '#f43f5e');
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, -badgeW / 2 + 29, 46);
    ctx.restore();
  }

  drawAsteroid(asteroid) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    ctx.save();
    ctx.rotate(asteroid.rot);
    const rock = ctx.createRadialGradient(-asteroid.r * 0.3, -asteroid.r * 0.3, 2, 0, 0, asteroid.r * 1.1);
    rock.addColorStop(0, '#a8a29e');
    rock.addColorStop(1, '#57534e');
    ctx.fillStyle = rock;
    ctx.beginPath();
    asteroid.shape.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(41, 37, 36, 0.45)';
    for (const crater of asteroid.craters) {
      ctx.beginPath();
      ctx.arc(crater.x, crater.y, crater.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.font = '700 22px "Fredoka Variable", "Nunito Variable", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#1c1917';
    ctx.strokeText(String(asteroid.value), 0, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(asteroid.value), 0, 1);
    ctx.restore();
  }

  drawBullets() {
    const { ctx } = this;
    ctx.save();
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 14;
    for (const bullet of this.bullets) {
      const trail = ctx.createLinearGradient(bullet.x, bullet.y, bullet.x, bullet.y + 22);
      trail.addColorStop(0, 'rgba(103, 232, 249, 0.8)');
      trail.addColorStop(1, 'rgba(103, 232, 249, 0)');
      ctx.fillStyle = trail;
      ctx.fillRect(bullet.x - 2.5, bullet.y, 5, 22);
      ctx.fillStyle = '#ecfeff';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawParticles() {
    const { ctx } = this;
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawFloaters() {
    const { ctx } = this;
    ctx.font = '700 24px "Fredoka Variable", "Nunito Variable", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of this.floaters) {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#052e16';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = '#4ade80';
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  /* ------------------------------ Bucle ------------------------------ */

  loop(now) {
    if (!this.lastTime) this.lastTime = now;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  }
}
