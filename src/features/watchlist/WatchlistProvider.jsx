import { useCallback, useEffect, useMemo, useState } from 'react';
import { WatchlistContext } from './watchlistContext';
import { readArray, STORAGE_KEYS, writeStorage } from '../../lib/storage';

const MAX_ITEMS = 200;
const COIN_ID = /^[a-z0-9][a-z0-9-]{0,79}$/;

function normalize(value) {
  if (!Array.isArray(value)) return [];
  const unique = new Set();
  for (const item of value) {
    if (typeof item === 'string' && COIN_ID.test(item)) unique.add(item);
    if (unique.size >= MAX_ITEMS) break;
  }
  return [...unique];
}

export function WatchlistProvider({ children }) {
  const [ids, setIds] = useState(() => normalize(readArray(STORAGE_KEYS.watchlist)));

  useEffect(() => {
    writeStorage(STORAGE_KEYS.watchlist, ids);
  }, [ids]);

  const idSet = useMemo(() => new Set(ids), [ids]);

  const isWatched = useCallback((coinId) => idSet.has(coinId), [idSet]);

  const toggle = useCallback((coinId) => {
    if (typeof coinId !== 'string' || !COIN_ID.test(coinId)) return;
    setIds((current) =>
      current.includes(coinId)
        ? current.filter((id) => id !== coinId)
        : [coinId, ...current].slice(0, MAX_ITEMS),
    );
  }, []);

  const remove = useCallback((coinId) => {
    setIds((current) => current.filter((id) => id !== coinId));
  }, []);

  const value = useMemo(
    () => ({ ids, count: ids.length, isWatched, toggle, remove }),
    [ids, isWatched, toggle, remove],
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}
