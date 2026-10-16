import { describe, expect, it } from 'vitest';
import { ACTIVITIES } from '../data/activities';
import { countByCategory, filterActivities, sortActivities } from '../lib/catalog';
import { formatTime, percentage } from '../lib/utils';

describe('Biblioteca de actividades', () => {
  it('busca sin distinguir acentos ni mayúsculas', () => {
    const results = filterActivities(ACTIVITIES, { query: 'MATEMATICAS' });
    expect(results.some((a) => a.id === 'matematicas-practica')).toBe(true);
  });

  it('filtra por categoría', () => {
    const results = filterActivities(ACTIVITIES, { category: 'science' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((a) => a.category === 'science')).toBe(true);
  });

  it('muestra primero las actividades jugables en «Destacadas»', () => {
    const sorted = sortActivities(ACTIVITIES, 'featured');
    const firstLocked = sorted.findIndex((a) => !a.link);
    expect(sorted.slice(firstLocked).every((a) => !a.link)).toBe(true);
  });

  it('ordena por fecha en «Más Recientes»', () => {
    const sorted = sortActivities(ACTIVITIES, 'newest');
    for (let i = 1; i < sorted.length; i += 1) expect(sorted[i - 1].addedAt >= sorted[i].addedAt).toBe(true);
  });

  it('cuenta los resultados por categoría', () => {
    const counts = countByCategory(ACTIVITIES);
    expect(counts.all).toBe(ACTIVITIES.length);
    expect(counts.art).toBe(0);
  });

  it('cada actividad tiene un id único', () => {
    expect(new Set(ACTIVITIES.map((a) => a.id)).size).toBe(ACTIVITIES.length);
  });
});

describe('utilidades', () => {
  it('formatea el tiempo', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(75)).toBe('1:15');
  });

  it('calcula porcentajes', () => {
    expect(percentage(7, 10)).toBe(70);
    expect(percentage(1, 0)).toBe(0);
  });
});
