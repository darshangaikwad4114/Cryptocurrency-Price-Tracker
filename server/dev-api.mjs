import http from 'node:http';
import { createApi } from '../api/_lib/core.js';

const port = Number(process.env.API_PORT ?? 3001);
const host = process.env.API_HOST ?? '127.0.0.1';
const api = createApi();

const hasNewsKey = Boolean(process.env.CRYPTOCOMPARE_API_KEY);

function clientIp(req) {
  return req.socket?.remoteAddress ?? 'unknown';
}

const server = http.createServer(async (req, res) => {
  const startedAt = Date.now();
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? `${host}:${port}`}`);

  if (!url.pathname.startsWith('/api/')) {
    res.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Not found.' } }));
    return;
  }

  const query = {};
  for (const [key, value] of url.searchParams) query[key] = value;

  try {
    const result = await api.handle({
      method: req.method,
      pathname: url.pathname,
      query,
      headers: req.headers,
      ip: clientIp(req),
    });
    res.statusCode = result.status;
    for (const [name, value] of Object.entries(result.headers)) res.setHeader(name, value);
    res.end(JSON.stringify(result.body));
    console.log(
      `${req.method} ${url.pathname}${url.search} -> ${result.status} ${result.headers['x-cache'] ?? ''} ${Date.now() - startedAt}ms`,
    );
  } catch (error) {
    res.writeHead(500, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    });
    res.end(
      JSON.stringify({
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
      }),
    );
    console.error('Dev API error:', error?.message);
  }
});

server.listen(port, host, () => {
  console.log(`Dev API listening on http://${host}:${port}`);
  console.log(`  News proxy: ${hasNewsKey ? 'configured' : 'NOT configured (news disabled)'}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Set API_PORT to use another port.`);
  } else {
    console.error('Dev API server error:', error.message);
  }
  process.exitCode = 1;
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
