/** Lluvia de confeti ligera (sin dependencias). */
const COLORS = ['#10b981', '#38bdf8', '#facc15', '#fb923c', '#f472b6', '#a78bfa', '#ef4444'];

export function launchConfetti({ particleCount = 150, duration = 2600 } = {}) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '9999',
  });
  document.body.appendChild(canvas);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const particles = Array.from({ length: particleCount }, (_, i) => {
    const fromLeft = i % 2 === 0;
    return {
      x: fromLeft ? width * 0.15 : width * 0.85,
      y: height * 0.75,
      vx: (fromLeft ? 1 : -1) * (Math.random() * 9 + 3),
      vy: -(Math.random() * 15 + 9),
      size: Math.random() * 8 + 6,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.35,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      round: Math.random() > 0.6,
    };
  });

  const start = performance.now();
  let last = start;

  function frame(now) {
    const dt = Math.min(40, now - last) / 16.67;
    last = now;
    const elapsed = now - start;
    const alpha = elapsed > duration - 600 ? Math.max(0, (duration - elapsed) / 600) : 1;
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.vy += 0.38 * dt;
      p.vx *= 0.985;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.spin * dt;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctx.restore();
    }
    if (elapsed < duration) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}
