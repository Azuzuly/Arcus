const STORAGE_PREFIX = 'arcus_';

const writeTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  clearTimeout(writeTimers[key]);
  writeTimers[key] = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch {
      // storage full — ignore
    }
  }, 300);
}

export function setStorageImmediate(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function removeStorage(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_PREFIX + key);
}

export function clearAllStorage(): void {
  if (typeof window === 'undefined') return;
  const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
  keys.forEach(k => localStorage.removeItem(k));
}

export function getRawStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_PREFIX + key);
}

export function setRawStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_PREFIX + key, value);
}
