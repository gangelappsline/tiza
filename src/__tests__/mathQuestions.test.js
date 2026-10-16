import { describe, expect, it } from 'vitest';
import {
  createQuestion,
  createQuestionSet,
  LEVELS,
  normalizeLevel,
  OPERATION_IDS,
  parseOperations,
  parseQuestionsParam,
} from '../lib/mathQuestions';

const solve = (q) =>
  ({
    suma: q.num1 + q.num2,
    resta: q.num1 - q.num2,
    multiplicacion: q.num1 * q.num2,
    division: q.num1 / q.num2,
  })[q.operation];

describe('createQuestion', () => {
  it('genera respuestas correctas, enteras y no negativas en todas las operaciones y niveles', () => {
    for (const level of Object.keys(LEVELS)) {
      for (const op of OPERATION_IDS) {
        for (let i = 0; i < 200; i += 1) {
          const q = createQuestion(op, level);
          expect(q.answer).toBe(solve(q));
          expect(Number.isInteger(q.answer)).toBe(true);
          expect(q.answer).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('respeta el rango del nivel en las sumas', () => {
    for (let i = 0; i < 200; i += 1) {
      const q = createQuestion('suma', 'medio');
      for (const n of [q.num1, q.num2]) {
        expect(n).toBeGreaterThanOrEqual(11);
        expect(n).toBeLessThanOrEqual(50);
      }
    }
  });

  it('crea la cantidad pedida de preguntas con las operaciones elegidas', () => {
    const set = createQuestionSet({ operations: ['multiplicacion', 'division'], level: 'facil', count: 30 });
    expect(set).toHaveLength(30);
    expect(set.every((q) => ['multiplicacion', 'division'].includes(q.operation))).toBe(true);
  });
});

describe('parámetros de la URL', () => {
  it('normaliza niveles en español e inglés', () => {
    expect(normalizeLevel('medium')).toBe('medio');
    expect(normalizeLevel('Difícil')).toBe('dificil');
    expect(normalizeLevel('easy')).toBe('facil');
    expect(normalizeLevel('nada')).toBeNull();
  });

  it('lee la lista de operaciones', () => {
    expect(parseOperations('suma,multiplicacion,xyz')).toEqual(['suma', 'multiplicacion']);
    expect(parseOperations('')).toBeNull();
  });

  it('lee preguntas enviadas por un maestro (codificadas o no)', () => {
    const questions = [
      { num1: 6, num2: 7, operation: 'multiplicacion', symbol: '×', answer: 42 },
      { num1: 9, num2: 3, symbol: '-' },
    ];
    const parsed = parseQuestionsParam(encodeURIComponent(JSON.stringify(questions)));
    expect(parsed).toHaveLength(2);
    expect(parsed[0].answer).toBe(42);
    expect(parsed[1]).toMatchObject({ operation: 'resta', answer: 6 });
    expect(parseQuestionsParam(JSON.stringify(questions))).toHaveLength(2);
    expect(parseQuestionsParam('no-es-json')).toBeNull();
  });
});
