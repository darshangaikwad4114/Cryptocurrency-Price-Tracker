const DEFAULT_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN', requestId = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export function isApiError(error) {
  return error instanceof ApiError;
}

function statusMessage(status) {
  if (status === 404) return 'The requested data was not found.';
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status >= 500) return 'The data service is temporarily unavailable.';
  return 'The data request could not be completed.';
}

function buildQuery(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function readPayload(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function requestJson(path, { signal, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  let timedOut = false;

  const forwardAbort = () => controller.abort(signal?.reason);
  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener('abort', forwardAbort, { once: true });
  }

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(path, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
      credentials: 'same-origin',
    });
    const payload = await readPayload(response);

    if (!response.ok) {
      const error = payload?.error;
      throw new ApiError(error?.message || statusMessage(response.status), {
        status: response.status,
        code: error?.code || 'HTTP_ERROR',
        requestId: error?.requestId || response.headers.get('x-request-id'),
      });
    }

    if (!payload || typeof payload !== 'object' || !('data' in payload)) {
      throw new ApiError('The data service returned an unexpected response.', {
        status: 502,
        code: 'INVALID_RESPONSE',
      });
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (timedOut) {
      throw new ApiError('The data request timed out. Please try again.', {
        status: 504,
        code: 'TIMEOUT',
      });
    }
    if (error?.name === 'AbortError') throw error;
    throw new ApiError(
      import.meta.env.DEV
        ? 'Cannot reach the data API. Make sure "npm run dev" is running.'
        : 'Unable to reach the data service. Check your connection and try again.',
      { status: 0, code: 'NETWORK' },
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forwardAbort);
  }
}

export const api = {
  market(params, options) {
    return requestJson(`/api/market${buildQuery(params)}`, options);
  },
  news(limit, options) {
    return requestJson(`/api/news${buildQuery({ limit })}`, options);
  },
};
