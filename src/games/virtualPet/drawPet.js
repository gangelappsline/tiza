/** Dibujo de la mascota virtual en un lienzo lógico de 400×400. */

export const PETS = [
  { id: 'perro', name: 'Perro', emoji: '🐶', color: '#B8733A' },
  { id: 'gato', name: 'Gato', emoji: '🐱', color: '#FF8C00' },
  { id: 'loro', name: 'Loro', emoji: '🦜', color: '#00CED1' },
  { id: 'conejo', name: 'Conejo', emoji: '🐰', color: '#DDA0DD' },
];

export const MOODS = {
  IDLE: 'idle',
  HAPPY: 'happy',
  SAD: 'sad',
  EATING: 'eating',
  EXCITED: 'excited',
  SLEEPING: 'sleeping',
  THINKING: 'thinking',
};

export const MOOD_LABELS = {
  idle: '🙂 Tranquila',
  happy: '😊 Feliz',
  sad: '😢 Triste',
  eating: '😋 Comiendo',
  excited: '🤩 ¡Emocionada!',
  sleeping: '😴 Durmiendo',
  thinking: '🤔 Pensando',
};

/** Etapa según el nivel (igual que el original). */
export function stageForLevel(level) {
  if (level < 3) return { name: 'Bebé', scale: 0.8 };
  if (level < 6) return { name: 'Joven', scale: 0.88 };
  if (level < 10) return { name: 'Adulto', scale: 0.96 };
  return { name: 'Maestro', scale: 1 };
}

function shade(hex, amount) {
  const value = hex.replace('#', '');
  const num = Number.parseInt(value.length === 3 ? value.replace(/./g, '$&$&') : value, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function ellipse(ctx, x, y, rx, ry, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fill();
}

function drawEars(ctx, petId, color) {
  const dark = shade(color, -35);
  if (petId === 'perro') {
    ctx.fillStyle = dark;
    ellipse(ctx, -64, -38, 24, 44, -0.45);
    ellipse(ctx, 64, -38, 24, 44, 0.45);
  } else if (petId === 'gato') {
    for (const side of [-1, 1]) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(side * 66, -62);
      ctx.lineTo(side * 54, -128);
      ctx.lineTo(side * 16, -94);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffc9d6';
      ctx.beginPath();
      ctx.moveTo(side * 56, -76);
      ctx.lineTo(side * 50, -112);
      ctx.lineTo(side * 28, -94);
      ctx.closePath();
      ctx.fill();
    }
  } else if (petId === 'conejo') {
    for (const side of [-1, 1]) {
      ctx.fillStyle = color;
      ellipse(ctx, side * 30, -132, 17, 58, side * 0.25);
      ctx.fillStyle = '#ffc9d6';
      ellipse(ctx, side * 30, -128, 8, 42, side * 0.25);
    }
  } else if (petId === 'loro') {
    const feathers = ['#facc15', '#ef4444', '#22c55e'];
    feathers.forEach((featherColor, i) => {
      ctx.fillStyle = featherColor;
      ellipse(ctx, -14 + i * 14, -112 + Math.abs(i - 1) * 6, 9, 26, (i - 1) * 0.35);
    });
  }
}

function drawEyes(ctx, mood, eyesOpen) {
  const closed = !eyesOpen || mood === MOODS.SLEEPING;
  ctx.lineCap = 'round';
  if (closed) {
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 4;
    for (const x of [-26, 26]) {
      ctx.beginPath();
      ctx.arc(x, -12, 13, 0.15, Math.PI - 0.15);
      ctx.stroke();
    }
    return;
  }
  if (mood === MOODS.EXCITED) {
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 5;
    for (const x of [-26, 26]) {
      ctx.beginPath();
      ctx.arc(x, -6, 13, Math.PI + 0.25, -0.25);
      ctx.stroke();
    }
    return;
  }
  const lookY = mood === MOODS.THINKING ? -6 : mood === MOODS.HAPPY ? -4 : mood === MOODS.SAD ? 4 : 0;
  const lookX = mood === MOODS.THINKING ? 4 : 0;
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, -26, -12, 18, 19);
  ellipse(ctx, 26, -12, 18, 19);
  ctx.fillStyle = '#111827';
  ellipse(ctx, -26 + lookX, -12 + lookY, 9, 10);
  ellipse(ctx, 26 + lookX, -12 + lookY, 9, 10);
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, -22 + lookX, -16 + lookY, 3.6, 3.6);
  ellipse(ctx, 30 + lookX, -16 + lookY, 3.6, 3.6);
  if (mood === MOODS.SAD) {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.beginPath();
    ctx.moveTo(-36, 6);
    ctx.quadraticCurveTo(-44, 20, -36, 24);
    ctx.quadraticCurveTo(-28, 20, -36, 6);
    ctx.fill();
  }
}

