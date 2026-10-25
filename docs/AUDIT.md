# Project Audit — Cryptocurrency Price Tracker

**Audit date:** 2026-10-25
**Auditor role:** Full-stack / SaaS architecture / security review
**Scope:** Entire repository at `C:\PROJECTS\Cryptocurrency Price Tracker` (frontend only)
**Verdict:** Visually polished prototype with real market data, but **not production-ready** and **not a SaaS product yet**. Several release-blocking defects were confirmed by running the app and inspecting the production bundle.

> **Status note (2026-10-26):** This document records the pre-transformation baseline from the start
> of the engagement. The agreed frontend-hardening and serverless-proxy work is now implemented; see
> [IMPLEMENTATION_REPORT.md](./IMPLEMENTATION_REPORT.md) for current results, fixes, and remaining
> owner actions. The historically exposed CryptoCompare key still requires rotation; the current
> code and production bundle no longer contain it.

---

## 1. Executive summary

| Area               | Current state                                                                                                                | Rating                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Architecture       | Single 1,060-line page component, duplicated hooks/components, no routing in use                                             | 🔴 Needs refactor             |
| Security           | API key shipped to browsers; unsanitized third-party HTML; vulnerable runtime deps; no backend trust boundary                | 🔴 Critical                   |
| Data integrity     | Hard-coded Fear & Greed, fake sectors/NFTs, fake "live" clock, hard-coded fallback prices                                    | 🔴 Critical for a finance app |
| Reliability        | Fetch loop, full-page flicker every refresh, broken sort options, broken retry, race conditions                              | 🔴 Critical                   |
| Performance        | 511 KB JS + 2.1 MB source maps; Chart.js eagerly loaded; 100 remote images unoptimized                                       | 🟠 Needs work                 |
| Accessibility & UX | Hidden filter panel remains focusable; nested interactive controls; no dialog semantics/focus trap; theme toggle unreachable | 🟠 Needs work                 |
| Code quality       | ESLint fails with 30 errors; 1 placeholder test; legacy/dead files                                                           | 🔴 Baseline red               |
| Testing            | No meaningful tests; no CI                                                                                                   | 🔴 Critical                   |
| SaaS readiness     | No auth, database, tenancy, billing, admin, audit logs, observability, legal pages                                           | 🔴 Not started                |

**Immediate action required:** rotate the CryptoCompare API key. It is compiled into the public JavaScript bundle (confirmed by scanning `dist/`), so it must be considered compromised.

---

## 2. What the project is

- **Type:** React 18 single-page application built with Vite 4.
- **Purpose:** Browse the top 100 cryptocurrencies, search/filter/sort, view coin detail with historical chart, read crypto news, dark UI.
- **Data sources:** CoinGecko public API (markets, coin detail, chart, exchanges), CryptoCompare news API (keyed).
- **Persistence:** `localStorage` for favorites, portfolio, alerts, cache, view mode; `sessionStorage` for news cache.
- **Backend / database:** none.
- **Deployment:** static `dist/` build; no CI/CD, no server config, no security headers.

### Inventory

- 9 hooks, 15+ components, 5 CSS token files, 1,060-line `App.jsx`, 1,673-line `App.css`.
- Unused/legacy code: `src/coin.jsx`, `src/coin.css`, `src/index.js`, `src/App.jsx.backup`, `Header.jsx`, `HeaderNew.jsx` (imports a missing CSS file), `FilterPanel`, `ActiveFilters`, `pages/*`, `useCoins`, `useFilters`, `usePrevious`, `useErrorHandler` in practice, `context/constants.js`, `context/themeConstants.js`.
- ~30 untracked one-off `.cjs` / `.bat` / `.txt` modification scripts and duplicate documentation files in the repository root.
- Generated artifacts present in the workspace: `dist/`, `build-analysis.html` (355 KB, git-tracked), 30+ `.map` files totalling 2.1 MB.

### Verified baseline (run during audit)

| Check                  | Result                                                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `npm run build`        | Passes; main JS 211 KB (61 KB gzip), chart vendor 162 KB (56 KB gzip), React vendor 139 KB (45 KB gzip); 2.1 MB source maps emitted |
| `npm run lint`         | **Fails**: 30 errors, 0 warnings                                                                                                    |
| `npm test`             | Passes 1 placeholder assertion (`1 + 1 === 2`); no application tests                                                                |
| `npm audit` (all)      | **24 vulnerabilities**: 2 critical, 16 high, 6 moderate                                                                             |
| `npm audit --omit=dev` | 4 vulnerabilities: 2 high (axios, follow-redirects), 2 moderate (react-router)                                                      |
| API key in bundle      | **Confirmed exposed** in `dist/assets/index-*.js`                                                                                   |
| Runtime console        | 3 market fetches within seconds; "rate limit cooldown" triggered on load                                                            |
| Rendered UI            | Coin list periodically replaced by loading skeletons because refresh sets `loading=true`                                            |

