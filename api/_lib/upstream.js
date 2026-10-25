const JSON_HEADERS = {
  accept: 'application/json',
  'user-agent': 'CryptoPulse/3.0 (+https://github.com/)',
};

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_BYTES = 6_000_000;

export class UpstreamError extends Error {
  constructor(code, message, { status = 502, retryAfter = null, cause } = {}) {
    super(message, { cause });
    this.name = 'UpstreamError';
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

function retryAfterSeconds(response) {
  const header = response.headers.get('retry-after');
  if (!header) return null;
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 300) : null;
}

async function readBody(response, maxBytes) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new UpstreamError('UPSTREAM_BODY_TOO_LARGE', 'Upstream response was too large.');
    }
    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
}

export async function fetchJson(url, options = {}) {
  const {
    fetchImpl = globalThis.fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxBytes = DEFAULT_MAX_BYTES,
    headers = {},
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetchImpl(url, {
      headers: { ...JSON_HEADERS, ...headers },
      signal: controller.signal,
      redirect: 'follow',
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new UpstreamError('UPSTREAM_TIMEOUT', 'Upstream service timed out.', {
        status: 504,
        cause: error,
      });
    }
    throw new UpstreamError('UPSTREAM_UNAVAILABLE', 'Upstream service is unreachable.', {
      status: 502,
      cause: error,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const retryAfter = retryAfterSeconds(response);
    if (response.status === 429) {
      throw new UpstreamError(
        'UPSTREAM_RATE_LIMITED',
        'Upstream rate limit reached. Try again shortly.',
        { status: 503, retryAfter },
      );
    }
    if (response.status === 404) {
      throw new UpstreamError('UPSTREAM_NOT_FOUND', 'Requested resource was not found.', {
        status: 404,
      });
    }
    throw new UpstreamError('UPSTREAM_UNAVAILABLE', 'Upstream service returned an error.', {
      status: 502,
    });
  }

  let text;
  try {
    text = await readBody(response, maxBytes);
  } catch (error) {
    if (error instanceof UpstreamError) throw error;
    throw new UpstreamError('UPSTREAM_UNAVAILABLE', 'Could not read upstream response.', {
      cause: error,
    });
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new UpstreamError('UPSTREAM_INVALID_RESPONSE', 'Upstream returned invalid data.', {
      cause: error,
    });
  }
}

function readEnv(env, name) {
  const value = env?.[name];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function coingeckoCredentials(env = process.env) {
  const apiKey = readEnv(env, 'COINGECKO_API_KEY');
  if (!apiKey) {
    return { baseUrl: 'https://api.coingecko.com/api/v3', headers: {}, keyed: false };
  }
  if (readEnv(env, 'COINGECKO_PLAN') === 'pro') {
    return {
      baseUrl: 'https://pro-api.coingecko.com/api/v3',
      headers: { 'x-cg-pro-api-key': apiKey },
      keyed: true,
    };
  }
  return {
    baseUrl: 'https://api.coingecko.com/api/v3',
    headers: { 'x-cg-demo-api-key': apiKey },
    keyed: true,
  };
}

export function newsCredentials(env = process.env) {
  const key = readEnv(env, 'CRYPTOCOMPARE_API_KEY');
  return key ? { apiKey: key } : null;
}

export function createUpstream({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const gecko = coingeckoCredentials(env);
  const news = newsCredentials(env);

  function geckoUrl(path, params = {}) {
    const url = new URL(`${gecko.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  function get(path, params) {
    return fetchJson(geckoUrl(path, params), { fetchImpl, headers: gecko.headers });
  }

  return {
    keyed: gecko.keyed,
    newsConfigured: Boolean(news),

    getCoins({ order = 'market_cap_desc', perPage = 100, page = 1 } = {}) {
      return get('/coins/markets', {
        vs_currency: 'usd',
        order,
        per_page: perPage,
        page,
        sparkline: 'false',
        price_change_percentage: '1h,24h,7d,30d',
      });
    },

    getGlobal() {
      return get('/global');
    },

    getCoin(id) {
      return get(`/coins/${encodeURIComponent(id)}`, {
        localization: 'false',
        tickers: 'false',
        market_data: 'true',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      });
    },

    getChart(id, days) {
      return get(`/coins/${encodeURIComponent(id)}/market_chart`, {
        vs_currency: 'usd',
        days,
        interval: days >= 90 ? 'daily' : undefined,
      });
    },

    getCategories() {
      return get('/coins/categories', { order: 'market_cap_desc' });
    },

    getExchanges() {
      return get('/exchanges', { per_page: 10, page: 1 });
    },

    getTrending() {
      return get('/search/trending');
    },

    getFearGreed() {
      return fetchJson('https://api.alternative.me/fng/?limit=2&format=json', { fetchImpl });
    },

    getNews() {
      if (!news) {
        throw new UpstreamError(
          'NEWS_NOT_CONFIGURED',
          'News is not configured on this deployment.',
          { status: 503 },
        );
      }
      return fetchJson('https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest', {
        fetchImpl,
        headers: { authorization: `Apikey ${news.apiKey}` },
      });
    },
  };
}
