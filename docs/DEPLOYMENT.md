# Deployment Guide

This project deploys as a static SPA plus serverless API functions. Configuration for both supported
platforms is committed:

- **Vercel:** [`vercel.json`](../vercel.json) + functions in [`api/`](../api)
- **Netlify:** [`netlify.toml`](../netlify.toml) + [`netlify/functions/api.mjs`](../netlify/functions/api.mjs)

No deployment is performed as part of development work. Staging and production releases require the
owner's explicit approval.

---

## 1. Prerequisites

1. A Node.js 22.12+ toolchain for local builds (the repo pins 22 in `.nvmrc`).
2. A CryptoCompare API key for news. **Rotate the key that was exposed in an earlier `VITE_` build
   before using it in production.**
3. Optional CoinGecko demo/pro key and plan (`demo` or `pro`).
4. A custom domain on HTTPS for production, so CSP/HSTS/notifications work as intended.

Never add secrets with a `VITE_` prefix. Vite exposes `VITE_*` values to the client bundle.

---

## 2. Environment variables

| Variable | Required | Scope | Notes |
|---|---|---|---|
| `CRYPTOCOMPARE_API_KEY` | For news | Production + preview | Server-only |
| `COINGECKO_API_KEY` | No | Production + preview | Server-only |
| `COINGECKO_PLAN` | No | Production + preview | `demo` (default) or `pro` |
| `SITE_URL` | Production | Build time | Public HTTPS origin for canonical/sitemap/robots |

`SITE_URL` rules: HTTPS, a dotted hostname, no credentials, query, or fragment. A trailing path is
allowed (for example a subdirectory deploy) and is normalized without a trailing slash. Localhost is
rejected; the build then skips canonical and sitemap generation instead of emitting invalid URLs.

Build-time example:

```bash
SITE_URL=https://crypto.example.com npm run build
```

---

## 3. Vercel

1. Import the Git repository into Vercel. The framework preset can stay **Vite**; `vercel.json`
   supplies `installCommand`, `buildCommand`, `outputDirectory`, rewrites, and headers.
2. Add the environment variables from section 2 for **Production** (and optionally **Preview**).
   Set `SITE_URL` to the production origin.
3. Deploy.
4. Verify:
   - `GET https://<domain>/api/health` returns `status: "ok"` and the expected `features`.
   - `GET https://<domain>/api/market?resource=coins&per_page=5` returns `{ data, meta }`.
   - `/markets` and a deep link such as `/coins/bitcoin` return the SPA (HTTP 200).
   - Response headers include CSP, HSTS, `X-Content-Type-Options: nosniff`, and
     `X-Frame-Options: DENY`.
   - `https://<domain>/robots.txt` and `https://<domain>/sitemap.xml` reference the production
     origin.
5. Set the production domain as the canonical domain and redeploy if `SITE_URL` changed.

**Rollback:** use Vercel's deployment history to promote the previous deployment. Builds are
immutable; no database migration is involved.

---

## 4. Netlify

1. Import the Git repository into Netlify. `netlify.toml` sets the build command, `dist` publish
   directory, and `netlify/functions` directory.
2. Add the environment variables from section 2.
3. Deploy.
4. Verify the same `/api/health`, deep-link, header, and SEO checks as for Vercel.
5. Netlify Functions v2 exposes the adapter at `/api/*` via `export const config = { path: '/api/*' }`.
   The SPA fallback (`/* → /index.html`) applies only to unmatched paths; function routes take
   precedence. Do not add an `/api/*` redirect to `/.netlify/functions/...`, which would change the
   pathname the API core parses.

**Rollback:** use Netlify's deploy history to publish a previous deploy.

---

## 5. Local production-like validation

```bash
npm ci
npm run build
npx vercel dev          # emulates Vercel functions + static output
# or
npx netlify dev         # emulates Netlify functions + redirects from netlify.toml
```

`npm run dev` runs the SPA (port 3000) and the local Node API (port 3001, proxied by Vite). This is
the normal development path. `npm run preview` serves only the static build and has no `/api`
endpoint.

Before deploying, scan the build output for secrets:

```bash
# Git Bash / macOS / Linux — does not print the key
KEY=$(grep '^CRYPTOCOMPARE_API_KEY=' .env | cut -d= -f2-)
grep -rlF "$KEY" dist || echo "No key found in dist"
```

Also confirm `dist/` contains no `.map` files.

---