---

## 3. Findings by severity

### P0 — Release blockers (fix first)

#### P0-1. Secret API key is exposed to every visitor

- **Evidence:** `.env` contains `VITE_CRYPTOCOMPARE_API_KEY`; `NewsFeed.jsx:55` reads it via `import.meta.env`; Vite inlines `VITE_*` variables into client JS. A scan of `dist/assets/index-*.js` found the 64-character key.
- **Impact:** Anyone can extract and exhaust/abuse the key; possible billing/quota abuse; key appears in browser caches, proxies, and error reports.
- **Fix:** Remove the secret from the client, proxy news through a server, rotate the key. Add CSP and secret scanning to CI.

#### P0-2. Market data fetch loop and UI flicker

- **Evidence:** `App.jsx:67-174` `fetchCoins` has dependencies `[sortBy, loading, coins.length]` and is itself an effect dependency. Calling `setLoading(true)` changes the callback identity, which re-runs the effect and fetches again. Console showed 3 fetches plus a cooldown hit during one page load. Every refresh sets `loading=true`, replacing all 100 cards with skeletons.
- **Impact:** Duplicate API calls, rate-limit exhaustion, constant screen blanking, wasted bandwidth. Confirmed in headless screenshots (0 cards while summary reads "100 of 100").
- **Fix:** Stable query function independent of loading/state; keep previous data during background refresh; TanStack Query or equivalent; dedupe/abort.

#### P0-3. API key rotation and secret removal (same as P0-1; operational step)

- Revoke the current key in CryptoCompare, issue a new one, store it only on the server. Do not commit `.env`.

#### P0-4. Unsanitized HTML injection

- **Evidence:** `CoinDetail.jsx` uses `dangerouslySetInnerHTML` with CoinGecko's `description.en`.
- **Impact:** Third-party content becomes an XSS vector if the upstream feed is compromised or manipulated; violates trust boundary.
- **Fix:** Strip/sanitize HTML to an allow-list (or render plain text), add CSP; never inject remote HTML.

#### P0-5. Fake or misleading financial data

- **Evidence:**
  - `MarketMetrics.jsx:22-27` hard-codes Fear & Greed = 48 "Neutral" and a fabricated "vs last week" statement.
  - `MarketScreener.jsx:21-30` hard-codes sector performance; `:125-140` returns fabricated NFT collections; `:105-111` uses stale exchanges including FTX.US.
  - `App.jsx:204-230` falls back to 2 hard-coded coin prices on error.
  - `LastUpdated.jsx` displays the current clock, not the last successful data fetch, labelled "Live".
- **Impact:** Users can make financial decisions based on invented data. This is a product-trust and potentially legal/regulatory risk.
- **Fix:** Remove fabricated data; fetch real endpoints or clearly label simulators; surface `dataUpdatedAt` and staleness; never present mocked values as live.

#### P0-6. No authentication, authorization, or tenant isolation

- **Evidence:** No server, no sessions, no users. All "account" data lives in `localStorage` (`cryptoFavorites`, `cryptoPortfolio`, `cryptoAlerts`).
- **Impact:** No SaaS account model; any user can edit local data; no cross-device sync; no admin controls; no way to enforce plans.
- **Fix:** Add backend auth with secure sessions, workspaces/memberships, server-side authorization on every resource, RBAC, audit logs.

#### P0-7. Production source maps expose full source code

- **Evidence:** `vite.config.js` sets `sourcemap: true`; 30+ `.map` files (2.1 MB) are emitted and would be publicly served.
- **Impact:** Source disclosure aids attackers; increases deploy size and build time.
- **Fix:** Disable source maps for production (or upload privately to an error tracker).

#### P0-8. Vulnerable runtime dependencies

- **Evidence:** `axios@1.18.1` is affected by multiple advisories including prototype pollution and ReDoS (`<1.20.0`); `react-router-dom@6.30.4` has a moderate advisory. `vite@4`/`vitest@1` are EOL and carry critical advisories in dev tooling.
- **Impact:** Known vulnerabilities; unpatched toolchain; supply-chain exposure.
- **Fix:** Upgrade axios ≥1.20, react-router ≥7.18, Vite ≥8, Vitest ≥5, ESLint flat config; remove `@rollup/plugin-terser` (use Vite/esbuild minifier); re-run audit.

