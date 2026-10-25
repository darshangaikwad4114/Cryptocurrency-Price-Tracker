export function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress ?? 'unknown';
}

export async function handleNodeRequest(apiInstance, req, res) {
  let result;
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const query = {};
    for (const [key, value] of url.searchParams) query[key] = value;

    result = await apiInstance.handle({
      method: req.method,
      pathname: url.pathname,
      query,
      headers: req.headers,
      ip: clientIp(req),
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'API adapter failed',
        error: { name: error?.name, message: error?.message },
      }),
    );
    result = {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
      body: { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
    };
  }

  res.statusCode = result.status;
  for (const [name, value] of Object.entries(result.headers)) res.setHeader(name, value);
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  res.end(JSON.stringify(result.body));
}
