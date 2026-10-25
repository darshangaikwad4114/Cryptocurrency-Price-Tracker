import assert from 'node:assert/strict';
import { createApi } from '../api/_lib/core.js';

let now = 1_700_000_000_000;
let calls = [];
let responder = async (url) => {
  calls.push(url);
  if (url.includes('/coins/markets')) {
    return Response.json([
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        market_cap_rank: 1,
        current_price: 50000,
        market_cap: 1_000_000_000_000,
        total_volume: 30_000_000_000,
        price_change_percentage_1h_in_currency: 0.123,
        price_change_percentage_24h_in_currency: -1.234,
        price_change_percentage_7d_in_currency: 4.5,
        price_change_percentage_30d_in_currency: 10,
        high_24h: 51000,
        low_24h: 49000,
        circulating_supply: 19_000_000,
        total_supply: 21_000_000,
        max_supply: 21_000_000,
        ath: 69000,
        atl: 67,
        last_updated: '2026-10-25T00:00:00.000Z',
      },
    ]);
  }
  if (url.includes('/search/trending')) {
    return Response.json({
      coins: [
        {
          item: {
            id: 'pepe',
            name: 'Pepe',
            symbol: 'PEPE',
            small: 'https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg',
            market_cap_rank: 24,
            data: { price: 0.000001, price_change_percentage_24h: { usd: 12.5 } },
          },
        },
      ],
    });
  }
  if (url.includes('min-api.cryptocompare.com')) {
    return Response.json({
      Data: [
        {
          id: 1,
          title: 'BTC <b>news</b>',
          url: 'https://example.com/a?x=1',
          source_info: { name: 'Example' },
          body: '<p>Hello &amp; <script>alert(1)</script>world</p>',
          imageurl: 'https://example.com/a.png',
          categories: 'BTC|MARKET',
          published_on: 1_700_000_000,
        },
      ],
    });
  }
  if (url.includes('alternative.me')) {
    return Response.json({
      data: [
        { value: '55', value_classification: 'Greed', timestamp: '1700000000' },
        { value: '40', value_classification: 'Fear', timestamp: '1699913600' },
      ],
    });
  }
  return new Response('not found', { status: 404 });
};

const fetchImpl = (url, options) => responder(url, options);

function makeApi(options = {}) {
  return createApi({ fetchImpl, now: () => now, logger: { info() {}, warn() {}, error() {} }, ...options });
}

const api = makeApi({ env: { CRYPTOCOMPARE_API_KEY: 'test-key' } });

const coins = await api.handle({ pathname: '/api/market', query: { resource: 'coins' } });
assert.equal(coins.status, 200);
assert.equal(coins.body.data[0].id, 'bitcoin');
assert.equal(coins.body.data[0].change24h, -1.23);
assert.equal(coins.headers['x-cache'], 'MISS');
assert.match(coins.headers['cache-control'], /s-maxage=60/);
assert.ok(!JSON.stringify(coins.body).includes('test-key'));

const coinsHit = await api.handle({ pathname: '/api/market', query: { resource: 'coins' } });
assert.equal(coinsHit.status, 200);
assert.equal(coinsHit.headers['x-cache'], 'HIT');
assert.equal(calls.length, 1);

const badOrder = await api.handle({ pathname: '/api/market', query: { resource: 'coins', order: 'price_desc' } });
assert.equal(badOrder.status, 400);
assert.equal(badOrder.body.error.code, 'INVALID_REQUEST');

const badId = await api.handle({ pathname: '/api/market', query: { resource: 'coin', id: '../../etc/passwd' } });
assert.equal(badId.status, 400);

const badDays = await api.handle({ pathname: '/api/market', query: { resource: 'chart', id: 'bitcoin', days: '13' } });
assert.equal(badDays.status, 400);

const trending = await api.handle({ pathname: '/api/market', query: { resource: 'trending' } });
assert.equal(trending.status, 200);
assert.equal(trending.body.data[0].symbol, 'PEPE');

const fear = await api.handle({ pathname: '/api/market', query: { resource: 'fear-greed' } });
assert.equal(fear.status, 200);
assert.equal(fear.body.data.value, 55);

const news = await api.handle({ pathname: '/api/news', query: { limit: '10' } });
assert.equal(news.status, 200);
assert.equal(news.body.data[0].title, 'BTC news');
assert.equal(news.body.data[0].excerpt, 'Hello & world');
assert.deepEqual(news.body.data[0].categories, ['BTC', 'MARKET']);

const noKeyApi = makeApi({ env: {} });
const newsDisabled = await noKeyApi.handle({ pathname: '/api/news' });
assert.equal(newsDisabled.status, 503);
assert.equal(newsDisabled.body.error.code, 'NEWS_NOT_CONFIGURED');

const health = await api.handle({ pathname: '/api/health' });
assert.equal(health.status, 200);
assert.equal(health.body.features.news, true);
assert.equal(health.headers['cache-control'], 'no-store');

const methods = await api.handle({ method: 'POST', pathname: '/api/market' });
assert.equal(methods.status, 405);

now += 181_000;
responder = async () => {
  throw new TypeError('network down');
};
const staleNews = await api.handle({ pathname: '/api/news', query: { limit: '10' } });
assert.equal(staleNews.status, 200);
assert.equal(staleNews.headers['x-cache'], 'STALE');
assert.equal(staleNews.body.meta.stale, true);
assert.equal(staleNews.body.data[0].id, '1');

const limited = makeApi({ env: {}, rateLimit: { limit: 2, windowMs: 60_000 } });
await limited.handle({ pathname: '/api/market', query: { resource: 'global' } });
await limited.handle({ pathname: '/api/market', query: { resource: 'global' } });
const blocked = await limited.handle({ pathname: '/api/market', query: { resource: 'global' } });
assert.equal(blocked.status, 429);
assert.equal(blocked.body.error.code, 'RATE_LIMITED');

const missing = await api.handle({ pathname: '/api/nope' });
assert.equal(missing.status, 404);

console.log('API smoke tests passed');
