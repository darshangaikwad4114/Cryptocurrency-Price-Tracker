// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { createApi } from './core.js';

const HTTPS_IMAGE = 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png';

const COIN = {
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  image: HTTPS_IMAGE,
  market_cap_rank: 1,
  current_price: 50000,
  market_cap: 1e12,
  total_volume: 3e10,
  price_change_percentage_1h_in_currency: 0.1,
  price_change_percentage_24h_in_currency: 1.5,
  price_change_percentage_7d_in_currency: 5,
  price_change_percentage_30d_in_currency: 10,
  high_24h: 51000,
  low_24h: 49000,
  circulating_supply: 19_000_000,
  total_supply: 21_000_000,
  max_supply: 21_000_000,
  ath: 69000,
  atl: 67.81,
  last_updated: '2026-01-01T00:00:00.000Z',
};

const GLOBAL = {
  data: {
    total_market_cap: { usd: 2e12 },
    total_volume: { usd: 1e11 },
    market_cap_change_percentage_24h_usd: 1.2,
    market_cap_percentage: { btc: 55, eth: 17 },
    active_cryptocurrencies: 15000,
    markets: 900,
    updated_at: 1_700_000_000,
  },
};

function response(body, status = 200, headers = {}) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function makeApi(overrides = {}) {
  const now = overrides.now ?? (() => 1_700_000_000_000);
  const fetchImpl = overrides.fetchImpl ?? vi.fn(async () => response([]));
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  const api = createApi({
    env: {},
    fetchImpl,
    now,
    logger,
    rateLimit: { limit: 120, windowMs: 60_000 },
    ...overrides,
  });
  return { api, fetchImpl, logger, now };
}

const request = (pathname, { query = {}, ip = '1.1.1.1', method = 'GET', headers = {} } = {}) => ({
  method,
  pathname,
  query,
  ip,
  headers,
});

