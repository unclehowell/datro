// CORS only — auth is handled per-route in api/[[path]].js
export async function onRequest(context) {
  const { request, next } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const response = await next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
}