#### P0-9. Quality gates are red

- **Evidence:** 30 ESLint errors; placeholder test only.
- **Impact:** No reliable regression safety net; dead code accumulates.
- **Fix:** Green lint, meaningful unit/component/API tests, CI required checks.

### P1 — High priority

1. **No server-side API layer / rate limiting.** Every browser calls CoinGecko directly. Client "cooldown" in `localStorage` is bypassable. No caching across users, no abuse protection, no provider key protection, no ability to swap providers.
2. **Broken sorting.** `ListHeader` emits keys CoinGecko does not accept (`price_desc`, `price_change_24h`, `market_cap_rank`). Sorting triggers a refetch with an invalid `order`, and local filtering never sorts. Sorting should be local over a fetched snapshot.
3. **Coin detail retry is broken.** `CoinDetail` "Retry" sets `loading=true` but the effect depends only on `coinId`, so no refetch occurs.
4. **Historical chart race conditions.** `HistoricalChart` effect depends on `dataCache` and `screenSize`; no abort cleanup; rapid timeframe switches can set stale responses; timeout not cleared on unmount; light-theme chart ticks are hard-coded white.
5. **Theme system is dead.** `ThemeProvider` is not mounted (`main.jsx`), `ThemeToggle` is not rendered, yet About claims theme support. `index.css` (base styles/fonts) is never imported; `HeaderNew.jsx` imports a non-existent `HeaderNew.css`.
6. **Favorites/portfolio/alerts are unmounted features.** Hooks are instantiated in `App.jsx` but never rendered; the star button opens coin detail instead of toggling a favorite and always looks active. Dead UI affordances.
7. **`useFilters` is invalid React.** It calls `setState` inside `useMemo` (render phase) and references undefined `useCallback` (3 lint errors). It is unused but dangerous if adopted.
8. **localStorage parsing can crash the app.** `App.jsx:82` parses `coinData` without try/catch in the cooldown path; all account hooks parse without schema validation.
9. **Accessibility gaps.** Card is a `div role="button"` containing a real `<button>` (invalid nested interactive content); filter drawer is always in the DOM and keyboard-focusable when closed; coin detail lacks `role="dialog"`, `aria-modal`, focus trap, Escape handling; charts have no text alternative; color-only change indicators; `onKeyPress` is deprecated; no skip link; 100 card buttons slow keyboard navigation.
10. **Error handling is shallow.** Error boundary exists but is not mounted; no retry/backoff on detail/chart; news retries 429 (an error that should not be retried); no request cancellation on unmount; API error internals can surface in UI.
11. **Performance.** Chart.js is eagerly loaded because `HistoricalChart` is statically imported via `CoinDetail` into `App`; no route-level code splitting; 100 remote logo images without dimensions (CLS); no virtualization or pagination; 1,673-line global CSS; font loading via Google Fonts in an unimported file.
12. **News API trust and privacy.** Third-party images and links; key in URL query string (logged by proxies); no sanitization/validation of article fields; `categories.split` assumes a string; `article.body.substring` can throw.
13. **No deployment security posture.** No CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, or `Permissions-Policy`; no HTTPS enforcement config; no `.env.example`; no backups/restore plan; no observability.
14. **No SaaS foundations.** No auth, trial/plans, entitlements, billing, invoices, admin, audit logs, email verification/reset, data export/deletion (GDPR), terms/privacy, or support tooling.
15. **Data attribution and licensing.** CoinGecko and CryptoCompare have attribution and commercial-use terms; a paid data plan is likely required for a commercial SaaS. Must confirm before launch.
16. **Outdated Node requirement.** `engines.node >=14` is inconsistent with Vite 8 / Node 24 tooling; pin a supported LTS range.

### P2 — Medium priority

