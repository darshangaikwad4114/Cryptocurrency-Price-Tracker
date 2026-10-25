# Crypto Tracker — Cryptocurrency Price Tracker

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?logo=reactquery&logoColor=white)
![Node](https://img.shields.io/badge/Node-%E2%89%A522.12-339933?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

A privacy-first crypto market dashboard: live prices, charts, market structure, and news with a
local watchlist, portfolio, and price alerts. There are no accounts, no tracking, and no database —
personal data stays in the browser. Upstream API keys stay on the server behind a same-origin
serverless proxy.

**Status:** production-hardened and locally verified on 2026-10-26. No production deployment has
been performed. See [docs/IMPLEMENTATION_REPORT.md](docs/IMPLEMENTATION_REPORT.md) for the full
change log, test results, and remaining owner actions.

---

## Features

- **Markets** — top 100 assets with search, price range and market-cap filters, ten sort orders,
  table/grid views, URL-synced filter state, and persisted view preference.
- **Market overview** — total market cap, 24h volume, BTC dominance, Fear & Greed, movers, trending
  assets, categories, and exchanges.
- **Coin detail** — interactive price chart (24h–1y), market statistics, description, and official
  resources. The chart bundle is lazy-loaded.
- **News** — paginated headlines with source filtering and sanitized summaries.
- **Watchlist, portfolio, and alerts** — stored in `localStorage`; alerts evaluate while a tab is
  open and can raise browser notifications with permission.
- **UX and accessibility** — dark/light themes with pre-paint theme restoration, responsive layout,
  keyboard-accessible controls, skip link, reduced-motion support, and automated WCAG 2.1 A/AA
  checks in both themes.
- **Resilience** — stale-while-revalidate cache, stale snapshots during upstream failures,
  request-ID error envelopes, rate limiting, retries with backoff, and recoverable error states.

---

## Architecture

```text
Browser (React 18 SPA)
  │  same-origin /api/*  (no CORS, no provider keys)
  ▼
Serverless API boundary
  ├─ Vercel: api/market.js, api/news.js, api/health.js
  ├─ Netlify: netlify/functions/api.mjs  (path: /api/*)
  └─ Local:   server/dev-api.mjs on port 3001 (Vite proxy)
       │
       ├─ request validation + resource allow-list
       ├─ in-memory TTL cache + stale fallback + in-flight coalescing
       ├─ per-IP rate limiting + request IDs + sanitized errors
       ▼
CoinGecko · CryptoCompare · Alternative.me
```

- **Local-first personal data.** Watchlist, portfolio, alerts, theme, and view mode never leave the
  browser. There is no auth surface, no cookies, and no server-side personal data to breach.
- **Server-only secrets.** `CRYPTOCOMPARE_API_KEY` and optional `COINGECKO_API_KEY` are read by the
  proxy only. No `VITE_` secret fallback exists; `VITE_*` values are client-exposed by design.
- **Same-origin API.** The proxy is intentionally not CORS-enabled. CDN cache headers let the edge
  absorb repeat reads while the origin cache coalesces upstream calls.
- **Serverless constraints.** Caches and rate-limit counters are per function instance. They reduce
  upstream traffic but are not globally coordinated; see
  [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#known-limitations).

### Tech stack

| Layer | Choice |
|---|---|
| UI | React 18.3, React Router 7, Chart.js 4 + react-chartjs-2 |
| Data | TanStack Query 5, native `fetch`, custom query client |
| Styling | Design-token CSS (custom properties), Inter variable font |
| API | Node serverless functions (Vercel + Netlify v2 function adapters) |
| Tooling | Vite 8, Vitest 5, Playwright 1.64, ESLint 9 flat config, Prettier |
| Runtime | Node.js ≥ 22.12, npm ≥ 10 |

---

## Project structure

```text
api/                     # Vercel functions + shared server core
  _lib/                  # cache, upstream calls, normalizers, adapters, tests
  market.js news.js health.js
netlify/functions/       # Netlify Functions v2 adapter (/api/*)
server/dev-api.mjs       # Local API server (port 3001)
scripts/generate-seo.mjs # Canonical, sitemap, robots generation from SITE_URL
src/
  api/                   # fetch client, query keys, hooks
  app/                   # QueryClient configuration
  components/
    layout/              # header, footer, theme toggle
    market/              # market table/grid, overview, explorer, watch button
    chart/               # lazy-loaded price chart
    news/                # news list and cards
    ui/                  # shared primitives (buttons, panels, icons, status)
  features/              # alerts, portfolio, watchlist, theme, toast providers
  hooks/                 # document title, URL market filters
  lib/                   # formatters, market math, storage helpers (+ tests)
  pages/                 # route-level screens
  styles/                # design tokens, base, layout, components, pages
e2e/                     # Playwright specs + deterministic API fixtures
docs/                    # audit, roadmap, API, deployment, implementation report
public/                  # favicon, robots, pre-paint theme script
```

---

## Getting started

**Prerequisites:** Node.js 22.12+ and npm 10+. The repo pins Node 22 in `.nvmrc`.

```bash
npm ci
cp .env.example .env        # Windows: copy .env.example .env
```

Set at least `CRYPTOCOMPARE_API_KEY` in `.env` for news. CoinGecko works without a key at the public
rate limit; a demo/pro key is optional.

```bash
npm run dev
```

- Web app: `http://localhost:3000`
- Local API: `http://localhost:3001`
- Vite proxies `/api/*` to the local API, so the browser never calls upstream providers directly.

The app still renders market data if news is not configured; `/api/news` returns a sanitized
`NEWS_NOT_CONFIGURED` error.

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Client + local API with watch mode |
| `npm run dev:client` | Vite client only (expects an API on port 3001) |
| `npm run dev:api` | Local API only |
| `npm run build` | Production build + SEO artifact generation |
| `npm run preview` | Static preview of `dist` (no `/api`; use a platform emulator for full-stack) |
| `npm run lint` | ESLint over the whole repo |
| `npm test` | Vitest unit/API suite |
| `npm run test:coverage` | Vitest with V8 coverage |
| `npm run test:e2e` | Playwright desktop + mobile suites |
| `npm run test:e2e:ui` | Playwright interactive UI |

---

## Environment variables

All variables are server-side unless noted. Never prefix secrets with `VITE_`.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `CRYPTOCOMPARE_API_KEY` | For news | — | CryptoCompare news API key |
| `COINGECKO_API_KEY` | No | — | CoinGecko demo/pro key |
| `COINGECKO_PLAN` | No | `demo` | Set to `pro` when using a Pro key |
| `SITE_URL` | Production | — | Public HTTPS origin used for canonical URL, sitemap, and robots |
| `API_PORT` | No | `3001` | Local API port |
| `API_HOST` | No | `127.0.0.1` | Local API bind host |

`SITE_URL` must be a public HTTPS origin with a dotted hostname. Localhost, non-HTTPS, credentials,
query strings, and fragments are rejected; when absent, canonical/sitemap generation is skipped.

---

## API

Same-origin only, read-only (`GET`/`HEAD`), rate-limited to **120 requests/minute per IP**, and
validated server-side. Success responses use `{ data, meta }`; errors use
`{ error: { code, message, requestId } }`.

| Endpoint | Description |
|---|---|
| `GET /api/health` | Service status and whether news/CoinGecko keys are configured |
| `GET /api/market?resource=coins` | Top 100 coins (`order`, `per_page`, `page`) |
| `GET /api/market?resource=global` | Global market statistics |
| `GET /api/market?resource=coin&id=bitcoin` | Single coin snapshot |
| `GET /api/market?resource=chart&id=bitcoin&days=30` | Chart series (1, 7, 14, 30, 90, 180, 365) |
| `GET /api/market?resource=categories` | Category performance |
| `GET /api/market?resource=exchanges` | Spot exchange activity |
| `GET /api/market?resource=trending` | Trending assets |
| `GET /api/market?resource=fear-greed` | Fear & Greed index |
| `GET /api/news?limit=24` | Sanitized news (1–60 items) |

Full contract, cache TTLs, headers, and error codes: [docs/API.md](docs/API.md).

---

## Testing

```bash
npm test                    # 99 unit/API tests
npm run test:e2e            # Playwright: desktop 1440×900 + Pixel 7
npm run test:coverage       # coverage report
```

- **Unit/API (Vitest):** provider state machines, storage sanitization, formatters, market
  filtering/sorting, API normalization, cache behavior, rate limiting, upstream failures, and error
  envelopes.
- **E2E (Playwright):** dashboard, markets URL state, coin detail/chart, watchlist, portfolio,
  alerts, news pagination, navigation, 404, theme persistence, mobile menu, horizontal overflow,
  and deterministic API mocks (no external network or API keys required).
- **Accessibility:** axe (`@axe-core/playwright`) audits `/`, `/markets`, `/portfolio`, and `/alerts`
  in dark and light themes; the suite fails on serious or critical WCAG 2.0/2.1 A/AA violations.

CI runs lint, unit tests, production build, and Playwright on pushes and pull requests:
[.github/workflows/ci.yml](.github/workflows/ci.yml).

### Verified results (2026-10-26)

| Gate | Result |
|---|---|
| `npm run lint` | Pass |
| `npm test` | 99 passed / 8 files |
| `npm run test:e2e` | 41 passed, 11 intentional project skips, 0 failed |
| `npm run build` | Pass; no source maps; no secrets in `dist/` |
| `npm audit --omit=dev` | 0 vulnerabilities |
| axe WCAG 2.1 A/AA | 8 desktop audits pass (4 routes × 2 themes) |

---

## Deployment

The project is preconfigured for **Vercel** and **Netlify** with SPA rewrites and a serverless API.

- Vercel: import the repo; `vercel.json` supplies build/output settings and headers. Functions in
  `api/` are auto-detected.
- Netlify: import the repo; `netlify.toml` supplies build, functions, redirects, and headers. The
  function adapter exposes `/api/*`.
- Set `CRYPTOCOMPARE_API_KEY`, optional `COINGECKO_*`, and `SITE_URL` in the platform dashboard.
- Deploy, then verify `/api/health`, response headers, deep links, `robots.txt`, and
  `sitemap.xml`.

Step-by-step instructions, security headers, cache policy, rollback, and cost notes:
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

No deployment or production change is made without the owner's explicit approval.

---

## Security

- Provider keys are server-only; the legacy `VITE_` fallback was removed and `dist/` was scanned to
  confirm the current key is absent.
- All API input is allow-listed and validated; coin IDs, chart ranges, limits, and sort orders are
  constrained. Upstream HTML is stripped and URLs must be HTTPS.
- Responses include CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, referrer policy,
  Permissions Policy, and COOP. There is no `Access-Control-Allow-Origin`.
- Personal data is browser-local with bounded, sanitized storage keys; there is no auth or
  server-side user data to misuse.
- Structured logs include request IDs but no secrets or payloads; 5xx responses are sanitized.

**Owner action still required:** rotate the CryptoCompare key that was exposed in an earlier
`VITE_` build, even though the current code and build no longer contain it.

---

## Accessibility and performance

- Skip link, landmarks, labelled controls, visible focus styles, semantic tables, accessible chart
  alternative text, live regions, `aria-expanded` menus, and Escape-to-close navigation.
- Semantic and neutral semantic colors were retuned per theme so small badges and metadata meet
  WCAG AA contrast on every surface.
- Chart.js is isolated in a lazy `chart-vendor` chunk loaded only on coin pages. Latest local build:
  entry + vendor JS ≈ 104 kB gzip, CSS ≈ 11 kB gzip, chart chunk ≈ 74 kB gzip (on demand).
- API responses use `s-maxage`/`stale-while-revalidate` and the client keeps prior data visible
  during refresh.

---

## Scope and roadmap

This release deliberately implements the **frontend-hardening + serverless proxy** option chosen by
the owner:

- No accounts, database, multi-tenancy, subscriptions, or billing.
- The proxy exists only to hide keys and centralize caching, rate limits, and validation.
- Watchlists, portfolios, and alerts remain local; alerts are evaluated only while a tab is open.

Deferred SaaS work (auth, database, plans, billing) and its acceptance criteria are documented in
[docs/ROADMAP.md](docs/ROADMAP.md). The original pre-transformation findings are preserved in
[docs/AUDIT.md](docs/AUDIT.md).

---

## Data attribution and disclaimer

Market data by [CoinGecko](https://www.coingecko.com), news by
[CryptoCompare](https://www.cryptocompare.com), and Fear & Greed by
[Alternative.me](https://alternative.me/crypto/fear-and-greed-index/). Review each provider's
licensing terms before commercial use. Market data is for information only and is not financial
advice.

## License

MIT — see [LICENCE](LICENCE).
