import { PETS } from './drawPet';

export const XP_PER_LEVEL = 100;
export const XP_PER_ANSWER = 10;
export const FULL_NEEDS = { hunger: 100, happiness: 100, energy: 100 };

const randInt = (min, max, random) => Math.floor(random() * (max - min + 1)) + min;
const clamp = (v) => Math.min(100, Math.max(0, v));

export function levelFromXp(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

/**
 * Pregunta de entrenamiento. La dificultad crece con el nivel de la mascota
 * y las restas nunca dan resultados negativos.
 */
export function createPetQuestion(level = 1, random = Math.random) {
  const ops = level >= 6 ? ['+', '-', '×'] : ['+', '-'];
  const op = ops[Math.floor(random() * ops.length)];
  const max = level < 3 ? 9 : level < 6 ? 20 : level < 10 ? 30 : 50;
  if (op === '×') {
    const a = randInt(1, level < 10 ? 5 : 10, random);
    const b = randInt(1, 10, random);
    return { text: `${a} × ${b}`, answer: a * b };
  }
  let a = randInt(0, max, random);
  let b = randInt(0, max, random);
  if (op === '-') {
    if (a < b) [a, b] = [b, a];
    return { text: `${a} − ${b}`, answer: a - b };
  }
  return { text: `${a} + ${b}`, answer: a + b };
}

/** Desgaste mientras la página está abierta (cada 5 s, como el original). */
export function tickNeeds(needs) {
  return {
    hunger: clamp(needs.hunger - 0.5),
    happiness: clamp(needs.happiness - 0.3),
    energy: clamp(needs.energy - 0.2),
  };
}

/** Desgaste suave mientras no se juega (la mascota descansa y recupera energía). */
export function applyOfflineDecay(needs, minutesAway) {
  if (!(minutesAway > 1)) return needs;
  const minutes = Math.min(minutesAway, 60 * 24 * 7);
  return {
    hunger: Math.max(Math.min(needs.hunger, 15), clamp(needs.hunger - minutes * 0.5)),
    happiness: Math.max(Math.min(needs.happiness, 15), clamp(needs.happiness - minutes * 0.3)),
    energy: clamp(needs.energy + minutes * 1),
  };
}

/** Valida el perfil guardado (compatible con el formato del sitio original). */
export function normalizeProfile(raw, now = Date.now()) {
  if (!raw || typeof raw !== 'object' || !raw.pet) return null;
  const base = PETS.find((p) => p.id === raw.pet.id);
  if (!base) return null;
  const xp = Math.max(0, Number(raw.xp) || 0);
  const needs = {
    hunger: clamp(Number(raw.needs?.hunger ?? 100)),
    happiness: clamp(Number(raw.needs?.happiness ?? 100)),
    energy: clamp(Number(raw.needs?.energy ?? 100)),
  };
  const minutesAway = raw.lastUpdated ? (now - Number(raw.lastUpdated)) / 60000 : 0;
  return {
    pet: { ...base },
    petName: typeof raw.petName === 'string' && raw.petName.trim() ? raw.petName.trim().slice(0, 20) : base.name,
    xp,
    level: levelFromXp(xp),
    practices: Math.max(0, Number(raw.practices) || 0),
    createdAt: Number(raw.createdAt) || now,
    needs: applyOfflineDecay(needs, minutesAway),
  };
}

export function createProfile(petId, petName, now = Date.now()) {
  const base = PETS.find((p) => p.id === petId) ?? PETS[0];
  return {
    pet: { ...base },
    petName: petName?.trim().slice(0, 20) || base.name,
    xp: 0,
    level: 1,
    practices: 0,
    createdAt: now,
    needs: { ...FULL_NEEDS },
  };
}
