import { useSyncExternalStore } from 'react';
import { STORAGE_KEYS } from '../config';
import { readString, writeString } from './storage';

/**
 * Preferencias simples (sonido y voz) compartidas por toda la app y
 * guardadas en localStorage.
 */
const listeners = new Set();
const cache = new Map();

function read(key, fallback) {
  if (!cache.has(key)) {
    const stored = typeof window === 'undefined' ? null : readString(key);
    cache.set(key, stored === null ? fallback : stored === 'true');
  }
  return cache.get(key);
}

function write(key, value) {
  cache.set(key, value);
  writeString(key, String(value));
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isSoundEnabled() {
  return read(STORAGE_KEYS.sound, true);
}

export function isVoiceEnabled() {
  return read(STORAGE_KEYS.voice, true);
}

function usePreference(key, fallback) {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback,
  );
  return [value, (next) => write(key, typeof next === 'function' ? next(read(key, fallback)) : next)];
}

export function useSoundEnabled() {
  return usePreference(STORAGE_KEYS.sound, true);
}

export function useVoiceEnabled() {
  return usePreference(STORAGE_KEYS.voice, true);
}
