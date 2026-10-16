import { isSoundEnabled } from './preferences';

/**
 * Efectos de sonido sintetizados con Web Audio API: no requieren archivos
 * de audio y funcionan sin conexión.
 */
let audioContext = null;

function getContext() {
  if (typeof window === 'undefined' || !isSoundEnabled()) return null;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioContext) audioContext = new AudioCtor();
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  return audioContext;
}

function tone({ freq = 440, endFreq, duration = 0.15, type = 'sine', volume = 0.15, delay = 0 }) {
  const ctx = getContext();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, start);
  if (endFreq) oscillator.frequency.exponentialRampToValueAtTime(endFreq, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

function noise({ duration = 0.5, volume = 0.3, delay = 0, frequency = 900 }) {
  const ctx = getContext();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(frequency, start);
  filter.frequency.exponentialRampToValueAtTime(80, start + duration);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(start);
}

export const sfx = {
  click: () => tone({ freq: 600, duration: 0.05, type: 'triangle', volume: 0.08 }),
  flip: () => tone({ freq: 520, endFreq: 780, duration: 0.09, type: 'sine', volume: 0.1 }),
  correct: () => {
    tone({ freq: 660, duration: 0.12, type: 'triangle' });
    tone({ freq: 990, duration: 0.18, type: 'triangle', delay: 0.1 });
  },
  wrong: () => tone({ freq: 240, endFreq: 150, duration: 0.28, type: 'sawtooth', volume: 0.08 }),
  match: () => {
    tone({ freq: 784, duration: 0.1, type: 'triangle' });
    tone({ freq: 1047, duration: 0.2, type: 'triangle', delay: 0.09 });
  },
  win: () => {
    [523, 659, 784, 1047].forEach((freq, i) =>
      tone({ freq, duration: 0.22, type: 'triangle', volume: 0.14, delay: i * 0.12 }),
    );
  },
  levelUp: () => {
    [440, 554, 659, 880].forEach((freq, i) => tone({ freq, duration: 0.16, type: 'square', volume: 0.06, delay: i * 0.08 }));
  },
  lose: () => {
    [392, 330, 262].forEach((freq, i) => tone({ freq, duration: 0.25, type: 'triangle', volume: 0.12, delay: i * 0.18 }));
  },
  laser: () => tone({ freq: 1400, endFreq: 260, duration: 0.16, type: 'square', volume: 0.05 }),
  hit: () => {
    tone({ freq: 300, endFreq: 120, duration: 0.12, type: 'square', volume: 0.07 });
    noise({ duration: 0.15, volume: 0.12, frequency: 2000 });
  },
  explosion: () => noise({ duration: 0.8, volume: 0.35, frequency: 1200 }),
  pop: () => tone({ freq: 880, endFreq: 1320, duration: 0.07, type: 'sine', volume: 0.1 }),
  eat: () => {
    tone({ freq: 300, duration: 0.06, type: 'square', volume: 0.05 });
    tone({ freq: 360, duration: 0.06, type: 'square', volume: 0.05, delay: 0.12 });
    tone({ freq: 300, duration: 0.06, type: 'square', volume: 0.05, delay: 0.24 });
  },
  sleep: () => tone({ freq: 392, endFreq: 196, duration: 0.6, type: 'sine', volume: 0.08 }),
};
