const MEDIA_PREFIXES = ['/text/', '/images/', '/pdf/', '/video/'];

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  const isMedia = MEDIA_PREFIXES.some(p => path.startsWith(p));
  if (!isMedia || path.endsWith('/_treeview.json')) {
    return context.next();
  }

  const key = path.replace(/^\//, '');
  const object = await context.env.wayback_media.get(key);

  if (!object) {
    return context.next();
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  if (path.endsWith('.txt')) headers.set('content-type', 'text/plain; charset=utf-8');

  return new Response(object.body, { headers });
}
