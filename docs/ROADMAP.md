# Prioritized Roadmap

**Last updated:** 2026-10-26
**Source:** [Project Audit](./AUDIT.md) · [Implementation Report](./IMPLEMENTATION_REPORT.md)
**Principle:** Fix safety and data integrity first, then architecture, then SaaS capabilities. No production deployment without explicit approval.

Effort is expressed in engineering time for one experienced full-stack developer; it is not a delivery commitment.

---

## Owner decisions and delivery status (2026-10-26)

| Decision     | Choice                        | Consequence                                                                         |
| ------------ | ----------------------------- | ----------------------------------------------------------------------------------- |
| Auth/backend | **Frontend hardening only**   | No accounts or database; serverless proxy hides keys and centralizes caching/limits |
| SaaS plans   | **Skip plans entirely**       | No plan limits, pricing page, or entitlement enforcement                            |
| Billing      | **Deferred**                  | No Stripe, subscriptions, invoices, or admin console                                |
| Deployment   | **Vercel/Netlify serverless** | Static SPA + functions; configs committed, not deployed                             |

**Delivered:** Phases 0, 1, and 2 (within the frontend-hardening scope), plus Phase 6 CI/E2E/deployment
configuration/docs. Local gates: lint pass, 99 unit/API tests, 41 E2E passes (11 intentional skips),
0 production dependency vulnerabilities, dark/light axe audits pass, production build secret-free.

**Owner-gated / pending:** rotate the historically exposed CryptoCompare key, deploy staging,
verify headers and provider quotas on the live domain, and decide on error tracking/uptime.

**Out of scope by decision:** Phases 3 (accounts, tenancy), 4 (SaaS surface), and 5 (billing).
They remain documented below as the future path if the product becomes multi-user.

---

## Phase 0 — Stop the bleeding (same day)

| #   | Task                                                       | Acceptance criteria                                                                                                    | Effort |
| --- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------ |
| 0.1 | Rotate and revoke the exposed CryptoCompare key            | Old key disabled; new key exists only in server env; key absent from `dist/` and git history                           | 15 min |
| 0.2 | Remove `VITE_*` secret usage from the client               | No `import.meta.env` secret references; news fails gracefully if proxy unavailable                                     | 30 min |
| 0.3 | Disable production source maps and auto-opening visualizer | `dist/` contains no `.map` files; build works in CI without opening a browser                                          | 15 min |
| 0.4 | Upgrade runtime dependencies                               | axios ≥ 1.20, react-router-dom ≥ 7.18; `npm audit --omit=dev` reports 0 high/critical                                  | 1–2 h  |
| 0.5 | Fix the fetch loop and refresh flicker                     | Exactly one market request on load; periodic refresh keeps existing rows visible; no rate-limit cooldown on normal use | 2–4 h  |
| 0.6 | Remove fabricated data and the fake "live" clock           | No hard-coded Fear & Greed/sector/NFT/mock prices; last-updated reflects the actual successful fetch                   | 2–3 h  |

**Exit gate:** build passes, no runtime console errors, API called once per refresh, no secrets in bundle.

---

## Phase 1 — Foundation and quality gates (1–2 days)

| #   | Task                                                                              | Acceptance criteria                                                          | Effort |
| --- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------ |
| 1.1 | Upgrade toolchain: Vite 8, Vitest 5, ESLint flat config, plugin-react 6           | Dev/build/test/lint work on Node 24; 0 vulnerabilities high/critical         | 4–6 h  |
| 1.2 | Establish source layout: `app/`, `features/`, `components/ui/`, `lib/`, `server/` | No business logic in page components; imports follow one direction           | 4 h    |
| 1.3 | Add query layer with caching, deduplication, abort, retry/backoff                 | No duplicate requests; previous data retained on refetch; 429 not retried    | 4 h    |
| 1.4 | Add real error boundaries, route error pages, toasts                              | A thrown component shows a recoverable boundary; failed request offers retry | 3 h    |
| 1.5 | Fix sorting/filtering to operate on a local snapshot                              | All sort options work; no API call on sort; URL reflects state               | 3 h    |
| 1.6 | Wire theme provider and toggle                                                    | Theme persists; system preference respected; chart colors adapt              | 2 h    |
| 1.7 | Remove dead/legacy files and duplicate hooks                                      | No unused entry points or missing CSS imports; one fetch implementation      | 2 h    |
| 1.8 | Green lint + first real tests (filters, formatters, key components)               | `npm run lint`, `npm test`, `npm run build` pass in CI                       | 4 h    |

**Exit gate:** quality gates green; core browsing flow regression-tested.

---

## Phase 2 — Secure API boundary and UX (3–5 days)

