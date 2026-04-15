export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const apiKey = url.searchParams.get('api_key');
  
  if (apiKey !== 'llmwiki-agent-key-unclehowell-2026') {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const path = context.params.path ? context.params.path.join('/') : '';
  
  if (!path) {
    // Return manifest
    const manifest = await env.ASSETS.fetch(new URL('/_archives_manifest.json', url.origin));
    return manifest;
  }
  
  // Return file
  const file = await env.ASSETS.fetch(new URL('/' + path, url.origin));
  return file;
}
