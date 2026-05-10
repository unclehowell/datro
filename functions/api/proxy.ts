interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'register';
  const body = await request.json() as any;

  if (action === 'register') {
    const { childId, url: childUrl } = body;
    if (!childId || !childUrl) return json({ error: 'childId and url required' }, 400);

    await env.DB.prepare(
      'INSERT INTO child_proxies (id, url, last_seen, load) VALUES (?, ?, datetime("now"), 0) ON CONFLICT(id) DO UPDATE SET url=excluded.url, last_seen=datetime("now")'
    ).bind(childId, childUrl).run();

    return json({ ok: true });
  }

  if (action === 'heartbeat') {
    const { childId, load } = body;
    await env.DB.prepare(
      "UPDATE child_proxies SET last_seen = datetime('now'), load = ? WHERE id = ?"
    ).bind(load ?? 0, childId).run();
    return json({ ok: true });
  }

  return json({ error: 'Unknown action' }, 400);
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;
  const children = await env.DB.prepare(
    "SELECT id, url, load, last_seen FROM child_proxies WHERE last_seen > datetime('now', '-60 seconds')"
  ).all();
  return json(children.results);
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