| #   | Task                                                                                       | Acceptance criteria                                                                                       | Effort |
| --- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------ |
| 2.1 | Add Node API server with provider proxies and shared TTL cache                             | Browser never sees provider keys; stale-while-revalidate; one upstream call per TTL regardless of clients | 1–2 d  |
| 2.2 | Add validation, rate limits, CSP/helmet, request IDs, structured logs                      | Invalid inputs rejected; 429 responses; security headers verified; no stack traces in prod                | 1 d    |
| 2.3 | Serve SPA from the Node server; Vite proxy in dev                                          | `npm run dev` starts client+server; deep links resolve; same-origin cookies                               | 0.5 d  |
| 2.4 | Route-level code splitting and image dimensions                                            | Chart chunk loads only on coin detail; CLS reduced; initial JS target < 200 KB gzip                       | 0.5 d  |
| 2.5 | UI/UX pass: page shell, market table, coin detail route, empty/error/loading states        | Responsive at 360/768/1440; keyboard navigable; no hidden focusable drawer                                | 1–2 d  |
| 2.6 | Accessibility pass: dialog semantics/focus trap, skip link, table roles, chart alternative | Automated axe check passes with no critical issues; manual keyboard walkthrough                           | 1 d    |
| 2.7 | SEO assets: favicon, OG/Twitter, robots, sitemap, per-route titles                         | Lighthouse SEO ≥ 90; no 404 assets                                                                        | 0.5 d  |

**Exit gate:** no provider keys client-side; security headers present; accessibility and performance budgets met.

---

## Phase 3 — Accounts, tenancy, and entitlements (4–6 days) — deferred by owner decision

| #   | Task                                                                               | Acceptance criteria                                                                                  | Effort |
| --- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------ |
| 3.1 | Database schema + migrations: users, sessions, workspaces, memberships, audit logs | Migrations run forward/back on a fresh DB; constraints enforced                                      | 1 d    |
| 3.2 | Auth: register, login, logout, session rotation, secure cookies, password hashing  | OWASP-aligned password storage (scrypt/argon2); cookies HttpOnly/Secure/SameSite; fixation prevented | 1–2 d  |
| 3.3 | RBAC + tenant isolation                                                            | Every query scoped by workspace; cross-tenant access tests fail closed                               | 1 d    |
| 3.4 | Email verification and password reset (provider-abstracted)                        | Tokens single-use and expiring; dev mailer; production mailer configured by env                      | 1 d    |
| 3.5 | Server-side watchlists, portfolios, alerts with plan limits                        | Data syncs across devices; free-tier limits enforced server-side; conflict handling                  | 1–2 d  |
| 3.6 | Account settings: profile, password change, active sessions, export/delete account | User can revoke sessions, export JSON, delete account with confirmation                              | 1 d    |
| 3.7 | Auth/tenancy test suite                                                            | Unit + API tests cover login, session, CSRF, role escalation, tenant isolation                       | 1 d    |

**Exit gate:** a user can register, verify, log in, save a watchlist, log in elsewhere and see it; cross-tenant access impossible.

---

## Phase 4 — SaaS product surface (3–5 days) — deferred by owner decision

| #   | Task                                                          | Acceptance criteria                                                                            | Effort |
| --- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------ |
| 4.1 | Free/Pro plan model and entitlements enforced in API + UI     | Limit errors clear and actionable; upgrading changes limits immediately after admin assignment | 1 d    |
| 4.2 | Admin console: users, workspaces, plan/status, audit trail    | Admin-only routes; actions audited; no secrets exposed                                         | 1–2 d  |
| 4.3 | Pricing page, upgrade intent flow, billing-ready abstractions | Pricing reflects actual entitlement matrix; no fake payment success                            | 1 d    |
| 4.4 | Onboarding, empty states, product analytics events            | New user reaches first watchlist add in < 2 minutes                                            | 1–2 d  |
| 4.5 | Email alerts and notification preferences                     | Alerts trigger server-side, deduplicated, opt-in, with unsubscribe                             | 1–2 d  |

**Exit gate:** plan limits are real and enforced; admin can support a customer without direct DB access.

---

## Phase 5 — Billing (3–5 days) — not applicable in this scope

| #   | Task                                                         | Acceptance criteria                                                          | Effort   |
| --- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- | -------- |
| 5.1 | Confirm prices, currency, tax, refund policy, trial          | Documented product decision                                                  | Business |
| 5.2 | Stripe products/prices, Checkout, Customer Portal            | Test-mode purchase upgrades workspace; cancellation downgrades at period end | 2–3 d    |
| 5.3 | Webhook handling with signature verification and idempotency | Replayed events safe; subscription state is webhook-driven                   | 1–2 d    |
| 5.4 | Invoices, dunning, failed-payment handling                   | Billing state visible to user and admin                                      | 1 d      |
| 5.5 | Entitlement reconciliation job                               | Plan state converges after missed events                                     | 0.5 d    |

