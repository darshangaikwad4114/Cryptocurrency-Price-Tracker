import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MARKET_CAP_BUCKETS, SORT_VALUES } from '../utils/market';

const CAP_IDS = new Set(MARKET_CAP_BUCKETS.map((bucket) => bucket.id));
const DEFAULT_SORT = 'market_cap_desc';

export function useMarketFilters() {
  const [params, setParams] = useSearchParams();

  const update = useCallback(
    (changes) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
              next.delete(key);
            } else if (Array.isArray(value)) {
              next.delete(key);
              for (const item of value) next.append(key, item);
            } else {
              next.set(key, value);
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const search = params.get('q') ?? '';
  const sort = SORT_VALUES.has(params.get('sort')) ? params.get('sort') : DEFAULT_SORT;
  const minPrice = params.get('min') ?? '';
  const maxPrice = params.get('max') ?? '';
  const caps = useMemo(() => params.getAll('cap').filter((id) => CAP_IDS.has(id)), [params]);

  const setSearch = useCallback((value) => update({ q: value }), [update]);
  const setSort = useCallback(
    (value) => update({ sort: value === DEFAULT_SORT ? '' : value }),
    [update],
  );
  const setPriceRange = useCallback(
    (min, max) =>
      update({ min: min === '' ? '' : String(min), max: max === '' ? '' : String(max) }),
    [update],
  );
  const toggleCap = useCallback(
    (id) => update({ cap: caps.includes(id) ? caps.filter((cap) => cap !== id) : [...caps, id] }),
    [caps, update],
  );
  const reset = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams]);

  return {
    search,
    sort,
    minPrice,
    maxPrice,
    caps,
    setSearch,
    setSort,
    setPriceRange,
    toggleCap,
    reset,
  };
}
