const DEFAULT_MAX_ENTRIES = 300;

export function createCache({ maxEntries = DEFAULT_MAX_ENTRIES, now = Date.now } = {}) {
  const entries = new Map();
  const inFlight = new Map();

  function prune() {
    while (entries.size > maxEntries) {
      const oldestKey = entries.keys().next().value;
      entries.delete(oldestKey);
    }
  }

  function read(key) {
    const entry = entries.get(key);
    if (!entry) return null;
    if (now() > entry.staleUntil) {
      entries.delete(key);
      return null;
    }
    return entry;
  }

  function set(key, value, { ttlMs, staleMs }) {
    const timestamp = now();
    entries.delete(key);
    entries.set(key, {
      value,
      cachedAt: timestamp,
      freshUntil: timestamp + ttlMs,
      staleUntil: timestamp + ttlMs + staleMs,
    });
    prune();
  }

  async function wrap(key, { ttlMs, staleMs }, producer) {
    const entry = read(key);
    if (entry && now() <= entry.freshUntil) {
      return { value: entry.value, cachedAt: entry.cachedAt, stale: false, cached: true };
    }

    if (inFlight.has(key)) {
      return inFlight.get(key);
    }

    const promise = (async () => {
      try {
        const value = await producer();
        set(key, value, { ttlMs, staleMs });
        return { value, cachedAt: now(), stale: false, cached: false };
      } catch (error) {
        if (entry) {
          return { value: entry.value, cachedAt: entry.cachedAt, stale: true, cached: true, error };
        }
        throw error;
      }
    })().finally(() => {
      inFlight.delete(key);
    });

    inFlight.set(key, promise);
    return promise;
  }

  function clear() {
    entries.clear();
    inFlight.clear();
  }

  return {
    read,
    set,
    wrap,
    clear,
    get size() {
      return entries.size;
    },
  };
}