## 6. Security headers

Both configurations send:

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'`; scripts/connects/fonts self; images limited to self, data, CoinGecko, and CryptoCompare hosts; inline styles allowed for React/Chart.js; `frame-ancestors 'none'`; `form-action 'self'`; `upgrade-insecure-requests` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Permissions-Policy` | camera, microphone, geolocation, payment, USB disabled |

**CSP changes:** all API calls are same-origin, fonts are bundled, and charts are local. Images come
from provider CDNs. If a provider adds a new image host, or you add analytics/fonts/embeds, update
the CSP in **both** `vercel.json` and `netlify.toml`, then redeploy.

`style-src 'unsafe-inline'` is present because the UI and charting layer set inline styles. Scripts
remain restricted to same-origin (`script-src 'self'`).

HSTS `includeSubDomains` assumes every subdomain supports HTTPS. If that is not true for your domain,
remove `includeSubDomains` before deploying.

---

## 7. Caching

| Path | Policy |
|---|---|
| `/assets/*` | `public, max-age=31536000, immutable` (hashed filenames) |
| `/index.html` | `public, max-age=0, must-revalidate` |
| `/theme-init.js` | `public, max-age=0, must-revalidate` (unhashed pre-paint script) |
| API data | `public, max-age=0, s-maxage=<resource TTL>, stale-while-revalidate=<stale window>` |

API TTLs are listed in [API.md](./API.md#cache-policy). The edge/CDN may serve API responses within
`s-maxage`; the function cache is per instance and provides stale fallback when upstream fails.

---

## 8. SEO

`npm run build` runs `scripts/generate-seo.mjs` after Vite:

- Injects `<link rel="canonical">` and `og:url` when `SITE_URL` is valid.
- Writes `dist/sitemap.xml` for the public routes.
- Adds the sitemap line to `dist/robots.txt`.
- When `SITE_URL` is absent/invalid, removes the canonical placeholder and skips the sitemap.

Set `SITE_URL` in the platform's build environment, not as a committed value. Rebuild after changing
the production domain.

Note: because this is a client-rendered SPA, per-route `<title>` and meta updates happen in the
browser. Static social crawlers see the home-page metadata from `index.html`. If per-coin SEO is a
goal, add prerendering/SSR in a later phase.

---

## 9. Known limitations

- **Per-instance cache and rate limit.** Serverless instances do not share memory. Cache hits and
  the 120 req/min IP limit are approximate under horizontal scaling. Use a shared store (Redis) if
  strict global limits are required.
- **Public data rates.** CoinGecko's free/demo tier and CryptoCompare plans have their own quotas.
  Confirm licensing and plan capacity before marketing the service.
- **No server-side persistence.** Watchlists, portfolios, and alerts are local to a browser profile.
  Clearing site data loses them; they do not sync across devices (by product decision).
- **Alerts require an open tab.** There is no background scheduler; desktop notifications work while
  the tab is open and permission is granted.
- **Deployment configs are not live-verified in this environment.** Headers and rewrites must be
  checked on the deployed domain with the verification steps above.
- **Key rotation is an owner action.** The current key must be rotated if it is the same key exposed
  historically via a `VITE_` build.

---

## 10. Cost planning

Ranges are indicative and must be verified against current provider pricing:

| Item | Typical option | Notes |
|---|---|---|
| Hosting | Vercel/Netlify Hobby or Pro | Static + functions; Pro plans are commonly ~$20/mo per member |
| Market data | CoinGecko paid/demo plan | Free tiers are rate-limited; commercial use needs a suitable plan |
| News | CryptoCompare plan | Required for `/api/news` |
| Domain/TLS | Registrar + platform TLS | ~$10–20/yr |
| Error tracking | Sentry free tier | Optional; not wired in yet |
| Shared cache/limits | Upstash Redis | Needed only when scaling beyond a single instance |
| Legal | Terms/privacy review | Required before monetization |

No billing, subscription, or payment surface is included by decision; see
[ROADMAP.md](./ROADMAP.md).

---

## 11. CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on pushes to `main` and pull requests:

1. `npm ci`, `npm run lint`, `npm test`, `npm run build` (uploads `dist`).
2. `npx playwright install --with-deps chromium` + `npm run test:e2e` (uploads reports on failure).

The E2E suite uses deterministic API mocks, so CI does not need provider keys or live network access
to market/news APIs. Configure branch protection to require both jobs before merging.