function drawMouth(ctx, petId, mood) {
  if (petId === 'loro') {
    const open = mood === MOODS.EATING || mood === MOODS.HAPPY || mood === MOODS.EXCITED;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-14, 8);
    ctx.quadraticCurveTo(0, 2, 14, 8);
    ctx.quadraticCurveTo(6, 30, 0, 34);
    ctx.quadraticCurveTo(-6, 30, -14, 8);
    ctx.fill();
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.moveTo(-10, open ? 24 : 20);
    ctx.quadraticCurveTo(0, open ? 34 : 26, 10, open ? 24 : 20);
    ctx.quadraticCurveTo(0, 40, -10, open ? 24 : 20);
    ctx.fill();
    return;
  }

  if (petId === 'perro') {
    ctx.fillStyle = '#1f2937';
    ellipse(ctx, 0, 8, 10, 7);
  } else {
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(-6, 6);
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 13);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mood === MOODS.HAPPY || mood === MOODS.EXCITED) {
    ctx.arc(0, 14, 22, 0.25, Math.PI - 0.25);
    ctx.stroke();
    if (petId === 'perro') {
      ctx.fillStyle = '#fb7185';
      ellipse(ctx, 0, 40, 8, 10);
    }
  } else if (mood === MOODS.SAD) {
    ctx.arc(0, 42, 18, Math.PI + 0.45, Math.PI * 2 - 0.45);
    ctx.stroke();
  } else if (mood === MOODS.EATING) {
    ctx.fillStyle = '#7f1d1d';
    ellipse(ctx, 0, 30, 13, 11);
  } else if (mood === MOODS.SLEEPING) {
    ctx.fillStyle = '#7f1d1d';
    ellipse(ctx, 0, 28, 5, 6);
  } else if (mood === MOODS.THINKING) {
    ctx.moveTo(-10, 30);
    ctx.lineTo(12, 26);
    ctx.stroke();
  } else {
    ctx.arc(0, 18, 15, 0.35, Math.PI - 0.35);
    ctx.stroke();
  }

  if (petId === 'conejo' && mood !== MOODS.SAD) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-7, 18, 6.5, 9);
    ctx.strokeRect(-7, 18, 6.5, 9);
    ctx.fillRect(0.5, 18, 6.5, 9);
    ctx.strokeRect(0.5, 18, 6.5, 9);
  }

  if (petId === 'gato') {
    ctx.strokeStyle = 'rgba(31, 41, 55, 0.6)';
    ctx.lineWidth = 2;
    for (const side of [-1, 1]) {
      for (const dy of [-4, 4]) {
        ctx.beginPath();
        ctx.moveTo(side * 22, 12 + dy);
        ctx.lineTo(side * 58, 6 + dy * 2.2);
        ctx.stroke();
      }
    }
  }
}

function drawGraduationCap(ctx) {
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(0, -128);
  ctx.lineTo(62, -108);
  ctx.lineTo(0, -88);
  ctx.lineTo(-62, -108);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-30, -102, 60, 18);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -108);
  ctx.lineTo(48, -100);
  ctx.lineTo(48, -76);
  ctx.stroke();
  ctx.fillStyle = '#facc15';
  ellipse(ctx, 48, -72, 5, 7);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ petId: string, color: string, mood: string, eyesOpen: boolean, offsetY: number, scale: number, stage: string }} state
 */
export function drawPet(ctx, { petId, color, mood, eyesOpen, offsetY, scale, stage }) {
  // Sombra en el piso
  const lift = Math.max(0, -offsetY);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
  ellipse(ctx, 200, 322, 62 * scale - lift * 0.6, 13 * scale);

  ctx.save();
  ctx.translate(200, 212 + offsetY);
  ctx.scale(scale, scale);

  if (petId === 'conejo' || petId === 'loro') drawEars(ctx, petId, color);

  // Alas del loro
  if (petId === 'loro') {
    ctx.fillStyle = shade(color, -40);
    ellipse(ctx, -76, 18, 22, 46, 0.35);
    ellipse(ctx, 76, 18, 22, 46, -0.35);
  }

  // Patitas
  ctx.fillStyle = shade(color, -30);
  ellipse(ctx, -36, 94, 22, 13);
  ellipse(ctx, 36, 94, 22, 13);

  // Cuerpo
  ctx.fillStyle = color;
  ellipse(ctx, 0, 0, 80, 100);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ellipse(ctx, 0, 40, 50, 50);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ellipse(ctx, -24, -40, 20, 28, 0.35);

  if (petId === 'gato' || petId === 'perro') drawEars(ctx, petId, color);

  // Mejillas
  if (mood === MOODS.HAPPY || mood === MOODS.EXCITED || mood === MOODS.EATING) {
    ctx.fillStyle = 'rgba(251, 113, 133, 0.45)';
    ellipse(ctx, -50, 14, 12, 9);
    ellipse(ctx, 50, 14, 12, 9);
  }

  drawEyes(ctx, mood, eyesOpen);
  drawMouth(ctx, petId, mood);
  if (stage === 'Maestro') drawGraduationCap(ctx);

  ctx.restore();
}
