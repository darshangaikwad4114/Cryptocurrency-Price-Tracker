const DAY_MS = 86_400_000;
const NOW = Date.now();
const NOW_ISO = new Date(NOW).toISOString();

const BASE_COINS = [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    rank: 1,
    price: 50000,
    marketCap: 1_100_000_000_000,
    volume24h: 30_000_000_000,
    change1h: 0.1,
    change24h: 1.5,
    change7d: 3,
    change30d: 7,
    high24h: 51000,
    low24h: 49000,
    circulatingSupply: 19_000_000,
    totalSupply: 21_000_000,
    maxSupply: 21_000_000,
    ath: 69000,
    atl: 67.81,
    lastUpdated: NOW_ISO,
  },
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    rank: 2,
    price: 3000,
    marketCap: 350_000_000_000,
    volume24h: 15_000_000_000,
    change1h: -0.2,
    change24h: -2.1,
    change7d: -4,
    change30d: 2,
    high24h: 3100,
    low24h: 2950,
    circulatingSupply: 120_000_000,
    totalSupply: 120_000_000,
    maxSupply: null,
    ath: 4878,
    atl: 0.43,
    lastUpdated: NOW_ISO,
  },
  {
    id: 'solana',
    symbol: 'sol',
    name: 'Solana',
    rank: 4,
    price: 150,
    marketCap: 60_000_000_000,
    volume24h: 3_000_000_000,
    change1h: 0.4,
    change24h: 4.2,
    change7d: 9,
    change30d: 12,
    high24h: 154,
    low24h: 143,
    circulatingSupply: 400_000_000,
    totalSupply: 580_000_000,
    maxSupply: null,
    ath: 259,
    atl: 0.5,
    lastUpdated: NOW_ISO,
  },
  {
    id: 'cardano',
    symbol: 'ada',
    name: 'Cardano',
    rank: 8,
    price: 0.5,
    marketCap: 12_000_000_000,
    volume24h: 400_000_000,
    change1h: -0.1,
    change24h: -0.5,
    change7d: 1,
    change30d: -3,
    high24h: 0.52,
    low24h: 0.48,
    circulatingSupply: 24_000_000_000,
    totalSupply: 45_000_000_000,
    maxSupply: 45_000_000_000,
    ath: 3.09,
    atl: 0.02,
    lastUpdated: NOW_ISO,
  },
  {
    id: 'chainlink',
    symbol: 'link',
    name: 'Chainlink',
    rank: 12,
    price: 15,
    marketCap: 5_000_000_000,
    volume24h: 300_000_000,
    change1h: 0,
    change24h: 0,
    change7d: 2,
    change30d: 5,
    high24h: 15.5,
    low24h: 14.7,
    circulatingSupply: 333_000_000,
    totalSupply: 1_000_000_000,
    maxSupply: 1_000_000_000,
    ath: 52.7,
    atl: 0.15,
    lastUpdated: NOW_ISO,
  },
  {
    id: 'micro-coin',
    symbol: 'micro',
    name: 'Micro Coin',
    rank: 99,
    price: 0.0005,
    marketCap: 500_000_000,
    volume24h: 1_000_000,
    change1h: -1,
    change24h: -12,
    change7d: -20,
    change30d: -35,
    high24h: 0.00058,
    low24h: 0.00047,
    circulatingSupply: 1_000_000_000_000,
    totalSupply: 1_000_000_000_000,
    maxSupply: null,
    ath: 0.01,
    atl: 0.0001,
    lastUpdated: NOW_ISO,
  },
];

export const COINS = BASE_COINS.map((coin) => ({ ...coin, image: null }));

export const GLOBAL = {
  totalMarketCap: 2_500_000_000_000,
  totalVolume24h: 100_000_000_000,
  marketCapChange24h: 1.23,
  btcDominance: 55.5,
  ethDominance: 17.2,
  activeCryptocurrencies: 15000,
  markets: 900,
  updatedAt: NOW_ISO,
};

export const FEAR_GREED = {
  value: 61,
  classification: 'Greed',
  updatedAt: NOW_ISO,
  previousValue: 58,
  previousClassification: 'Greed',
};

export const TRENDING = [
  { id: 'solana', name: 'Solana', symbol: 'SOL', image: null, rank: 4, price: 150, change24h: 4.2 },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', image: null, rank: 9, price: 0.12, change24h: -1.2 },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', image: null, rank: 12, price: 15, change24h: 0 },
];

export const CATEGORIES = [
  {
    id: 'layer-1',
    name: 'Layer 1',
    marketCap: 1_800_000_000_000,
    marketCapChange24h: 1.1,
    volume24h: 50_000_000_000,
    topCoinImages: [],
  },
  {
    id: 'defi',
    name: 'DeFi',
    marketCap: 100_000_000_000,
    marketCapChange24h: -2.2,
    volume24h: 8_000_000_000,
    topCoinImages: [],
  },
];

export const EXCHANGES = [
  {
    id: 'binance',
    name: 'Binance',
    image: null,
    trustScore: 10,
    trustScoreRank: 1,
    volume24hBtc: 500_000,
    yearEstablished: 2017,
    country: 'Cayman Islands',
    url: 'https://www.binance.com/',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Exchange',
    image: null,
    trustScore: 9,
    trustScoreRank: 2,
    volume24hBtc: 200_000,
    yearEstablished: 2012,
    country: 'United States',
    url: 'https://www.coinbase.com/',
  },
];

