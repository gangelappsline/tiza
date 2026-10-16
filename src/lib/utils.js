/** Une clases condicionalmente: cn('a', cond && 'b') → 'a b'. */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/** Copia barajada de un arreglo (Fisher–Yates). */
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Entero aleatorio entre min y max (ambos incluidos). */
export function randomInt(min, max, random = Math.random) {
  return Math.floor(random() * (max - min + 1)) + min;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** 75 → "1:15" */
export function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Texto en minúsculas y sin acentos (para búsquedas). */
export function normalizeText(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Normaliza una oración para compararla: minúsculas, sin signos de puntuación
 * y con espacios simples. Los acentos se conservan (en español importan).
 */
export function normalizeSentence(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[.,;:!¡?¿"“”«»()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function percentage(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function scoreEmoji(percent) {
  if (percent >= 90) return '🏆';
  if (percent >= 70) return '🌟';
  if (percent >= 50) return '👍';
  return '💪';
}

export function scoreMessage(percent) {
  if (percent === 100) return '¡Perfecto! No fallaste ni una vez.';
  if (percent >= 90) return '¡Excelente trabajo! Eres una estrella.';
  if (percent >= 70) return '¡Muy bien! Vas por buen camino.';
  if (percent >= 50) return '¡Bien hecho! Con un poco más de práctica lo dominarás.';
  return '¡No te rindas! Cada intento te hace más fuerte.';
}

/** Lee un parámetro JSON de la URL de forma segura. */
export function parseJsonParam(raw) {
  if (!raw) return null;
  const attempts = [raw];
  try {
    attempts.push(decodeURIComponent(raw));
  } catch {
    /* el valor ya venía decodificado */
  }
  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch {
      /* probar el siguiente formato */
    }
  }
  return null;
}
