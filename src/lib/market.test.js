import { describe, expect, it } from 'vitest';
import {
  activeFilterCount,
  filterCoins,
  getTopMovers,
  marketCapBucket,
  sortCoins,
} from './market';

const coins = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'btc',
    price: 80_000,
    marketCap: 1_600_000_000_000,
    volume24h: 30_000_000_000,
    change24h: 1.5,
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'eth',
    price: 2_400,
    marketCap: 290_000_000_000,
    volume24h: 15_000_000_000,
    change24h: -2.4,
  },
  {
    id: 'micro',
    name: 'Micro Coin',
    symbol: 'mcx',
    price: 0.004,
    marketCap: 500_000_000,
    volume24h: 50_000,
    change24h: 9.2,
  },
  {
    id: 'unknown',
    name: 'Unknown Asset',
    symbol: 'unk',
    price: 12,
    marketCap: null,
    volume24h: null,
    change24h: null,
  },
];

describe('filterCoins', () => {
  it('matches names and symbols case-insensitively', () => {
    expect(filterCoins(coins, { search: 'BIT' }).map((coin) => coin.id)).toEqual(['bitcoin']);
    expect(filterCoins(coins, { search: ' eth ' }).map((coin) => coin.id)).toEqual(['ethereum']);
    expect(filterCoins(coins, { search: 'missing' })).toEqual([]);
  });

  it('applies inclusive price boundaries', () => {
    expect(filterCoins(coins, { minPrice: '2400', maxPrice: '80000' }).map((c) => c.id)).toEqual([
      'bitcoin',
      'ethereum',
    ]);
    expect(filterCoins(coins, { maxPrice: '1' }).map((c) => c.id)).toEqual(['micro']);
  });

  it('applies market cap buckets without matching missing caps', () => {
    expect(filterCoins(coins, { caps: ['large'] }).map((c) => c.id)).toEqual([
      'bitcoin',
      'ethereum',
    ]);
    expect(filterCoins(coins, { caps: ['small'] }).map((c) => c.id)).toEqual(['micro']);
    expect(filterCoins(coins, { caps: ['mid'] })).toEqual([]);
  });
});

describe('sortCoins', () => {
  it('sorts numerically in both directions', () => {
    expect(sortCoins(coins, 'price_desc').map((c) => c.id)).toEqual([
      'bitcoin',
      'ethereum',
      'unknown',
      'micro',
    ]);
    expect(sortCoins(coins, 'price_asc').map((c) => c.id)).toEqual([
      'micro',
      'unknown',
      'ethereum',
      'bitcoin',
    ]);
  });

  it('sorts names and keeps missing numeric values last', () => {
    expect(sortCoins(coins, 'name_asc').map((c) => c.name)).toEqual([
      'Bitcoin',
      'Ethereum',
      'Micro Coin',
      'Unknown Asset',
    ]);
    const sorted = sortCoins(coins, 'market_cap_desc');
    expect(sorted.at(-1).id).toBe('unknown');
  });

  it('does not mutate the input array', () => {
    const original = [...coins];
    sortCoins(coins, 'price_asc');
    expect(coins).toEqual(original);
  });
});

describe('filter helpers', () => {
  it('counts active filter groups', () => {
    expect(activeFilterCount({ search: '', minPrice: '', maxPrice: '', caps: [] })).toBe(0);
    expect(
      activeFilterCount({ search: 'btc', minPrice: '1', maxPrice: '', caps: ['large', 'mid'] }),
    ).toBe(3);
  });

  it('finds top gainers and losers', () => {
    const { gainers, losers } = getTopMovers(coins, 2);
    expect(gainers.map((c) => c.id)).toEqual(['micro', 'bitcoin']);
    expect(losers.map((c) => c.id)).toEqual(['ethereum']);
  });

  it('maps a coin to its market cap bucket', () => {
    expect(marketCapBucket(coins[0])?.id).toBe('large');
    expect(marketCapBucket(coins[2])?.id).toBe('small');
    expect(marketCapBucket(coins[3])).toBeUndefined();
  });
});
