export const STORAGE_KEYS = {
  theme: 'cryptotracker.theme',
  watchlist: 'cryptotracker.watchlist.v1',
  portfolio: 'cryptotracker.portfolio.v1',
  alerts: 'cryptotracker.alerts.v1',
  viewMode: 'cryptotracker.viewMode',
};

export function readStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function readArray(key) {
  const value = readStorage(key, []);
  return Array.isArray(value) ? value : [];
}

export function uid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