describe('routing and validation', () => {
  it('serves health without upstream access', async () => {
    const { api, fetchImpl } = makeApi();

    const result = await api.handle(
      request('/api/health', { headers: { 'x-request-id': 'req-health' } }),
    );

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      status: 'ok',
      requestId: 'req-health',
      features: { news: false, coingeckoKey: false },
    });
    expect(result.headers['x-request-id']).toBe('req-health');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects non-read methods', async () => {
    const { api } = makeApi();
    const result = await api.handle(request('/api/market', { method: 'POST' }));

    expect(result.status).toBe(405);
    expect(result.headers.allow).toBe('GET, HEAD');
    expect(result.body.error.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('returns 404 for unknown endpoints', async () => {
    const { api } = makeApi();
    const result = await api.handle(request('/api/unknown'));

    expect(result.status).toBe(404);
    expect(result.body.error.code).toBe('NOT_FOUND');
  });

  it.each([
    ['resource=nope', '/api/market', { resource: 'nope' }, 'INVALID_REQUEST'],
    ['invalid coin id', '/api/market', { resource: 'coin', id: 'Bad Coin' }, 'INVALID_REQUEST'],
    ['missing coin id', '/api/market', { resource: 'coin' }, 'INVALID_REQUEST'],
    ['unsupported chart range', '/api/market', { resource: 'chart', id: 'bitcoin', days: '42' }, 'INVALID_REQUEST'],
    ['non-numeric chart range', '/api/market', { resource: 'chart', id: 'bitcoin', days: 'one' }, 'INVALID_REQUEST'],
    ['unsupported sort', '/api/market', { resource: 'coins', order: 'price_desc' }, 'INVALID_REQUEST'],
    ['page size too large', '/api/market', { resource: 'coins', per_page: '101' }, 'INVALID_REQUEST'],
    ['page zero', '/api/market', { resource: 'coins', page: '0' }, 'INVALID_REQUEST'],
    ['news limit too high', '/api/news', { limit: '61' }, 'INVALID_REQUEST'],
  ])('rejects %s', async (_, pathname, query, code) => {
    const { api, fetchImpl } = makeApi();
    const result = await api.handle(request(pathname, { query }));

    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe(code);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('caching', () => {
  it('serves cache misses then cache hits without refetching upstream', async () => {
    const fetchImpl = vi.fn(async () => response([COIN]));
    const { api } = makeApi({ fetchImpl });

    const first = await api.handle(
      request('/api/market', {
        query: { resource: 'coins' },
        headers: { 'x-request-id': 'req-coins' },
      }),
    );
    const second = await api.handle(request('/api/market', { query: { resource: 'coins' } }));

    expect(first.status).toBe(200);
    expect(first.headers['x-cache']).toBe('MISS');
    expect(first.body.data).toHaveLength(1);
    expect(first.body.data[0]).toMatchObject({ id: 'bitcoin', price: 50000 });
    expect(first.body.meta).toMatchObject({
      resource: 'coins',
      source: 'coingecko',
      cache: 'miss',
      stale: false,
      requestId: 'req-coins',
    });

    expect(second.status).toBe(200);
    expect(second.headers['x-cache']).toBe('HIT');
    expect(second.headers['x-request-id']).toEqual(expect.any(String));
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('serves stale data when upstream fails after the fresh window', async () => {
    let timestamp = 1_700_000_000_000;
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(response(GLOBAL))
      .mockResolvedValueOnce(response({ error: 'boom' }, 500));
    const { api, logger } = makeApi({ fetchImpl, now: () => timestamp });

    const fresh = await api.handle(request('/api/market', { query: { resource: 'global' } }));
    expect(fresh.status).toBe(200);
    expect(fresh.headers['x-cache']).toBe('MISS');

    timestamp += 121_000;
    const stale = await api.handle(request('/api/market', { query: { resource: 'global' } }));

    expect(stale.status).toBe(200);
    expect(stale.headers['x-cache']).toBe('STALE');
    expect(stale.headers.age).toBe('121');
    expect(stale.body.meta.stale).toBe(true);
    expect(stale.body.data.totalMarketCap).toBe(2e12);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('retries upstream once the stale window has fully expired', async () => {
    let timestamp = 1_700_000_000_000;
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(response([COIN]))
      .mockResolvedValueOnce(response([{ ...COIN, current_price: 51000 }]));
    const { api } = makeApi({ fetchImpl, now: () => timestamp });

    await api.handle(request('/api/market', { query: { resource: 'coins' } }));
    timestamp += 661_000;
    const refreshed = await api.handle(request('/api/market', { query: { resource: 'coins' } }));

    expect(refreshed.status).toBe(200);
    expect(refreshed.headers['x-cache']).toBe('MISS');
    expect(refreshed.body.data[0].price).toBe(51000);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe('upstream failures', () => {
  it('propagates an upstream 404 as a sanitized 404 response', async () => {
    const { api } = makeApi({ fetchImpl: vi.fn(async () => response({}, 404)) });
    const result = await api.handle(
      request('/api/market', { query: { resource: 'coin', id: 'not-a-real-coin' } }),
    );

    expect(result.status).toBe(404);
    expect(result.body.error).toMatchObject({
      code: 'UPSTREAM_NOT_FOUND',
      message: 'Requested resource was not found.',
    });
    expect(result.headers['cache-control']).toBe('no-store');
  });

  it('maps upstream 429 responses to 503 and stops hammering upstream during cooldown', async () => {
    const fetchImpl = vi.fn(async () => response({}, 429, { 'retry-after': '5' }));
    const { api } = makeApi({ fetchImpl });

    const limited = await api.handle(request('/api/market', { query: { resource: 'coins' } }));
    expect(limited.status).toBe(503);
    expect(limited.body.error.code).toBe('UPSTREAM_RATE_LIMITED');
    expect(limited.headers['retry-after']).toBe('5');

    const coolingDown = await api.handle(
      request('/api/market', { query: { resource: 'global' } }),
    );
    expect(coolingDown.status).toBe(503);
    expect(coolingDown.body.error.code).toBe('UPSTREAM_RATE_LIMITED');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('hides unexpected upstream 5xx details from clients', async () => {
    const { api } = makeApi({ fetchImpl: vi.fn(async () => response({}, 500)) });
    const result = await api.handle(request('/api/market', { query: { resource: 'coins' } }));

    expect(result.status).toBe(502);
    expect(result.body.error).toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
      message: 'The data service is temporarily unavailable.',
    });
  });

  it('reports missing news credentials without calling upstream', async () => {
    const { api, fetchImpl } = makeApi();
    const result = await api.handle(request('/api/news'));

    expect(result.status).toBe(503);
    expect(result.body.error.code).toBe('NEWS_NOT_CONFIGURED');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('rate limiting', () => {
  it('rejects requests beyond the per-client limit', async () => {
    const fetchImpl = vi.fn(async () => response(GLOBAL));
    const { api } = makeApi({ fetchImpl, rateLimit: { limit: 2, windowMs: 60_000 } });

    const first = await api.handle(request('/api/market', { query: { resource: 'global' }, ip: '9.9.9.9' }));
    const second = await api.handle(request('/api/market', { query: { resource: 'global' }, ip: '9.9.9.9' }));
    const third = await api.handle(request('/api/market', { query: { resource: 'global' }, ip: '9.9.9.9' }));

    expect(first.status).toBe(200);
    expect(first.headers['x-ratelimit-limit']).toBe('2');
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe('RATE_LIMITED');
    expect(third.headers['retry-after']).toBe('60');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('tracks clients independently', async () => {
    const fetchImpl = vi.fn(async () => response(GLOBAL));
    const { api } = makeApi({ fetchImpl, rateLimit: { limit: 1, windowMs: 60_000 } });

    const first = await api.handle(request('/api/market', { ip: '1.1.1.1' }));
    const second = await api.handle(request('/api/market', { ip: '2.2.2.2' }));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
