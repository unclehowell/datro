/**
 * FCG — serverless WP-shaped CMS on Cloudflare Workers + D1.
 * Not PHP WordPress. GraphQL API + minimal public HTML shell.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }

    if (url.pathname === "/graphql") {
      return cors(await handleGraphQL(request, env));
    }

    if (url.pathname === "/health") {
      return cors(json({ ok: true, service: "fcg-wp", env: env.ENVIRONMENT || "unknown" }));
    }

    // Minimal public shell — list published pages/posts from D1
    if (request.method === "GET") {
      return cors(await handleHtml(url, env));
    }

    return cors(json({ error: "Not found" }, 404));
  },
};

function cors(res) {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return new Response(res.body, { status: res.status, headers });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function handleHtml(url, env) {
  const title = env.SITE_TITLE || "FCG Edge CMS";
  const slug = url.pathname.replace(/^\/|\/$/g, "") || "";

  if (slug && slug !== "index.html") {
    const row = await env.DB.prepare(
      `SELECT id, title, slug, content, excerpt, status, post_type, date_gmt
       FROM posts WHERE slug = ? AND status = 'publish' LIMIT 1`
    )
      .bind(slug)
      .first();
    if (!row) {
      return new Response(htmlShell(title, `<h1>Not found</h1><p>No published content for <code>${escapeHtml(slug)}</code>.</p>`), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    const body = `<article><h1>${escapeHtml(row.title)}</h1><p class="meta">${escapeHtml(row.post_type)} · ${escapeHtml(row.date_gmt)}</p><div class="content">${row.content}</div></article>`;
    return new Response(htmlShell(row.title + " — " + title, body), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const { results } = await env.DB.prepare(
    `SELECT id, title, slug, excerpt, post_type, date_gmt FROM posts
     WHERE status = 'publish' ORDER BY date_gmt DESC LIMIT 50`
  ).all();

  const list = (results || [])
    .map(
      (r) =>
        `<li><a href="/${escapeHtml(r.slug)}"><strong>${escapeHtml(r.title)}</strong></a> <span class="meta">${escapeHtml(r.post_type)} · ${escapeHtml(r.date_gmt)}</span>${r.excerpt ? `<br><small>${escapeHtml(r.excerpt)}</small>` : ""}</li>`
    )
    .join("\n");

  const body = `
    <h1>${escapeHtml(title)}</h1>
    <p>Serverless WP-shaped edge CMS (Cloudflare Worker + D1 + GraphQL). Not PHP WordPress.</p>
    <p><a href="/graphql">GraphQL endpoint</a> · <a href="/health">Health</a> · upstream <code>${escapeHtml(env.WP_SOURCE_URL || "")}</code></p>
    <ul>${list || "<li>No published posts yet. Run schema.sql seed.</li>"}</ul>
  `;
  return new Response(htmlShell(title, body), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function htmlShell(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(title)}</title>
  <style>
    body{font-family:system-ui,sans-serif;max-width:42rem;margin:2rem auto;padding:0 1rem;line-height:1.5;color:#111}
    .meta{color:#666;font-size:.9rem}
    a{color:#0b57d0}
    code{background:#f2f2f2;padding:.1em .3em;border-radius:3px}
    .content img{max-width:100%}
  </style>
</head>
<body>${body}</body>
</html>`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """);
}

async function handleGraphQL(request, env) {
  if (request.method === "GET") {
    return new Response(playgroundHtml(), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  if (request.method !== "POST") {
    return json({ errors: [{ message: "Use POST for GraphQL" }] }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ errors: [{ message: "Invalid JSON" }] }, 400);
  }

  const query = body.query || "";
  const variables = body.variables || {};

  try {
    const data = await executeGraphQL(query, variables, env, request);
    return json({ data });
  } catch (e) {
    return json({ errors: [{ message: e.message || String(e) }] }, 400);
  }
}

/**
 * Minimal GraphQL executor for WP-shaped queries.
 * Supports:
 *   posts(status, first) { nodes { id title slug content excerpt date status postType } }
 *   page(slug) / post(slug) { id title slug content excerpt date status postType }
 *   createPost(input) — requires Authorization: Bearer ADMIN_TOKEN
 */
