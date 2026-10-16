import { describe, expect, it } from 'vitest';
import { applyOfflineDecay, createPetQuestion, levelFromXp, normalizeProfile } from '../games/virtualPet/petLogic';

describe('Mascota virtual', () => {
  it('nunca genera restas con resultado negativo', () => {
    for (let level = 1; level <= 12; level += 1) {
      for (let i = 0; i < 200; i += 1) expect(createPetQuestion(level).answer).toBeGreaterThanOrEqual(0);
    }
  });

  it('calcula el nivel con 100 XP por nivel', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(250)).toBe(3);
  });

  it('carga los perfiles guardados por el sitio original', () => {
    const original = {
      pet: { id: 'gato', name: 'Gato', emoji: '🐱', color: '#FF8C00' },
      xp: 130,
      level: 2,
      practices: 13,
      createdAt: 1,
      needs: { hunger: 80, happiness: 60, energy: 40 },
    };
    expect(normalizeProfile(original)).toMatchObject({ petName: 'Gato', level: 2, practices: 13 });
    expect(normalizeProfile({ pet: { id: 'dragon' } })).toBeNull();
  });

  it('el desgaste sin jugar es suave y la mascota recupera energía', () => {
    const needs = applyOfflineDecay({ hunger: 90, happiness: 90, energy: 10 }, 60 * 24);
    expect(needs.hunger).toBeGreaterThanOrEqual(15);
    expect(needs.happiness).toBeGreaterThanOrEqual(15);
    expect(needs.energy).toBe(100);
  });
});
