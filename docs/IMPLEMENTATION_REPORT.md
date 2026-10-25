# Implementation Report

**Project:** Cryptocurrency Price Tracker → Crypto Tracker
**Date:** 2026-10-26
**Scope:** Frontend hardening + serverless API proxy (owner decision). No accounts, database, plans,
billing, or production deployment.
**Principle:** Preserve the working product and visual identity while replacing unsafe and unreliable
internals.

---

## 1. Executive summary

The app was audited, then incrementally rebuilt around a secure serverless API boundary and a
maintainable React structure. The result is a production-hardened, account-free market dashboard:

- Provider secrets are server-only; the legacy `VITE_` fallback was removed and the production
  bundle was scanned for the current key.
- All market/news access goes through validated, cached, rate-limited, same-origin API routes.
- The frontend uses TanStack Query with retry/backoff and stale snapshots instead of a manual fetch
  loop.
- Navigation, filters, portfolio, watchlist, alerts, theme, news, and error states are covered by
  automated tests.
- Accessibility audits pass in dark and light themes on the four primary routes.
- Deployment configs for Vercel and Netlify, a GitHub Actions pipeline, and updated docs are in
  place.

No production deployment or owner infrastructure change was made.

---

## 2. What changed by area

### 2.1 Build, toolchain, and quality gates

- Upgraded to Vite 8, Vitest 5, ESLint 9 flat config, React plugin 6, Playwright 1.64.
- Added Prettier config, `.nvmrc` (Node 22), `.env.example`, and a production-safe `.gitignore`.
- Disabled source maps in production; removed the auto-opening bundle analysis step.
- Added `vitest.config.js` coverage boundaries and `tests/setup.js` with a node/jsdom-safe setup.
- `npm audit --omit=dev` reports **0 vulnerabilities**.

Key files: `package.json`, `package-lock.json`, `vite.config.js`, `vitest.config.js`,
`eslint.config.js`, `.nvmrc`, `.env.example`, `.gitignore`, `.prettierrc.json`,
`.prettierignore`, `tests/setup.js`.

### 2.2 Secure serverless API

New API core with:

- Resource allow-list (`coins`, `global`, `coin`, `chart`, `categories`, `exchanges`, `trending`,
  `fear-greed`, `news`, `health`).
- Strict query validation (IDs, ranges, enums, page/limit bounds).
- In-memory TTL cache with stale fallback and in-flight coalescing.
- Per-IP fixed-window rate limiting (120/min) with truthful response headers.
- Request IDs, structured logs without secrets, sanitized 5xx responses.
- HTML stripping, HTTPS-only URL normalization, finite-number coercion fixes.
- No CORS by design; same-origin only.
- Platform adapters for Vercel (`api/*.js`), Netlify Functions v2, and a local Node server.

Key files: `api/_lib/cache.js`, `api/_lib/core.js`, `api/_lib/node-adapter.js`,
`api/_lib/normalize.js`, `api/_lib/upstream.js`, `api/market.js`, `api/news.js`, `api/health.js`,
`netlify/functions/api.mjs`, `server/dev-api.mjs`.

### 2.3 Frontend architecture

- Replaced legacy scattered components with an `app / layouts / pages / components / features /
hooks / services / utils` structure and a single app shell.
- TanStack Query owns fetching, caching, deduplication, retries, and refresh intervals.
- Lazy-loaded the Chart.js route/bundle; isolated React and chart vendors.
- URL-driven market state (`q`, `sort`, `min`, `max`, `cap`) and persisted grid/table view.
- Local-first providers for watchlist, portfolio, alerts, theme, and toasts, with sanitized storage.
- Pre-paint theme restoration to avoid a flash of the wrong theme.
- Real loading, empty, stale, and recoverable error states instead of fabricated data.

Key areas: `src/app/`, `src/layouts/`, `src/pages/`, `src/components/{market,chart,news,ui}/`,
`src/features/{alerts,portfolio,watchlist,theme,toast}/`, `src/hooks/`, `src/services/`,
`src/utils/`, `src/styles/`.

### 2.4 UI/UX, responsiveness, and accessibility