export const NEWS = Array.from({ length: 12 }, (_, index) => ({
  id: String(index + 1),
  title: `Market headline ${index + 1} about digital assets`,
  url: `https://example.com/news/${index + 1}`,
  source: 'Test Wire',
  excerpt: `Summary for headline ${index + 1}.`,
  image: null,
  categories: [index < 8 ? 'Bitcoin' : 'Ethereum'],
  publishedAt: new Date(NOW - (index + 1) * 3_600_000).toISOString(),
}));

const DETAIL_EXTRA = {
  description:
    'Bitcoin is the first decentralized digital currency, powered by a peer-to-peer network and a public ledger. '.repeat(
      12,
    ),
  homepage: 'https://bitcoin.org/',
  explorer: 'https://blockchain.info/',
  community: ['https://www.reddit.com/r/bitcoin/'],
  repos: ['https://github.com/bitcoin/bitcoin'],
  genesisDate: '2009-01-03T00:00:00.000Z',
  categories: ['Cryptocurrency', 'Layer 1'],
  hashingAlgorithm: 'SHA-256',
  fullyDilutedValuation: 1_200_000_000_000,
  change14d: 4.5,
  change1y: 40,
  athDate: '2021-11-10T14:24:11.849Z',
  atlDate: '2015-01-14T00:00:00.000Z',
};

function detailFor(coin) {
  return {
    ...coin,
    ...DETAIL_EXTRA,
    description:
      coin.id === 'bitcoin'
        ? DETAIL_EXTRA.description
        : `${coin.name} is a digital asset used in automated end-to-end tests.`,
  };
}

function seriesFor(coin, days) {
  const pointCount = days === 1 ? 24 : days === 365 ? 52 : 31;
  const step = (days * DAY_MS) / pointCount;
  return Array.from({ length: pointCount }, (_, index) => {
    const drift = 0.9 + (index / pointCount) * 0.2;
    const timestamp = NOW - (pointCount - 1 - index) * step;
    return [Math.round(timestamp), Number((coin.price * drift).toFixed(8))];
  });
}

async function fulfillJson(route, status, payload) {
  await route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(payload),
  });
}

function envelope(resource, data) {
  return {
    data,
    meta: {
      resource,
      source: resource === 'news' ? 'cryptocompare' : 'coingecko',
      cache: 'miss',
      cachedAt: NOW_ISO,
      generatedAt: NOW_ISO,
      stale: false,
      requestId: 'req-e2e',
    },
  };
}

export async function installApiMocks(page, { failMarket = false } = {}) {
  await page.route('**/api/market**', async (route) => {
    const url = new URL(route.request().url());
    const resource = url.searchParams.get('resource') ?? 'coins';

    if (failMarket) {
      return fulfillJson(route, 503, {
        error: {
          code: 'UPSTREAM_UNAVAILABLE',
          message: 'The data service is temporarily unavailable.',
          requestId: 'req-e2e',
        },
      });
    }

    if (resource === 'coins') return fulfillJson(route, 200, envelope('coins', COINS));
    if (resource === 'global') return fulfillJson(route, 200, envelope('global', GLOBAL));
    if (resource === 'fear-greed') return fulfillJson(route, 200, envelope('fear-greed', FEAR_GREED));
    if (resource === 'trending') return fulfillJson(route, 200, envelope('trending', TRENDING));
    if (resource === 'categories') return fulfillJson(route, 200, envelope('categories', CATEGORIES));
    if (resource === 'exchanges') return fulfillJson(route, 200, envelope('exchanges', EXCHANGES));

    if (resource === 'coin') {
      const id = url.searchParams.get('id');
      const coin = COINS.find((entry) => entry.id === id);
      if (!coin) {
        return fulfillJson(route, 404, {
          error: {
            code: 'UPSTREAM_NOT_FOUND',
            message: 'Requested resource was not found.',
            requestId: 'req-e2e',
          },
        });
      }
      return fulfillJson(route, 200, envelope('coin', detailFor(coin)));
    }

    if (resource === 'chart') {
      const id = url.searchParams.get('id');
      const days = Number(url.searchParams.get('days') ?? 30);
      const coin = COINS.find((entry) => entry.id === id);
      if (!coin) {
        return fulfillJson(route, 404, {
          error: {
            code: 'UPSTREAM_NOT_FOUND',
            message: 'Requested resource was not found.',
            requestId: 'req-e2e',
          },
        });
      }
      return fulfillJson(route, 200, envelope('chart', seriesFor(coin, days)));
    }

    return fulfillJson(route, 400, {
      error: { code: 'INVALID_REQUEST', message: 'Unknown market resource.', requestId: 'req-e2e' },
    });
  });

  await page.route('**/api/news**', async (route) => {
    const url = new URL(route.request().url());
    const limit = Number(url.searchParams.get('limit') ?? 24);
    return fulfillJson(route, 200, envelope('news', NEWS.slice(0, limit)));
  });
}
