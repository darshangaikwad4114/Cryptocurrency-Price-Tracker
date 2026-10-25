# API Contract

The application is served behind a same-origin API boundary. The browser calls `/api/*` on the same
host; the function/Node adapter calls the upstream providers with server-only credentials. There is
no CORS configuration by design.

- **Methods:** `GET`, `HEAD` (all other methods return `405`)
- **Content type:** `application/json; charset=utf-8`
- **Authentication:** none (public read-only market and news data)
- **Rate limit:** 120 requests per minute per client IP, fixed window
- **Request IDs:** `x-request-id` header on every response; echoed in error bodies

Implementation: [`api/_lib/core.js`](../api/_lib/core.js), [`api/_lib/upstream.js`](../api/_lib/upstream.js),
and [`api/_lib/normalize.js`](../api/_lib/normalize.js).

---

## Endpoints

### `GET /api/health`

Liveness/readiness probe. Does not call upstream providers and is excluded from the data rate
limiter.

```json
{
  "status": "ok",
  "time": "2026-10-26T01:00:00.000Z",
  "requestId": "…",
  "features": {
    "news": true,
    "coingeckoKey": false
  }
}
```

`features` reports whether news credentials and a CoinGecko key are configured. It never exposes
key values.

### `GET /api/market`

| Query      | Required            | Values                                                                                                           | Default           |
| ---------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------- |
| `resource` | No                  | `coins`, `global`, `coin`, `chart`, `categories`, `exchanges`, `trending`, `fear-greed`                          | `coins`           |
| `order`    | For `coins`         | `market_cap_desc`, `market_cap_asc`, `volume_desc`, `volume_asc`, `id_asc`, `id_desc`, `gecko_desc`, `gecko_asc` | `market_cap_desc` |
| `per_page` | No                  | 1–100                                                                                                            | `100`             |
| `page`     | No                  | 1–100                                                                                                            | `1`               |
| `id`       | For `coin`, `chart` | lowercase slug: `^[a-z0-9][a-z0-9-]{0,79}$`                                                                      | —                 |
| `days`     | For `chart`         | `1`, `7`, `14`, `30`, `90`, `180`, `365`                                                                         | `30`              |

Examples:

```bash
curl -s http://localhost:3001/api/market?resource=coins\&per_page=10
curl -s http://localhost:3001/api/market?resource=coin\&id=bitcoin
curl -s http://localhost:3001/api/market?resource=chart\&id=bitcoin\&days=7
```

### `GET /api/news`

| Query   | Required | Values | Default |
| ------- | -------- | ------ | ------- |
| `limit` | No       | 1–60   | `24`    |

News items are sanitized: HTML is stripped from titles/bodies, image and article URLs must be
HTTPS, and duplicate articles are removed. If `CRYPTOCOMPARE_API_KEY` is absent, the endpoint
returns `503 NEWS_NOT_CONFIGURED`; the rest of the app continues to work.

---

## Success envelope

```json
{
  "data": [],
  "meta": {
    "resource": "coins",
    "source": "coingecko",
    "cache": "miss",
    "cachedAt": "2026-10-26T01:00:00.000Z",
    "generatedAt": "2026-10-26T01:00:00.120Z",
    "stale": false,
    "requestId": "…"
  }
}
```

`cache` is `hit`, `miss`, or `stale`. When a stale snapshot is served after an upstream failure,
`meta.stale` is `true` and the `age` response header reports its age in seconds. `source` identifies
the upstream provider (`coingecko`, `cryptocompare`, or `alternative.me`).

### Response headers

| Header                   | Meaning                                                                      |
| ------------------------ | ---------------------------------------------------------------------------- |
| `cache-control`          | `public, max-age=0, s-maxage=<ttl>, stale-while-revalidate=<stale>` for data |
| `x-cache`                | `HIT`, `MISS`, or `STALE`                                                    |
| `x-request-id`           | Correlation ID for logs and support                                          |
| `x-ratelimit-limit`      | Requests allowed in the window (120)                                         |
| `x-ratelimit-remaining`  | Requests left in the current window                                          |
| `x-ratelimit-reset`      | Unix timestamp (seconds) when the window resets                              |
| `age`                    | Age of a stale snapshot, when applicable                                     |
| `referrer-policy`        | `no-referrer` on API responses                                               |
| `x-content-type-options` | `nosniff`                                                                    |

---

## Error envelope

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "days must be one of 1, 7, 14, 30, 90, 180, 365.",
    "requestId": "…"
  }
}
```

| Status | Code                        | Meaning                                                |
| ------ | --------------------------- | ------------------------------------------------------ |
| 400    | `INVALID_REQUEST`           | Invalid resource, coin ID, days, order, limit, or page |
| 404    | `NOT_FOUND`                 | Unknown endpoint or upstream resource                  |
| 404    | `UPSTREAM_NOT_FOUND`        | Coin not found upstream                                |
| 405    | `METHOD_NOT_ALLOWED`        | Method other than GET/HEAD                             |
| 429    | `RATE_LIMITED`              | Per-IP limit exceeded; see `retry-after`               |
| 500    | `INTERNAL_ERROR`            | Sanitized unexpected failure                           |
| 502    | `UPSTREAM_UNAVAILABLE`      | Provider unreachable or returned an error              |
| 502    | `UPSTREAM_INVALID_RESPONSE` | Provider payload could not be normalized               |
| 503    | `UPSTREAM_RATE_LIMITED`     | Provider rate limit; a cooldown is applied             |
| 503    | `NEWS_NOT_CONFIGURED`       | `CRYPTOCOMPARE_API_KEY` is missing                     |
| 504    | `UPSTREAM_TIMEOUT`          | Provider timed out                                     |

5xx messages are replaced with generic text. Stack traces and upstream payloads are never returned.

---

## Cache policy

Caches are in-memory, per function instance. Each cache entry has a fresh TTL and a stale fallback
window. Concurrent misses for the same key are coalesced into one upstream request. A provider
`429` also starts a short cooldown to avoid hammering upstream.

| Resource     | Fresh TTL | Stale window |
| ------------ | --------- | ------------ |
| `coins`      | 60 s      | 600 s        |
| `global`     | 120 s     | 900 s        |
| `coin`       | 120 s     | 900 s        |
| `chart`      | 300 s     | 1,800 s      |
| `categories` | 300 s     | 1,800 s      |
| `exchanges`  | 300 s     | 1,800 s      |
| `trending`   | 120 s     | 900 s        |
| `fear-greed` | 300 s     | 1,800 s      |
| `news`       | 180 s     | 1,800 s      |

Because caches are per instance, a cold or newly scaled instance may call upstream even while
another instance holds a fresh value. For multi-instance consistency, replace the in-memory cache
and rate limiter with a shared store (for example Redis/Upstash); see
[ROADMAP.md](./ROADMAP.md#phase-7--scale-and-growth-post-launch).

---

## Provider notes

- **CoinGecko** — public endpoints are rate-limited and not intended for commercial redistribution
  at scale; configure a demo/pro key and confirm the plan for production traffic.
- **CryptoCompare** — news requires a key; it is server-only.
- **Alternative.me** — Fear & Greed index.
- Images are rendered only from HTTPS URLs returned by these providers and must be covered by the
  deployment CSP `img-src` allow-list. If a provider adds a new image host, update the CSP in both
  [`vercel.json`](../vercel.json) and [`netlify.toml`](../netlify.toml).
