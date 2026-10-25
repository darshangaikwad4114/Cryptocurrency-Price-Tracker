import { createApi } from '../../api/_lib/core.js';

const api = createApi();

export default async function handler(request) {
  try {
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams);
    const headers = Object.fromEntries(request.headers);
    const forwarded = headers['x-forwarded-for'];
    const ip =
      headers['x-nf-client-connection-ip'] ||
      (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'unknown');

    const result = await api.handle({
      method: request.method,
      pathname: url.pathname,
      query,
      headers,
      ip,
    });

    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: result.headers,
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'Netlify adapter failed',
        error: { name: error?.name, message: error?.message },
      }),
    );
    return new Response(
      JSON.stringify({
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
      },
    );
  }
}

export const config = { path: '/api/*' };