- Responsive header/navigation, mobile drawer, layouts at 360/768/1440+.
- Design-token color system retuned for WCAG AA contrast in both themes.
- Fixed toast region semantics, brand accessible names, and the mobile menu visibility cascade.
- Skip link, landmarks, labelled controls, table semantics, chart alternative text, live regions,
  Escape-to-close menu, focus-visible styles, and reduced-motion support.
- Axe audits pass for `/`, `/markets`, `/portfolio`, `/alerts` in dark and light themes.

Key files: `src/styles/{design-tokens,base,layout,components,pages}.css`,
`src/features/toast/ToastProvider.jsx`, `src/layouts/Header.jsx`, `src/layouts/Footer.jsx`.

### 2.5 Testing

- **99 unit/API tests** across 8 files.
- **Playwright E2E** for desktop (1440×900) and mobile (Pixel 7), with deterministic API mocks.
- **axe WCAG 2.1 A/AA** checks for four routes in two themes.
- CI workflow for lint, unit tests, build, and Playwright.

Key files: `src/utils/*.test.js`, `src/features/*/*Provider.test.jsx`,
`api/_lib/*.test.js`, `e2e/fixtures.js`, `e2e/*.spec.js`, `playwright.config.js`,
`.github/workflows/ci.yml`.

### 2.6 Deployment and documentation

- `vercel.json`: SPA rewrites excluding `/api`, CSP/security headers, immutable asset caching,
  no-cache HTML.
- `netlify.toml`: build/functions config, SPA fallback, headers, caching.
- SEO generation from `SITE_URL` (canonical, sitemap, robots) with safe skip behavior when unset.
- New/updated docs: README, API contract, deployment guide, this report, roadmap status.

---

## 3. Defects found and fixed

| Defect                                                 | Impact                                          | Resolution                                                                                  |
| ------------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Provider key shipped to the browser via `VITE_` env    | Anyone could extract and abuse the key          | Moved news calls server-side; removed `VITE_CRYPTOCOMPARE_API_KEY` fallback; scanned `dist` |
| `finiteNumber(null)` / `finiteNumber('')` returned `0` | Missing API values became fake zero prices      | Returns `null` for null/undefined/boolean/blank                                             |
| Watchlist accepted numeric IDs                         | Malformed persisted data could enter state      | String + slug validation in provider                                                        |
| Alert `triggeredPrice: null` could become `0`          | False "triggered at $0.00" display              | Preserved `null`; regression test added                                                     |
| Rate-limit header hard-coded 120                       | Misleading headers under custom limits          | Header uses the actual configured limit                                                     |
| Mobile menu toggle visible on desktop                  | Desktop users could open a duplicate mobile nav | Raised selector specificity over `.icon-button`                                             |
| Toast region had `aria-label` without a role           | Axe `aria-prohibited-attr`                      | Added `role="region"`                                                                       |
| Brand links' `aria-label` hid visible text             | Axe label/content mismatch                      | Removed redundant labels                                                                    |
| Low-contrast metadata, pills, and change badges        | WCAG AA failures in both themes                 | Retuned text/semantic tokens per theme                                                      |
| Fetch loop/flicker on dashboard                        | Excess requests, unstable UI                    | Query layer with intervals, caching, retry/backoff                                          |
| Unsanitized news HTML                                  | XSS risk from upstream content                  | HTML stripping and HTTPS URL validation                                                     |
| Fabricated market/Fear & Greed data                    | Misleading financial information                | Replaced with real endpoints and honest unavailable states                                  |
| Production source maps                                 | Source disclosure                               | Disabled in Vite                                                                            |
| Vulnerable/duplicate legacy dependencies               | Security and maintenance risk                   | Toolchain upgrade; audit clean                                                              |

The Playwright work also surfaced that a filter checkbox test was racing React's URL update. The app
behavior was correct; the test now asserts checked state, URL, and row count with auto-waiting
expectations instead of `check()`'s immediate state verification.

---

## 4. Verification results

Run locally on 2026-10-26:

