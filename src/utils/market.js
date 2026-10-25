export const MARKET_CAP_BUCKETS = [
  { id: 'large', label: 'Large cap', hint: 'Over $10B', min: 10_000_000_000, max: Infinity },
  {
    id: 'mid',
    label: 'Mid cap',
    hint: '$1B – $10B',
    min: 1_000_000_000,
    max: 10_000_000_000,
  },
  { id: 'small', label: 'Small cap', hint: 'Under $1B', min: 0, max: 1_000_000_000 },
];

export const SORT_OPTIONS = [
  { value: 'market_cap_desc', label: 'Market cap: high to low' },
  { value: 'market_cap_asc', label: 'Market cap: low to high' },
  { value: 'volume_desc', label: '24h volume: high to low' },
  { value: 'volume_asc', label: '24h volume: low to high' },
  { value: 'change_desc', label: '24h change: high to low' },
  { value: 'change_asc', label: '24h change: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'name_asc', label: 'Name: A to Z' },
  { value: 'name_desc', label: 'Name: Z to A' },
];

export const SORT_VALUES = new Set(SORT_OPTIONS.map((option) => option.value));

const SORT_ACCESSORS = {
  market_cap_desc: (coin) => coin.marketCap,
  market_cap_asc: (coin) => coin.marketCap,
  volume_desc: (coin) => coin.volume24h,
  volume_asc: (coin) => coin.volume24h,
  change_desc: (coin) => coin.change24h,
  change_asc: (coin) => coin.change24h,
  price_desc: (coin) => coin.price,
  price_asc: (coin) => coin.price,
  name_asc: (coin) => coin.name,
  name_desc: (coin) => coin.name,
};

export function sortCoins(coins, sortKey) {
  const accessor = SORT_ACCESSORS[sortKey] ?? SORT_ACCESSORS.market_cap_desc;
  const descending = sortKey.endsWith('_desc');
  const sorted = [...coins];

  sorted.sort((a, b) => {
    const left = accessor(a);
    const right = accessor(b);
    if (typeof left === 'string' || typeof right === 'string') {
      const comparison = String(left ?? '').localeCompare(String(right ?? ''));
      return descending ? -comparison : comparison;
    }
    const leftMissing = !Number.isFinite(left);
    const rightMissing = !Number.isFinite(right);
    if (leftMissing && rightMissing) return 0;
    if (leftMissing) return 1;
    if (rightMissing) return -1;
    return descending ? right - left : left - right;
  });

  return sorted;
}

export function filterCoins(coins, { search = '', minPrice = '', maxPrice = '', caps = [] } = {}) {
  const query = search.trim().toLowerCase();
  const minimum = minPrice === '' ? null : Number(minPrice);
  const maximum = maxPrice === '' ? null : Number(maxPrice);

  return coins.filter((coin) => {
    if (
      query &&
      !coin.name.toLowerCase().includes(query) &&
      !coin.symbol.toLowerCase().includes(query)
    ) {
      return false;
    }
    if (minimum !== null && Number.isFinite(minimum) && !(coin.price >= minimum)) return false;
    if (maximum !== null && Number.isFinite(maximum) && !(coin.price <= maximum)) return false;
    if (caps.length > 0) {
      const matchesCap = caps.some((capId) => {
        const bucket = MARKET_CAP_BUCKETS.find((entry) => entry.id === capId);
        return (
          bucket &&
          Number.isFinite(coin.marketCap) &&
          coin.marketCap >= bucket.min &&
          coin.marketCap < bucket.max
        );
      });
      if (!matchesCap) return false;
    }
    return true;
  });
}

export function activeFilterCount({ search, minPrice, maxPrice, caps }) {
  let count = 0;
  if (search.trim()) count += 1;
  if (minPrice !== '' || maxPrice !== '') count += 1;
  if (caps.length > 0) count += 1;
  return count;
}

export function getTopMovers(coins, limit = 4) {
  const candidates = coins.filter((coin) => Number.isFinite(coin.change24h));
  const gainers = candidates
    .filter((coin) => coin.change24h > 0)
    .sort((a, b) => b.change24h - a.change24h)
    .slice(0, limit);
  const losers = candidates
    .filter((coin) => coin.change24h < 0)
    .sort((a, b) => a.change24h - b.change24h)
    .slice(0, limit);
  return { gainers, losers };
}

export function marketCapBucket(coin) {
  return MARKET_CAP_BUCKETS.find(
    (bucket) =>
      Number.isFinite(coin.marketCap) &&
      coin.marketCap >= bucket.min &&
      coin.marketCap < bucket.max,
  );
}
