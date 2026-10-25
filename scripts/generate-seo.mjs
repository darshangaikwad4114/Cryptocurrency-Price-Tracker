import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const INDEX = join(DIST, 'index.html');
const ROBOTS = join(DIST, 'robots.txt');
const SITEMAP = join(DIST, 'sitemap.xml');

const ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/markets', changefreq: 'daily', priority: '0.9' },
  { path: '/news', changefreq: 'daily', priority: '0.8' },
  { path: '/portfolio', changefreq: 'weekly', priority: '0.5' },
  { path: '/watchlist', changefreq: 'weekly', priority: '0.5' },
  { path: '/alerts', changefreq: 'weekly', priority: '0.5' },
  { path: '/about', changefreq: 'monthly', priority: '0.4' },
];

function loadEnvFile() {
  try {
    process.loadEnvFile(join(ROOT, '.env'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function resolveSiteUrl() {
  const raw = process.env.SITE_URL?.trim();
  if (!raw) return null;

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:') return null;
  if (parsed.username || parsed.password || parsed.search || parsed.hash) return null;
  if (['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) return null;
  if (!parsed.hostname.includes('.')) return null;

  const basePath = parsed.pathname.replace(/\/+$/, '');
  return `${parsed.origin}${basePath}`;
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function routeUrl(siteUrl, routePath) {
  if (routePath === '/') return `${siteUrl}/`;
  return `${siteUrl}${routePath}`;
}

function buildSitemap(siteUrl) {
  const today = new Date().toISOString().slice(0, 10);
  const entries = ROUTES.map(({ path, changefreq, priority }) => {
    const loc = escapeXml(routeUrl(siteUrl, path));
    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>',
    ].join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
}

function injectCanonical(html, siteUrl) {
  const home = escapeXml(routeUrl(siteUrl, '/'));
  const tags = [
    `    <link rel="canonical" href="${home}" />`,
    `    <meta property="og:url" content="${home}" />`,
  ].join('\n');

  if (html.includes('<!-- CANONICAL -->')) {
    return html.replace('<!-- CANONICAL -->', tags);
  }
  if (html.includes('</head>')) {
    return html.replace('</head>', `${tags}\n  </head>`);
  }
  return html;
}

function stripCanonicalPlaceholder(html) {
  return html.replace(/\s*<!-- CANONICAL -->/, '');
}

function writeRobots(siteUrl) {
  const fallback = 'User-agent: *\nAllow: /\n';
  const current = existsSync(ROBOTS) ? readFileSync(ROBOTS, 'utf8') : fallback;
  const sitemapLine = `Sitemap: ${routeUrl(siteUrl, '/')}sitemap.xml`;
  const withoutStale = current.replace(/^Sitemap:.*(?:\r?\n)?/gm, '').trimEnd();
  writeFileSync(ROBOTS, `${withoutStale}\n\n${sitemapLine}\n`, 'utf8');
}

function main() {
  loadEnvFile();

  if (!existsSync(INDEX)) {
    console.error('[seo] dist/index.html not found. Run this script after "vite build".');
    process.exitCode = 1;
    return;
  }

  const siteUrl = resolveSiteUrl();
  const html = readFileSync(INDEX, 'utf8');

  if (!siteUrl) {
    writeFileSync(INDEX, stripCanonicalPlaceholder(html), 'utf8');
    console.log('[seo] SITE_URL is not set to a valid public HTTPS URL; skipping sitemap and canonical tags.');
    return;
  }

  writeFileSync(INDEX, injectCanonical(html, siteUrl), 'utf8');
  writeFileSync(SITEMAP, buildSitemap(siteUrl), 'utf8');
  writeRobots(siteUrl);

  console.log(`[seo] Generated sitemap.xml and canonical tags for ${siteUrl}`);
}

main();