| Gate             | Command                              | Result                                                         |
| ---------------- | ------------------------------------ | -------------------------------------------------------------- |
| Lint             | `npm run lint`                       | Pass                                                           |
| Unit/API         | `npm test`                           | **99 passed**, 8 files                                         |
| E2E              | `npm run test:e2e`                   | **41 passed**, 11 intentional skips, 0 failed                  |
| Build            | `npm run build`                      | Pass                                                           |
| Dependency audit | `npm audit --omit=dev`               | 0 vulnerabilities                                              |
| Secret scan      | key grep over `dist/` and repo       | Not present outside `.env`                                     |
| SEO generation   | `SITE_URL=https://example.com` build | Canonical, sitemap, robots generated; neutral rebuild restored |
| Accessibility    | Playwright + axe                     | 8 desktop audits pass (4 routes × 2 themes)                    |

Intentional E2E skips are project-specific: mobile-only layout/navigation tests on desktop and
desktop-only axe audits on mobile.

### Bundle snapshot (latest local build)

| Asset               | Size      | Gzip     |
| ------------------- | --------- | -------- |
| Entry JS            | 144.14 kB | 36.68 kB |
| React vendor        | 171.26 kB | 56.60 kB |
| CSS                 | 61.13 kB  | 10.72 kB |
| Chart vendor (lazy) | 211.40 kB | 73.61 kB |

---

## 5. Security posture

Implemented:

- Secrets server-only; no `VITE_` secret paths; `dist` verified key-free.
- Validated, allow-listed API inputs; sanitized HTML; HTTPS-only outbound URL checks.
- CSP with same-origin scripts/connects, restricted image hosts, no framing, form-action self.
- HSTS, nosniff, referrer policy, Permissions Policy, COOP.
- No CORS; public API is read-only.
- Rate limiting, request IDs, sanitized errors, no stack traces in responses.
- Dependency audit clean; production source maps disabled.
- Local-only personal data; no auth/cookies/server user records by design.

Remaining owner actions:

1. **Rotate the historically exposed CryptoCompare key** and set the new value only in server env.
2. Verify headers on the deployed domain (configs are not live-tested here).
3. Decide whether to add error tracking/uptime monitoring and a shared rate-limit/cache store.

---

## 6. Performance

- Chart.js split into an on-demand chunk; initial JS is ~104 kB gzip (entry + React vendor).
- CSS ~11 kB gzip.
- Query caching keeps previous data during refresh; API CDN caching and stale fallback reduce
  upstream calls.
- Route/layout components are memoized where needed; local filtering/sorting avoids extra API calls.
- No production performance trace (Lighthouse/WebPageTest) was run against a deployed environment;
  that remains a staging task.

---

## 7. Costs

Planning estimates only; verify current provider pricing:

| Item                      | Early-stage estimate                    | Notes                                      |
| ------------------------- | --------------------------------------- | ------------------------------------------ |
| Vercel/Netlify            | Hobby free; Pro commonly ~$20/mo        | Static + functions                         |
| CoinGecko                 | Paid plan required for commercial scale | Free/demo tiers are limited                |
| CryptoCompare             | Plan dependent                          | Required for news                          |
| Domain/TLS                | ~$10–20/yr                              | TLS included by platform                   |
| Redis (optional)          | ~$0–30/mo                               | Only for shared cache/rate limits at scale |
| Error tracking (optional) | Free tier → ~$26/mo                     | Not wired in                               |
| Legal review              | One-time                                | Terms/privacy if productizing              |

The current product has no billing or subscription costs because billing is intentionally out of
scope.

---

## 8. SaaS readiness

The app is **ready to deploy as an anonymous, local-first market dashboard**, not as a multi-user
SaaS. Readiness by capability:

| Capability                                             | Status                                                                                    |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Public market dashboard                                | Ready; deployment + key rotation pending                                                  |
| Secure API boundary                                    | Ready; rate limit/cache per instance                                                      |
| Anonymous personalization (watchlist/portfolio/alerts) | Ready; browser-local only                                                                 |
| Accounts, sessions, email verification                 | Not implemented (deferred)                                                                |
| Database, sync, multi-device                           | Not implemented (deferred)                                                                |
| Multi-tenancy / RBAC                                   | Not implemented (deferred)                                                                |
| Plans, entitlements, billing                           | Not implemented (skipped by decision)                                                     |
| Admin console                                          | Not implemented (deferred)                                                                |
| Observability (error tracking, uptime)                 | Partial: platform logs only                                                               |
| CI/E2E/deployment config                               | Ready                                                                                     |
| Legal/compliance                                       | Disclaimer + attribution present; full ToS/privacy needed only if accounts/data are added |
| Scale beyond one function instance                     | Needs shared cache/rate limiter and confirmed provider plans                              |

