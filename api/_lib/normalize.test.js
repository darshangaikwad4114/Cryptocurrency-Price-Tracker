import { describe, expect, it } from 'vitest';
import {
  cleanText,
  decodeEntities,
  finiteNumber,
  httpsUrl,
  imageUrl,
  isoTimestamp,
  nonNegative,
  normalizeCategories,
  normalizeChart,
  normalizeCoin,
  normalizeCoinDetail,
  normalizeExchanges,
  normalizeFearGreed,
  normalizeGlobal,
  normalizeNews,
  normalizeTrending,
  normalizers,
  percentage,
  positiveInt,
  stripHtml,
  uniqueHttpsUrls,
} from './normalize.js';

const HTTPS_IMAGE = 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png';

describe('decodeEntities', () => {
  it('decodes named, decimal, and hex entities', () => {
    expect(decodeEntities('Tom &amp; Jerry &lt;3 &#36; &#x20AC;')).toBe('Tom & Jerry <3 $ €');
  });

  it('replaces out-of-range code points with a space and leaves unknown entities', () => {
    expect(decodeEntities('a &#999999999; b &unknown;')).toBe('a   b &unknown;');
  });
});

describe('stripHtml', () => {
  it('removes scripts, styles, comments, and tags', () => {
    const raw =
      '<p>Hello <b>world</b></p><script>alert("x")</script><style>.x{}</style><!-- note -->&amp; friends';
    expect(stripHtml(raw)).toBe('Hello world & friends');
  });

  it('collapses whitespace and respects the max length', () => {
    expect(stripHtml('  too   many\n\nspaces  ')).toBe('too many spaces');
    expect(stripHtml('<p>abcdef</p>', 3)).toBe('abc');
  });

  it('returns an empty string for non-strings', () => {
    expect(stripHtml(null)).toBe('');
    expect(stripHtml(42)).toBe('');
  });
});

describe('cleanText and numeric helpers', () => {
  it('normalizes strings and rejects non-strings', () => {
    expect(cleanText('  a   b  ')).toBe('a b');
    expect(cleanText(null)).toBe('');
    expect(cleanText('abcdef', 4)).toBe('abcd');
  });

  it('parses finite numbers and rejects invalid values', () => {
    expect(finiteNumber('12.5')).toBe(12.5);
    expect(finiteNumber('')).toBeNull();
    expect(finiteNumber(null)).toBeNull();
    expect(finiteNumber(undefined)).toBeNull();
    expect(finiteNumber(false)).toBeNull();
    expect(finiteNumber('abc')).toBeNull();
    expect(finiteNumber(Number.POSITIVE_INFINITY)).toBeNull();

    expect(nonNegative(-1)).toBeNull();
    expect(nonNegative('0')).toBe(0);

    expect(percentage(12.3456)).toBe(12.35);
    expect(percentage(-1.005)).toBe(-1);
    expect(percentage(1_000_001)).toBeNull();

    expect(positiveInt(3)).toBe(3);
    expect(positiveInt(0)).toBeNull();
    expect(positiveInt(3.5)).toBeNull();
    expect(positiveInt('10')).toBe(10);
  });
});

