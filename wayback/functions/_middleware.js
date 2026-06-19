/* R2 Media Proxy Middleware — project root */

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  const isMedia =
    path.startsWith('/text/') ||
    path.startsWith('/images/') ||
    path.startsWith('/pdf/') ||
    path.startsWith('/video/');

  if (!isMedia || path.endsWith('/_treeview.json')) {
    return context.next();
  }

  const key = decodeURIComponent(path.replace(/^\//, ''));
  const object = await context.env.wayback_media.get(key);

  if (!object) {
    return context.next();
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
}
