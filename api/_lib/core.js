import { createCache } from './cache.js';
import { normalizers } from './normalize.js';
import { createUpstream, coingeckoCredentials, newsCredentials, UpstreamError } from './upstream.js';

const ORDERS = new Set([
  'market_cap_desc',
  'market_cap_asc',
  'volume_desc',
  'volume_asc',
  'id_asc',
  'id_desc',
  'gecko_desc',
  'gecko_asc',
]);
const COIN_ID = /^[a-z0-9][a-z0-9-]{0,79}$/;
const CHART_DAYS = new Set([1, 7, 14, 30, 90, 180, 365]);
const MARKET_RESOURCES = new Set([
  'coins',
  'global',
  'coin',
  'chart',
  'categories',
  'exchanges',
  'trending',
  'fear-greed',
]);
const SOURCES = {
  coins: 'coingecko',
  global: 'coingecko',
  coin: 'coingecko',
  chart: 'coingecko',
  categories: 'coingecko',
  exchanges: 'coingecko',
  trending: 'coingecko',
  'fear-greed': 'alternative.me',
  news: 'cryptocompare',
};
const CACHE_POLICY = {
  coins: { ttlMs: 60_000, staleMs: 600_000 },
  global: { ttlMs: 120_000, staleMs: 900_000 },
  coin: { ttlMs: 120_000, staleMs: 900_000 },
  chart: { ttlMs: 300_000, staleMs: 1_800_000 },
  categories: { ttlMs: 300_000, staleMs: 1_800_000 },
  exchanges: { ttlMs: 300_000, staleMs: 1_800_000 },
  trending: { ttlMs: 120_000, staleMs: 900_000 },
  'fear-greed': { ttlMs: 300_000, staleMs: 1_800_000 },
  news: { ttlMs: 180_000, staleMs: 1_800_000 },
};
const DEFAULT_LIMIT = 120;
const DEFAULT_WINDOW_MS = 60_000;
const MAX_TRACKED_CLIENTS = 5_000;

class RequestError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'RequestError';
    this.code = code;
    this.status = status;
  }
}

function singleValue(value) {
  if (Array.isArray(value)) return value[0];
  return typeof value === 'string' ? value : undefined;
}

function readInt(query, name, { min, max, fallback }) {
  const raw = singleValue(query?.[name]);
  if (raw === undefined || raw === '') return fallback;
  if (!/^\d+$/.test(raw)) {
    throw new RequestError('INVALID_REQUEST', `${name} must be a whole number.`);
  }
  const value = Number(raw);
  if (value < min || value > max) {
    throw new RequestError('INVALID_REQUEST', `${name} must be between ${min} and ${max}.`);
  }
  return value;
}

function readCoinId(query) {
  const id = singleValue(query?.id)?.trim().toLowerCase();
  if (!id || !COIN_ID.test(id)) {
    throw new RequestError('INVALID_REQUEST', 'A valid coin id is required.');
  }
  return id;
}

function readDays(query) {
  const days = readInt(query, 'days', { min: 1, max: 365, fallback: 30 });
  if (!CHART_DAYS.has(days)) {
    throw new RequestError(
      'INVALID_REQUEST',
      `days must be one of ${[...CHART_DAYS].join(', ')}.`,
    );
  }
  return days;
}

function cacheParameters(resource, params) {
  switch (resource) {
    case 'coin':
      return params.id;
    case 'chart':
      return `${params.id}:${params.days}`;
    case 'coins':
      return `${params.order}:${params.perPage}:${params.page}`;
    case 'news':
      return String(params.limit);
    default:
      return 'default';
  }
}

function createRateLimiter({ limit, windowMs, now }) {
  const clients = new Map();

  function prune(timestamp) {
    if (clients.size <= MAX_TRACKED_CLIENTS) return;
    for (const [key, entry] of clients) {
      if (entry.resetAt <= timestamp) clients.delete(key);
    }
    if (clients.size > MAX_TRACKED_CLIENTS) {
      const excess = clients.size - MAX_TRACKED_CLIENTS;
      let removed = 0;
      for (const key of clients.keys()) {
        clients.delete(key);
        if (++removed >= excess) break;
      }
    }
  }

  return function check(clientId) {
    const timestamp = now();
    const existing = clients.get(clientId);
    const entry = existing && existing.resetAt > timestamp
      ? existing
      : { count: 0, resetAt: timestamp + windowMs };
    entry.count += 1;
    clients.set(clientId, entry);
    prune(timestamp);
    return {
      allowed: entry.count <= limit,
      remaining: Math.max(0, limit - entry.count),
      resetAt: entry.resetAt,
      limit,
    };
  };
}

