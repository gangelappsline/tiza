import { normalizeSentence, parseJsonParam, shuffle } from './utils';

/** Separa una oración en palabras (respetando la puntuación pegada a cada palabra). */
export function splitWords(text) {
  return String(text ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Normaliza la lista de oraciones recibida (de la URL o de los datos por defecto).
 * Acepta strings o objetos { text, words }.
 */
export function normalizeSentences(list) {
  if (!Array.isArray(list)) return null;
  const sentences = list
    .map((item, index) => {
      const text = typeof item === 'string' ? item : item?.text;
      if (!text || typeof text !== 'string') return null;
      const words = Array.isArray(item?.words) && item.words.length ? item.words.map(String) : splitWords(text);
      if (words.length === 0) return null;
      return { id: item?.id ?? index + 1, text: text.trim(), words };
    })
    .filter(Boolean);
  return sentences.length ? sentences : null;
}

/** Lee ?sentences=[...] u ?oraciones=[...] de la URL. */
export function parseSentencesParam(raw) {
  return normalizeSentences(parseJsonParam(raw));
}

/** Convierte las palabras en fichas con id único (permite palabras repetidas). */
export function createTokens(sentence, sentenceIndex) {
  return sentence.words.map((text, index) => ({ id: `s${sentenceIndex}-w${index}`, text, order: index }));
}

/** Baraja las fichas procurando que no queden en el orden correcto. */
export function shuffleTokens(tokens, random = Math.random) {
  if (tokens.length < 2) return [...tokens];
  let result = shuffle(tokens, random);
  for (let tries = 0; tries < 10 && result.every((token, i) => token.order === i); tries += 1) {
    result = shuffle(tokens, random);
  }
  return result;
}

export function isSentenceCorrect(words, expectedText) {
  return normalizeSentence(words.join(' ')) === normalizeSentence(expectedText);
}