async function executeGraphQL(query, variables, env, request) {
  const q = query.replace(/\s+/g, " ");

  // createPost mutation
  if (/\bmutation\b/i.test(query) && /createPost\s*\(/.test(query)) {
    assertAdmin(request, env);
    const input = variables.input || extractInputObject(query) || {};
    const title = input.title || "Untitled";
    const slug = input.slug || slugify(title);
    const content = input.content || "";
    const excerpt = input.excerpt || "";
    const status = input.status || "draft";
    const postType = input.postType || input.post_type || "post";
    const author = input.author || "admin";
    const result = await env.DB.prepare(
      `INSERT INTO posts (title, slug, content, excerpt, status, post_type, author)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id, title, slug, content, excerpt, status, post_type, date_gmt`
    )
      .bind(title, slug, content, excerpt, status, postType, author)
      .first();
    return { createPost: mapRow(result) };
  }

  // page(slug: "...") or post(slug: "...")
  const single = q.match(/\b(page|post)\s*\(\s*slug\s*:\s*["']([^"']+)["']\s*\)/i);
  if (single) {
    const slug = single[2];
    const row = await env.DB.prepare(
      `SELECT id, title, slug, content, excerpt, status, post_type, date_gmt FROM posts WHERE slug = ? LIMIT 1`
    )
      .bind(slug)
      .first();
    const key = single[1].toLowerCase() === "page" ? "page" : "post";
    return { [key]: row ? mapRow(row) : null };
  }

  // posts(...) { nodes { ... } }
  if (/\bposts\s*\(/.test(q) || /\bposts\s*\{/.test(q)) {
    let status = "publish";
    const statusMatch = q.match(/status\s*:\s*(\w+)/i);
    if (statusMatch) status = statusMatch[1].toLowerCase();
    let first = 20;
    const firstMatch = q.match(/first\s*:\s*(\d+)/);
    if (firstMatch) first = Math.min(100, parseInt(firstMatch[1], 10));

    const { results } = await env.DB.prepare(
      `SELECT id, title, slug, content, excerpt, status, post_type, date_gmt FROM posts
       WHERE status = ? ORDER BY date_gmt DESC LIMIT ?`
    )
      .bind(status, first)
      .all();

    return { posts: { nodes: (results || []).map(mapRow) } };
  }

  // introspection-ish fallback
  if (/__schema|__typename/.test(q)) {
    return { __typename: "Query" };
  }

  throw new Error("Unsupported query. Use posts, page(slug), post(slug), or mutation createPost.");
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    title: row.title,
    slug: row.slug,
    content: row.content,
    excerpt: row.excerpt,
    status: row.status,
    postType: row.post_type,
    date: row.date_gmt,
  };
}

function assertAdmin(request, env) {
  const token = env.ADMIN_TOKEN;
  if (!token) throw new Error("ADMIN_TOKEN not configured");
  const auth = request.headers.get("Authorization") || "";
  if (auth !== `Bearer ${token}`) throw new Error("Unauthorized");
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "post";
}

function extractInputObject() {
  return null;
}

function playgroundHtml() {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>FCG GraphQL</title>
<style>body{font-family:system-ui;max-width:40rem;margin:2rem auto;padding:0 1rem}
textarea{width:100%;height:12rem;font-family:monospace} pre{background:#f4f4f4;padding:1rem;overflow:auto}</style>
</head><body>
<h1>FCG GraphQL</h1>
<p>POST JSON <code>{"query":"..."}</code> to this path. Example:</p>
<textarea id="q">query { posts(status: publish, first: 5) { nodes { id title slug date } } }</textarea>
<p><button id="go">Run</button></p>
<pre id="out"></pre>
<script>
document.getElementById('go').onclick = async () => {
  const query = document.getElementById('q').value;
  const r = await fetch('/graphql', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ query }) });
  document.getElementById('out').textContent = await r.text();
};
</script>
</body></html>`;
}