The deliberate architecture keeps a clean seam for future accounts: replace local providers with
authenticated API calls and add a database, auth, and tenant scoping. That remains a product decision,
not a missing implementation of this release.

---

## 9. Remaining issues and recommendations

1. **Rotate the exposed key** (highest priority; owner action).
2. Deploy to a staging environment with approval, then verify CSP/headers, deep links, API health,
   SEO artifacts, and both themes.
3. Add a live smoke test in staging for provider contracts; current E2E uses mocks by design.
4. Confirm CoinGecko/CryptoCompare licensing and quota for the expected traffic.
5. Add Sentry (or equivalent) and uptime checks before public launch.
6. Replace in-memory cache/rate limit with Redis when scaling past one instance.
7. Consider background alert evaluation (queue/scheduler) if alerts should work with the tab closed.
8. ~~Optional cleanup: archive legacy root helper scripts, `src/App.jsx.backup`, stale style notes,
   and `build-analysis.html`.~~ Completed: these files are archived under the ignored `_legacy/`
   directory and no longer appear in the project root or source tree.
9. Per-route SEO requires prerendering/SSR if organic coin-page acquisition matters.
10. Re-run Lighthouse/WebPageTest on the deployed URL; local bundle sizes are not field data.

---

## 10. Key file inventory

### Added

- **API:** `api/_lib/{cache,core,normalize,node-adapter,upstream}.js`,
  `api/_lib/{core,normalize}.test.js`, `api/{market,news,health}.js`
- **Serverless/local:** `netlify/functions/api.mjs`, `server/dev-api.mjs`
- **Frontend:** `src/app/{main.jsx,App.jsx,queryClient.js}`, `src/layouts/**`,
  `src/components/{chart,market,news,ui}/**`,
  `src/features/{alerts,portfolio,theme,toast,watchlist}/**`, `src/hooks/*`, `src/services/*`,
  `src/utils/*`, `src/pages/*`
- **Styles:** `src/styles/{design-tokens,base,layout,components,pages}.css`
- **Tests:** `src/**/*.test.{js,jsx}`, `api/**/*.test.js`, `e2e/**`, `tests/setup.js`
- **Config:** `vercel.json`, `netlify.toml`, `.github/workflows/ci.yml`, `playwright.config.js`,
  `vitest.config.js`, `eslint.config.js`, `.env.example`, `.nvmrc`, Prettier configs
- **Docs:** `docs/{API,DEPLOYMENT,IMPLEMENTATION_REPORT}.md` (audit and roadmap updated)
- **Assets/scripts:** `public/{favicon.svg,robots.txt,theme-init.js}`, `scripts/generate-seo.mjs`

### Replaced/removed

Legacy page/component/CSS/context/util files (Axios helpers, `src/components/Coin*`,
`HistoricalChart`, `MarketScreener`, `NewsFeed`, `ThemeContext`, `index.css`, etc.) were replaced by
the structure above. `git status` records the exact deletions; no user data or `.env` content was
removed.

### Updated

`package.json`, `package-lock.json`, `vite.config.js`, `vitest.config.js`, `eslint.config.js`,
`index.html`, `README.md`, `docs/AUDIT.md`, `docs/ROADMAP.md`, `src/app/App.jsx`,
`src/app/main.jsx`, `src/styles/design-tokens.css`.

---

## 11. Final status

**Complete for the agreed scope.** Build, lint, 99 unit/API tests, 41 E2E tests, and accessibility
checks pass locally. Deployment configs are ready but intentionally not deployed. The highest-risk
remaining item is operational: rotate the previously exposed provider key and verify the deployed
security headers before launch.