- Duplicate fetch/caching logic in `App.jsx`, `useCoins`, `MarketScreener`, `HistoricalChart`, `NewsFeed`; no single API client, no shared cache, inconsistent error shapes.
- Sorting tables call `filteredCoins().sort(...)` three times per render; `filteredCoins` is a function, not memoized data; repeated O(n log n) work and unstable identity.
- No pagination beyond 100 coins; search does not cover the full market; no URL state for search/filter/sort (cannot share or deep-link views).
- No global state strategy; prop drilling; hooks hold unrelated concerns.
- Duplicate/legacy files (`coin.jsx`, `index.js`, `App.jsx.backup`, duplicate context constants) increase maintenance and confuse routing/entry points.
- No TypeScript or runtime schema validation at boundaries; numeric/string coercion risks (e.g., `parseInt` without radix, NaN in portfolio).
- No form validation for portfolio/alerts; negative/NaN amounts possible if UI is wired.
- CSS lacks a coherent component system; inline styles in `Coin.jsx`; duplicated media queries; inconsistent focus states.
- `LastUpdated` re-renders every minute app-wide; not harmful but symptomatic.
- No error tracking, analytics, uptime monitoring, or structured logging.
- No automated dependency updates, secret scanning, or SBOM.

### P3 — Low priority / polish

- Remove generated `build-analysis.html` from version control; gate the visualizer behind an env flag (and do not auto-open a browser in CI).
- Add `robots.txt`, `sitemap.xml`, canonical URLs, Open Graph/Twitter metadata, and real favicon (currently `/favicon.svg` 404s).
- Add PWA manifest/offline strategy only if product requires it.
- Replace emoji star with an icon component; remove `window.confirm`/`alert` in favor of accessible dialogs/toasts.
- Add reduced-motion audit (partially present) and print styles if needed.
- Normalize timestamps to UTC/ISO and display in user timezone.

---

## 4. Security risk register

| #   | Risk                                      | Severity           | Likelihood               | Evidence                         | Required control                                        |
| --- | ----------------------------------------- | ------------------ | ------------------------ | -------------------------------- | ------------------------------------------------------- |
| 1   | API key theft/abuse                       | Critical           | Certain (already public) | Key in bundle                    | Server proxy, rotate, secret scanning                   |
| 2   | Stored/reflected XSS via coin description | High               | Medium                   | `dangerouslySetInnerHTML`        | Sanitize/strip HTML, CSP                                |
| 3   | Broken access control / no tenancy        | Critical (as SaaS) | Certain                  | No auth/backend                  | Sessions, RBAC, tenant-scoped queries, tests            |
| 4   | Mass data scraping/abuse via API          | High               | High                     | Direct provider calls per client | Server cache, rate limits, quotas                       |
| 5   | Supply-chain vulnerabilities              | High               | Medium                   | 2 high runtime advisories        | Upgrade, audit, lockfile, CI                            |
| 6   | Source disclosure                         | Medium             | High                     | Source maps                      | Disable maps in prod                                    |
| 7   | Open redirect/XSS in router advisories    | Medium             | Low                      | react-router advisory            | Upgrade                                                 |
| 8   | CSRF on future cookie auth                | High (future)      | Medium                   | Not yet present                  | SameSite + Origin checks + CSRF tokens                  |
| 9   | Credential stuffing / brute force         | High (future)      | High                     | Not yet present                  | Rate limits, lockouts, MFA-ready design, strong hashing |
| 10  | PII/data retention non-compliance         | High (as SaaS)     | Medium                   | No privacy/account deletion      | GDPR flows, retention policy, encryption                |

---

## 5. Performance baseline

- **Initial JS:** ~511 KB uncompressed (~162 KB gzip) including Chart.js; React vendor 139 KB, chart vendor 162 KB, app 211 KB.
- **Source maps:** 2.1 MB publicly reachable if deployed as-is.
- **Images:** 100 remote CoinGecko PNGs; no `width`/`height`, no CDN resizing.
- **Fonts:** Google Fonts `@import` in an unimported stylesheet; effectively falling back to system fonts today, but a blocker for strict CSP if enabled later.
- **Network behavior:** duplicate market fetches; detail + chart + exchange requests uncoordinated; no request deduplication or shared cache; rate-limit cooldown is client-side only.
- **Rendering:** full list unmounted on every refresh; three separate sorts of the same array per render; no pagination/virtualization.
- **Targets:** LCP < 2.5 s on mid-tier mobile, INP < 200 ms, CLS < 0.1, initial JS < 200 KB gzip after route splitting, zero unnecessary refetches.

---

## 6. Test coverage baseline

| Area                                                      | Coverage |
| --------------------------------------------------------- | -------- |
| Unit (filters, formatters, entitlements)                  | 0%       |
| Components (list, filters, detail, auth forms)            | 0%       |
| API (auth, authorization, tenancy, rate limits)           | 0%       |
| E2E (guest browse, signup, watchlist, plan limits, admin) | 0%       |
| Accessibility automated checks                            | 0%       |