describe('URL helpers', () => {
  it('accepts only https URLs without credentials', () => {
    expect(httpsUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
    expect(httpsUrl('http://example.com')).toBeNull();
    expect(httpsUrl('https://user:pass@example.com')).toBeNull();
    expect(httpsUrl('not a url')).toBeNull();
    expect(httpsUrl('https://example.com/' + 'a'.repeat(600))).toBeNull();
    expect(httpsUrl('')).toBeNull();
    expect(httpsUrl(null)).toBeNull();
  });

  it('returns a normalized image URL or null', () => {
    expect(imageUrl(HTTPS_IMAGE)).toBe(HTTPS_IMAGE);
    expect(imageUrl('http://example.com/a.png')).toBeNull();
  });

  it('de-duplicates and limits URL lists', () => {
    const urls = uniqueHttpsUrls(
      [HTTPS_IMAGE, HTTPS_IMAGE, 'https://example.com', 'http://insecure.com', 'https://b.com'],
      2,
    );
    expect(urls).toEqual([HTTPS_IMAGE, 'https://example.com/']);
    expect(uniqueHttpsUrls('nope')).toEqual([]);
  });
});

describe('isoTimestamp', () => {
  it('treats small numbers as seconds and large numbers as milliseconds', () => {
    expect(isoTimestamp(1_700_000_000)).toBe('2023-11-14T22:13:20.000Z');
    expect(isoTimestamp(1_700_000_000_000)).toBe('2023-11-14T22:13:20.000Z');
    expect(isoTimestamp('1700000000')).toBe('2023-11-14T22:13:20.000Z');
    expect(isoTimestamp('2023-11-14T22:13:20.000Z')).toBe('2023-11-14T22:13:20.000Z');
  });

  it('returns null for missing or invalid timestamps', () => {
    expect(isoTimestamp(null)).toBeNull();
    expect(isoTimestamp('')).toBeNull();
    expect(isoTimestamp('not-a-date')).toBeNull();
    expect(isoTimestamp(Number.NaN)).toBeNull();
    expect(isoTimestamp({})).toBeNull();
  });
});

describe('normalizeCoin', () => {
  it('maps a market coin and keeps nulls for missing values', () => {
    expect(
      normalizeCoin({
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: HTTPS_IMAGE,
        market_cap_rank: 1,
        current_price: 50000,
        market_cap: 1e12,
        total_volume: 3e10,
        price_change_percentage_1h_in_currency: 0.1234,
        price_change_percentage_24h: -2.5,
        price_change_percentage_7d_in_currency: null,
        high_24h: 51000,
        low_24h: 49000,
        circulating_supply: 19_000_000,
        total_supply: 21_000_000,
        max_supply: 21_000_000,
        ath: 69000,
        atl: 67.81,
        last_updated: '2026-01-01T00:00:00.000Z',
      }),
    ).toMatchObject({
      id: 'bitcoin',
      symbol: 'btc',
      name: 'Bitcoin',
      image: HTTPS_IMAGE,
      rank: 1,
      price: 50000,
      marketCap: 1e12,
      change1h: 0.12,
      change24h: -2.5,
      change7d: null,
      circulatingSupply: 19_000_000,
      lastUpdated: '2026-01-01T00:00:00.000Z',
    });

    expect(normalizeCoin({ id: 'x', name: 'X' })).toBeNull();
    expect(normalizeCoin(null)).toBeNull();
  });

  it('falls back to the plain 24h change when currency-specific data is absent', () => {
    const coin = normalizeCoin({
      id: 'ethereum',
      symbol: 'eth',
      name: 'Ethereum',
      price_change_percentage_24h: 3.21,
    });
    expect(coin.change24h).toBe(3.21);
  });
});

describe('normalizeCoinDetail', () => {
  it('maps market_data and sanitizes links and description', () => {
    const coin = normalizeCoinDetail({
      id: 'bitcoin',
      symbol: 'btc',
      name: 'Bitcoin',
      last_updated: '2026-01-01T00:00:00.000Z',
      description: { en: '<p>Digital <b>gold</b></p><script>alert(1)</script>' },
      genesis_date: '2009-01-03',
      categories: ['Cryptocurrency', 'Cryptocurrency', '  ', 'Layer 1'],
      hashing_algorithm: 'SHA-256',
      links: {
        homepage: ['http://bitcoin.org', 'https://bitcoin.org'],
        blockchain_site: ['https://blockchain.info', 'javascript:alert(1)'],
        subreddit_url: 'https://reddit.com/r/bitcoin',
        chat_url: ['https://t.me/bitcoin', 'http://insecure.chat'],
        repos_url: { github: ['https://github.com/bitcoin/bitcoin'] },
      },
      market_data: {
        current_price: { usd: 50000 },
        market_cap: { usd: 1e12 },
        total_volume: { usd: 3e10 },
        high_24h: { usd: 51000 },
        low_24h: { usd: 49000 },
        price_change_percentage_24h_in_currency: { usd: 1.5 },
        price_change_percentage_14d_in_currency: { usd: 4.5 },
        price_change_percentage_1y_in_currency: { usd: 40 },
        circulating_supply: 19_000_000,
        fully_diluted_valuation: { usd: 1.05e12 },
        ath_date: { usd: '2021-11-10T14:24:11.849Z' },
        atl_date: { usd: '2013-07-06T00:00:00.000Z' },
      },
    });

    expect(coin).toMatchObject({
      description: 'Digital gold',
      homepage: 'https://bitcoin.org/',
      explorer: 'https://blockchain.info/',
      community: ['https://reddit.com/r/bitcoin', 'https://t.me/bitcoin'],
      repos: ['https://github.com/bitcoin/bitcoin'],
      genesisDate: '2009-01-03T00:00:00.000Z',
      categories: ['Cryptocurrency', 'Layer 1'],
      hashingAlgorithm: 'SHA-256',
      fullyDilutedValuation: 1.05e12,
      change14d: 4.5,
      change1y: 40,
      athDate: '2021-11-10T14:24:11.849Z',
      atlDate: '2013-07-06T00:00:00.000Z',
      price: 50000,
    });
  });

  it('returns null without a usable base coin', () => {
    expect(normalizeCoinDetail({})).toBeNull();
    expect(normalizeCoinDetail(null)).toBeNull();
  });
});

describe('normalizeChart', () => {
  it('rejects unusable series', () => {
    expect(normalizeChart(null)).toBeNull();
    expect(normalizeChart({ prices: [] })).toBeNull();
    expect(normalizeChart({ prices: [[1, 2]] })).toBeNull();
    expect(
      normalizeChart({
        prices: [
          [1, -2],
          [3, 4],
        ],
      }),
    ).toBeNull();
  });

  it('filters malformed points and preserves order', () => {
    const chart = normalizeChart({
      prices: [
        [1000, 10],
        ['bad', 11],
        [2000, null],
        [3000, '12.5'],
      ],
    });
    expect(chart).toEqual([
      [1000, 10],
      [3000, 12.5],
    ]);
  });

  it('samples large series down to 500 points including the last point', () => {
    const prices = Array.from({ length: 1001 }, (_, index) => [index * 1000, index]);
    const sampled = normalizeChart({ prices });
    expect(sampled).toHaveLength(500);
    expect(sampled[0]).toEqual([0, 0]);
    expect(sampled.at(-1)).toEqual([1_000_000, 1000]);
  });
});

describe('aggregate normalizers', () => {
  it('normalizes global data with safe defaults', () => {
    expect(
      normalizeGlobal({
        data: {
          total_market_cap: { usd: 2e12 },
          total_volume: { usd: 1e11 },
          market_cap_change_percentage_24h_usd: 1.234,
          market_cap_percentage: { btc: 55.5, eth: 17.2 },
          active_cryptocurrencies: 15000,
          markets: 900,
          updated_at: 1_700_000_000,
        },
      }),
    ).toEqual({
      totalMarketCap: 2e12,
      totalVolume24h: 1e11,
      marketCapChange24h: 1.23,
      btcDominance: 55.5,
      ethDominance: 17.2,
      activeCryptocurrencies: 15000,
      markets: 900,
      updatedAt: '2023-11-14T22:13:20.000Z',
    });

    expect(normalizeGlobal({ data: { active_cryptocurrencies: 'x', markets: -1 } })).toMatchObject({
      activeCryptocurrencies: 0,
      markets: 0,
    });
    expect(normalizeGlobal({})).toBeNull();
  });

  it('sorts categories by market cap, drops unusable ones, and limits to 12', () => {
    const raw = Array.from({ length: 15 }, (_, index) => ({
      id: `category-${index}`,
      name: `Category ${index}`,
      market_cap: index === 0 ? null : index * 100,
      top_3_coins: [HTTPS_IMAGE],
    }));
    raw.push({ id: '', name: 'Missing id', market_cap: 99999 });

    const categories = normalizeCategories(raw);
    expect(categories).toHaveLength(12);
    expect(categories[0]).toMatchObject({ id: 'category-14', marketCap: 1400 });
    expect(categories.every((category) => category.marketCap !== null)).toBe(true);
    expect(normalizeCategories('nope')).toEqual([]);
  });

  it('normalizes exchanges and caps the list at ten', () => {
    const raw = Array.from({ length: 12 }, (_, index) => ({
      id: `exchange-${index}`,
      name: `Exchange ${index}`,
      image: HTTPS_IMAGE,
      trust_score: 10 - index,
      trust_score_rank: index + 1,
      trade_volume_24h_btc: 1000,
      year_established: 2015,
      country: 'US',
      url: 'https://example.com',
    }));
    raw.push({ id: 'bad', name: 'Bad', url: 'http://insecure.example' });

    const exchanges = normalizeExchanges(raw);
    expect(exchanges).toHaveLength(10);
    expect(exchanges[0]).toMatchObject({ id: 'exchange-0', trustScoreRank: 1 });
    expect(normalizeExchanges(null)).toEqual([]);
  });

  it('normalizes trending coins and skips malformed entries', () => {
    const trending = normalizeTrending({
      coins: [
        {
          item: {
            id: 'pepe',
            name: 'Pepe',
            symbol: 'PEPE',
            small: HTTPS_IMAGE,
            market_cap_rank: 30,
            data: { price: 0.000001, price_change_percentage_24h: { usd: -4.2 } },
          },
        },
        { item: { id: '', name: 'Broken', symbol: 'B' } },
        {},
      ],
    });

    expect(trending).toEqual([
      {
        id: 'pepe',
        name: 'Pepe',
        symbol: 'PEPE',
        image: HTTPS_IMAGE,
        rank: 30,
        price: 0.000001,
        change24h: -4.2,
      },
    ]);
    expect(normalizeTrending(null)).toEqual([]);
  });

  it('normalizes fear and greed history', () => {
    expect(
      normalizeFearGreed({
        data: [
          { value: '110', value_classification: 'Extreme Greed', timestamp: '1700000000' },
          { value: '60', value_classification: 'Greed', timestamp: '1699000000' },
        ],
      }),
    ).toEqual({
      value: 100,
      classification: 'Extreme Greed',
      updatedAt: '2023-11-14T22:13:20.000Z',
      previousValue: 60,
      previousClassification: 'Greed',
    });

    expect(normalizeFearGreed({ data: [] })).toBeNull();
    expect(normalizeFearGreed({ data: [{ value: 'x' }] })).toBeNull();
  });
});

describe('normalizeNews', () => {
  it('sanitizes articles, rejects unsafe URLs, and de-duplicates', () => {
    const news = normalizeNews({
      Data: [
        {
          id: 1,
          title: '<b>Bitcoin</b> &amp; friends',
          url: 'https://example.com/a',
          source_info: { name: '<i>Example</i> News' },
          body: '<p>Body &amp; text</p><script>alert(1)</script>',
          imageurl: HTTPS_IMAGE,
          categories: 'BTC|ETH|',
          published_on: 1_700_000_000,
        },
        {
          id: 2,
          title: 'Duplicate URL',
          url: 'https://example.com/a',
        },
        {
          id: 3,
          title: 'Insecure URL',
          url: 'http://example.com/b',
        },
        {
          id: 4,
          title: '   ',
          url: 'https://example.com/c',
        },
        {
          id: 5,
          title: 'No source',
          url: 'https://example.com/d',
          categories: ['NEWS', '  '],
          published_on: 'bad',
        },
      ],
    });

    expect(news).toHaveLength(2);
    expect(news[0]).toMatchObject({
      id: '1',
      title: 'Bitcoin & friends',
      url: 'https://example.com/a',
      source: 'Example News',
      excerpt: 'Body & text',
      image: HTTPS_IMAGE,
      categories: ['BTC', 'ETH'],
      publishedAt: '2023-11-14T22:13:20.000Z',
    });
    expect(news[1]).toMatchObject({
      id: '5',
      source: 'Unknown source',
      categories: ['NEWS'],
      publishedAt: null,
    });
    expect(normalizeNews(null)).toEqual([]);
  });
});

describe('normalizers map', () => {
  it('only accepts arrays for the coins list', () => {
    expect(normalizers.coins([{ id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' }])).toHaveLength(1);
    expect(normalizers.coins({ coins: [] })).toEqual([]);
    expect(normalizers.coins(null)).toEqual([]);
  });
});
