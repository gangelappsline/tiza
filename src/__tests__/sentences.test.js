import { describe, expect, it } from 'vitest';
import { DEFAULT_SENTENCES } from '../data/sentences';
import { createTokens, isSentenceCorrect, parseSentencesParam, shuffleTokens } from '../lib/sentences';
import { normalizeSentence } from '../lib/utils';

describe('Ordenar Oraciones', () => {
  it('las oraciones por defecto coinciden con sus palabras', () => {
    for (const s of DEFAULT_SENTENCES) expect(isSentenceCorrect(s.words, s.text)).toBe(true);
  });

  it('compara sin importar mayúsculas ni puntuación, pero respeta los acentos', () => {
    expect(isSentenceCorrect(['la', 'mochila', 'está', 'pesada.'], 'La mochila está pesada')).toBe(true);
    expect(isSentenceCorrect(['La', 'mochila', 'esta', 'pesada'], 'La mochila está pesada')).toBe(false);
    expect(normalizeSentence('¡Hola,   mundo!')).toBe('hola mundo');
  });

  it('crea fichas únicas aunque haya palabras repetidas', () => {
    const tokens = createTokens({ words: ['de', 'casa', 'de'] }, 0);
    expect(new Set(tokens.map((t) => t.id)).size).toBe(3);
  });

  it('baraja las fichas sin dejarlas en el orden original', () => {
    const tokens = createTokens(DEFAULT_SENTENCES[4], 4);
    for (let i = 0; i < 50; i += 1) {
      const shuffled = shuffleTokens(tokens);
      expect(shuffled.map((t) => t.order)).not.toEqual(tokens.map((t) => t.order));
    }
  });

  it('lee oraciones desde la URL en varios formatos', () => {
    const parsed = parseSentencesParam(JSON.stringify(['Hola mundo', { text: 'El sol brilla' }]));
    expect(parsed).toHaveLength(2);
    expect(parsed[0].words).toEqual(['Hola', 'mundo']);
    expect(parseSentencesParam('[]')).toBeNull();
  });
});