Current test file contains a single arithmetic assertion; it cannot fail if the app breaks.

---

## 7. SaaS readiness assessment

**Not ready.** Missing:

1. **Identity:** signup/login/logout, session management, email verification, password reset, MFA path, account deletion.
2. **Tenancy:** workspaces, memberships, roles (`owner`/`admin`/`member`/`viewer`), tenant-scoped queries, invitation flow.
3. **Plans & entitlements:** free/pro limits enforced server-side (watchlist size, alerts, history depth, export).
4. **Billing:** Stripe (or equivalent) products/prices, checkout, webhook-driven subscription state, invoices, dunning, tax handling, refunds.
5. **Admin:** user/workspace search, plan/status changes, audit log, impersonation policy (prefer support view with consent).
6. **Data:** transactional database, migrations, backups/PITR, retention and export/deletion.
7. **Operations:** structured logs, request IDs, error tracking, metrics, uptime, alerts, status page.
8. **Security:** CSP, CSRF, rate limits, strong password hashing, secure cookies, secret management, dependency scanning, penetration test.
9. **Legal:** Terms, Privacy, cookie policy, data-processing agreement, financial disclaimer, attribution for market data.
10. **Product:** onboarding, empty states, pricing page, help/support, analytics funnel, email lifecycle.

**Appropriate now:** add a secure server-side proxy immediately; add accounts and per-user watchlists next; add plan/entitlement scaffolding when pricing is decided; add real billing only after pricing, tax, and refund policy are agreed. Implement team workspaces only if there is a B2B use case; otherwise per-user multi-tenancy is the correct model.

---

## 8. Cost considerations (to validate before launch)

These are planning ranges, not quotes; current provider pricing must be verified:

| Item                      | Typical early-stage option                 | Notes                                                                                                                              |
| ------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Market data               | CoinGecko paid API plan                    | Free/demo tier is rate-limited and not intended for commercial redistribution; paid plans scale with calls/min and monthly credits |
| News                      | CryptoCompare API paid tier or alternative | Key must remain server-side                                                                                                        |
| Hosting                   | Render/Fly/Railway/Docker VPS              | Single instance + managed Postgres; ~$7–$50/mo early stage                                                                         |
| Database                  | Managed Postgres (Neon/Supabase/RDS)       | Free tier possible; backups and PITR cost more                                                                                     |
| Redis (rate limits/cache) | Upstash/managed Redis                      | Only needed when horizontally scaling; ~$0–$30/mo                                                                                  |
| Email                     | Postmark/Resend/SES                        | Verification, reset, alerts; ~$0–$15/mo early                                                                                      |
| Error tracking            | Sentry                                     | Free tier, then ~$26/mo                                                                                                            |
| Payments                  | Stripe                                     | ~2.9% + $0.30 per transaction (varies by country) + tax tooling                                                                    |
| Domain/TLS                | Registrar + Let's Encrypt                  | ~$10–$20/yr                                                                                                                        |
| Legal                     | Terms/privacy templates or counsel         | One-time cost; budget for review                                                                                                   |

Data licensing is the largest product-specific cost and legal dependency; confirm before selling subscriptions.

---

## 9. What is already good (preserve)

- Clear visual identity, consistent dark theme tokens, responsive breakpoints already present.
- Sensible use of `Intl.NumberFormat`, memoization in some components, lazy loading of market sections, and an error boundary implementation.
- Real CoinGecko integration with useful features: grid/list modes, filters, historical chart, news, skeleton states.
- No secrets committed to git (`.env` untracked), `rel="noopener noreferrer"` on external links, React's default escaping used elsewhere.
- Some accessibility intent: ARIA labels, focus-visible styles, reduced-motion media query, semantic table headers.

The refactor should keep the visual language and feature set while replacing the unreliable internals.

---

## 10. Open decisions (require owner input)

1. **SaaS depth:** per-user accounts only, or team workspaces (B2B multi-tenancy)?
2. **Auth provider:** self-hosted sessions vs managed IdP (Clerk/Auth0/Supabase).
3. **Billing:** defer until pricing is set, or implement Stripe test-mode now?
4. **Data vendor/commercial license:** CoinGecko paid plan vs alternative.
5. **Deployment target:** Docker on a VPS/Render/Fly vs serverless platform.
6. **Branding/domain:** needed for CSP, cookies, email sender, Stripe webhooks.