function rateLimitHeaders(result) {
  return {
    'x-ratelimit-limit': String(result.limit),
    'x-ratelimit-remaining': String(result.remaining),
    'x-ratelimit-reset': String(Math.ceil(result.resetAt / 1000)),
  };
}

function maskError(error) {
  return {
    name: error?.name ?? 'Error',
    code: error?.code ?? 'INTERNAL_ERROR',
    message: error?.message ?? 'Unknown error',
  };
}

export function createApi({
  env = process.env,
  fetchImpl = globalThis.fetch,
  now = Date.now,
  logger = console,
  rateLimit = {},
} = {}) {
  const cache = createCache({ now });
  const upstream = createUpstream({ env, fetchImpl });
  const gecko = coingeckoCredentials(env);
  const news = newsCredentials(env);
  const checkRateLimit = createRateLimiter({
    limit: rateLimit.limit ?? DEFAULT_LIMIT,
    windowMs: rateLimit.windowMs ?? DEFAULT_WINDOW_MS,
    now,
  });
  let upstreamBlockedUntil = 0;

  async function produce(resource, params) {
    if (now() < upstreamBlockedUntil) {
      throw new UpstreamError(
        'UPSTREAM_RATE_LIMITED',
        'Upstream rate limit reached. Try again shortly.',
        { status: 503 },
      );
    }

    try {
      if (resource === 'coins') {
        return normalizers.coins(
          await upstream.getCoins({
            order: params.order,
            perPage: params.perPage,
            page: params.page,
          }),
        );
      }
      if (resource === 'global') return normalizers.global(await upstream.getGlobal());
      if (resource === 'coin') return normalizers.coin(await upstream.getCoin(params.id));
      if (resource === 'chart') {
        return normalizers.chart(await upstream.getChart(params.id, params.days));
      }
      if (resource === 'categories') return normalizers.categories(await upstream.getCategories());
      if (resource === 'exchanges') return normalizers.exchanges(await upstream.getExchanges());
      if (resource === 'trending') return normalizers.trending(await upstream.getTrending());
      if (resource === 'fear-greed') {
        return normalizers['fear-greed'](await upstream.getFearGreed());
      }
      if (resource === 'news') {
        return normalizers.news(await upstream.getNews()).slice(0, params.limit);
      }
      throw new RequestError('NOT_FOUND', 'Unknown resource.', 404);
    } catch (error) {
      if (error instanceof UpstreamError && error.code === 'UPSTREAM_RATE_LIMITED') {
        const cooldown = Math.min(60_000, Math.max(10_000, (error.retryAfter ?? 20) * 1000));
        upstreamBlockedUntil = now() + cooldown;
      }
      throw error;
    }
  }

  async function serveResource(resource, params, context, rate) {
    const policy = CACHE_POLICY[resource];
    const key = `v1:${resource}:${cacheParameters(resource, params)}`;
    const startedAt = now();

    try {
      const result = await cache.wrap(key, policy, () => produce(resource, params));
      if (result.value === null || result.value === undefined) {
        throw new UpstreamError('UPSTREAM_INVALID_RESPONSE', 'Upstream returned unusable data.');
      }
      if (result.error) {
        logger.warn?.(
          JSON.stringify({
            level: 'warn',
            requestId: context.requestId,
            resource,
            message: 'Serving stale data after upstream failure',
            upstreamError: maskError(result.error),
          }),
        );
      }

      const cacheState = result.stale ? 'STALE' : result.cached ? 'HIT' : 'MISS';
      const servedAt = now();
      const headers = {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': `public, max-age=0, s-maxage=${Math.floor(policy.ttlMs / 1000)}, stale-while-revalidate=${Math.floor(policy.staleMs / 1000)}`,
        'x-request-id': context.requestId,
        'x-cache': cacheState,
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'no-referrer',
        vary: 'Accept-Encoding',
        ...rateLimitHeaders(rate),
      };
      if (result.stale) headers.age = String(Math.max(0, Math.floor((servedAt - result.cachedAt) / 1000)));

      logger.info?.(
        JSON.stringify({
          level: 'info',
          requestId: context.requestId,
          resource,
          status: 200,
          cache: cacheState,
          durationMs: servedAt - startedAt,
        }),
      );

      return {
        status: 200,
        headers,
        body: {
          data: result.value,
          meta: {
            resource,
            source: SOURCES[resource],
            cache: cacheState.toLowerCase(),
            cachedAt: new Date(result.cachedAt).toISOString(),
            generatedAt: new Date(servedAt).toISOString(),
            stale: Boolean(result.stale),
            requestId: context.requestId,
          },
        },
      };
    } catch (error) {
      const status = error instanceof RequestError ? error.status : (error.status ?? 502);
      const code =
        error instanceof RequestError ? error.code : (error.code ?? 'INTERNAL_ERROR');
      const message =
        status >= 500 && !(error instanceof UpstreamError)
          ? 'An unexpected error occurred.'
          : error.message;
      const durationMs = now() - startedAt;

      const headers = {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'x-request-id': context.requestId,
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'no-referrer',
        ...rateLimitHeaders(rate),
      };
      if (error.retryAfter) headers['retry-after'] = String(error.retryAfter);

      const log = status >= 500 ? logger.error : logger.warn;
      log?.(
        JSON.stringify({
          level: status >= 500 ? 'error' : 'warn',
          requestId: context.requestId,
          resource,
          status,
          code,
          durationMs,
          error: maskError(error),
        }),
      );

      return {
        status,
        headers,
        body: {
          error: {
            code,
            message: status >= 500 ? 'The data service is temporarily unavailable.' : message,
            requestId: context.requestId,
          },
        },
      };
    }
  }

  async function handle({ method = 'GET', pathname = '/', query = {}, headers = {}, ip } = {}) {
    const requestId =
      headers['x-request-id']?.slice(0, 64) ||
      globalThis.crypto?.randomUUID?.() ||
      `req_${now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    const timestamp = now();
    const normalizedPath = pathname.replace(/\/+$/, '') || '/';

    if (!['GET', 'HEAD'].includes(method.toUpperCase())) {
      return {
        status: 405,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          allow: 'GET, HEAD',
          'cache-control': 'no-store',
          'x-request-id': requestId,
        },
        body: { error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.', requestId } },
      };
    }

    if (normalizedPath === '/api/health' || normalizedPath === '/health') {
      return {
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
          'x-request-id': requestId,
          'x-content-type-options': 'nosniff',
          'referrer-policy': 'no-referrer',
        },
        body: {
          status: 'ok',
          time: new Date(timestamp).toISOString(),
          requestId,
          features: {
            news: Boolean(news),
            coingeckoKey: gecko.keyed,
          },
        },
      };
    }

    const rate = checkRateLimit(ip || 'unknown');
    if (!rate.allowed) {
      return {
        status: 429,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
          'retry-after': String(Math.max(1, Math.ceil((rate.resetAt - timestamp) / 1000))),
          'x-request-id': requestId,
          'x-content-type-options': 'nosniff',
          ...rateLimitHeaders(rate),
        },
        body: {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please slow down.',
            requestId,
          },
        },
      };
    }

    const context = { requestId, timestamp };

    try {
      if (normalizedPath === '/api/news') {
        const limit = readInt(query, 'limit', { min: 1, max: 60, fallback: 24 });
        return await serveResource('news', { limit }, context, rate);
      }

      if (normalizedPath === '/api/market') {
        const resource = singleValue(query.resource)?.trim().toLowerCase() || 'coins';
        if (!MARKET_RESOURCES.has(resource)) {
          throw new RequestError('INVALID_REQUEST', 'Unknown market resource.');
        }
        if (resource === 'coins') {
          const order = singleValue(query.order) || 'market_cap_desc';
          if (!ORDERS.has(order)) {
            throw new RequestError('INVALID_REQUEST', 'Unsupported sort order.');
          }
          const perPage = readInt(query, 'per_page', { min: 1, max: 100, fallback: 100 });
          const page = readInt(query, 'page', { min: 1, max: 100, fallback: 1 });
          return await serveResource(
            resource,
            { order, perPage, page },
            context,
            rate,
          );
        }
        if (resource === 'coin') {
          return await serveResource(resource, { id: readCoinId(query) }, context, rate);
        }
        if (resource === 'chart') {
          return await serveResource(
            resource,
            { id: readCoinId(query), days: readDays(query) },
            context,
            rate,
          );
        }
        return await serveResource(resource, {}, context, rate);
      }

      throw new RequestError('NOT_FOUND', 'Endpoint not found.', 404);
    } catch (error) {
      if (error instanceof RequestError) {
        return {
          status: error.status,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
            'x-request-id': requestId,
            'x-content-type-options': 'nosniff',
            ...rateLimitHeaders(rate),
          },
          body: { error: { code: error.code, message: error.message, requestId } },
        };
      }
      logger.error?.(
        JSON.stringify({
          level: 'error',
          requestId,
          message: 'Unhandled request error',
          error: maskError(error),
        }),
      );
      return {
        status: 500,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
          'x-request-id': requestId,
          'x-content-type-options': 'nosniff',
        },
        body: {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred.',
            requestId,
          },
        },
      };
    }
  }

  return { handle, cache };
}