**Not appropriate yet:** live payments without agreed pricing, tax handling, and a legal entity. Build the entitlement seam now, integrate Stripe in test mode when those decisions are made.

---

## Phase 6 — Operations, testing, deployment (2–4 days)

| #   | Task                                                              | Acceptance criteria                                                     | Effort |
| --- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- | ------ |
| 6.1 | CI: lint, unit, component, API, build, audit, secret scan         | Required checks block merge; artifacts retained                         | 0.5 d  |
| 6.2 | E2E: guest browse, signup, watchlist, plan limit, admin           | Playwright tests run headless in CI                                     | 1–2 d  |
| 6.3 | Docker multi-stage image + Compose for local prod-like run        | Image < 300 MB; healthcheck; non-root user; read-only FS                | 0.5 d  |
| 6.4 | Deployment config (target chosen by owner), HTTPS, env management | Staging deploy reproducible; secrets in platform store; backups enabled | 1 d    |
| 6.5 | Observability: error tracking, logs, uptime, alerting             | Errors include request ID; on-call alert path documented                | 0.5 d  |
| 6.6 | Docs: architecture, API, security, runbooks, README               | A new developer can run and deploy from docs                            | 1 d    |

**Exit gate:** staging deployment verified; rollback documented; recovery drill completed.

---

## Phase 7 — Scale and growth (post-launch)

- Postgres migration when write volume or multi-instance deployment requires it (SQLite is suitable for a single instance and early traffic).
- Redis-backed cache/rate limits for horizontal scaling.
- SSR/prerender for marketing and coin pages if organic acquisition matters.
- Background jobs for alerts (queue) instead of client polling.
- Portfolio performance history, currency/localization, CSV import, tax export.
- SOC2-ish controls, DPA, subprocessor list, penetration test.
- Mobile app or PWA with push notifications.

---

## Prioritized bug list (tracked)

### Done in this engagement

- **P0-2** fetch loop/flicker — TanStack Query caching, retry/backoff, stale snapshots.
- **P0-3/P0-4** client secret usage and HTML injection — server proxy, legacy `VITE_` fallback
  removed, HTML stripped, URLs validated.
- **P0-5** fabricated data — real endpoints with honest unavailable states.
- **P0-7** source maps — disabled; production build verified.
- **P0-8** dependency vulnerabilities — upgraded; `npm audit --omit=dev` = 0.
- **P0-9** quality gates — lint, 99 unit/API tests, Playwright, axe, build, CI.
- **P1** architecture, query layer, error boundaries, URL state, theme, dead code, caching,
  validation, rate limits, request IDs, security headers, responsive/accessible UI, SEO artifacts,
  deployment configs, docs.
- Additional defects: numeric watchlist IDs, null→0 numeric coercion, alert `triggeredPrice` null,
  inaccurate rate-limit headers, desktop menu-toggle cascade, and WCAG contrast/semantics issues.
- Project structure reorganized into `app / layouts / pages / components / features / hooks /
services / utils`; obsolete root scripts, backup source, stale notes, and generated artifacts
  archived under ignored `_legacy/`.

### Pending (owner / deployment)

- **P0-1** Rotate the historically exposed CryptoCompare key (code no longer contains it).
- Deploy to staging with approval; verify CSP/headers, deep links, API health, SEO artifacts.
- Confirm provider plans/licensing and traffic quotas.
- Add error tracking and uptime monitoring before public launch.
- Optional: shared Redis for global cache/rate limits when scaling past one instance.

### Deferred by decision

- Phases 3–5: accounts, multi-tenancy, plans, admin, billing. Revisit only if the product becomes a
  multi-user SaaS.

---

## Definition of done for the SaaS transformation

1. Every public endpoint is authenticated or intentionally public, rate-limited, validated, and tenant-scoped.
2. No secrets in the client; security headers and CSP enforced; dependency audit clean at high/critical.
3. Accounts, sessions, plans, and admin actions are covered by automated tests.
4. Browsing, charts, news, watchlist, portfolio, and alerts have loading/empty/error/stale states and are accessible.
5. CI gates enforce lint, tests, build, security checks; staging is reproducible; rollback and backups are documented.
6. Legal pages, data attribution, and financial disclaimers are published before charging money.
7. Real billing is live only after pricing/tax/refund decisions and a test-mode soak.
