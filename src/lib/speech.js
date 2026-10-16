import { isVoiceEnabled } from './preferences';

/** Lectura en voz alta con la voz en español disponible en el navegador. */

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

let cachedVoice = null;

function pickSpanishVoice() {
  if (!speechSupported) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => /^es[-_]MX/i.test(v.lang)) ||
    voices.find((v) => /^es[-_](US|419)/i.test(v.lang)) ||
    voices.find((v) => /^es/i.test(v.lang)) ||
    null
  );
}

if (speechSupported) {
  cachedVoice = pickSpanishVoice();
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoice = pickSpanishVoice();
  });
}

/**
 * Lee un texto en voz alta. Respeta la preferencia de voz del usuario
 * salvo que se indique `force: true`.
 */
export function speak(text, { rate = 0.9, pitch = 1.1, force = false } = {}) {
  if (!speechSupported || !text) return;
  if (!force && !isVoiceEnabled()) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = cachedVoice?.lang || 'es-MX';
    utterance.rate = rate;
    utterance.pitch = pitch;
    if (cachedVoice) utterance.voice = cachedVoice;
    window.speechSynthesis.speak(utterance);
  } catch {
    /* algunos navegadores bloquean la voz: se ignora */
  }
}

export function stopSpeaking() {
  if (speechSupported) window.speechSynthesis.cancel();
}
