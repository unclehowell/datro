// GET /api/ask?q=...  — search the Great House Farm Q&A graph.
//
// Uses the Cloudflare D1 database bound as DB (bpvsbuckler-graph, loaded from
// api/graph.sql by the deploy workflow): full-text search over every question
// and answer and every email, then the graph neighbours of each hit (the scenes
// and case questions it bears on). If D1 is not bound or not yet loaded, it
// falls back to a plain search over the static /api/qa.json, so the page still
// works.

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300' },
  });

const terms = (q) =>
  (q.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}./'-]*/gu) || []).filter((t) => t.length > 1).slice(0, 8);

// FTS5 query: every term quoted (so references like WA231076 or 2026/4097b are safe)
const ftsQuery = (ts, op) => ts.map((t) => `"${t.replace(/"/g, '')}"`).join(` ${op} `);

async function fromD1(db, q) {
  const ts = terms(q);
  if (!ts.length) return { qa: [], messages: [] };
  let qa = [];
  for (const op of ['AND', 'OR']) {
    const r = await db
      .prepare(
        `SELECT qa.id, qa.party_name, qa.asked, qa.answered, qa.kind, qa.pairing, qa.url, qa.ref,
                substr(qa.question,1,400) AS question, substr(qa.answer,1,900) AS answer, qa.case_questions
           FROM qa_fts JOIN qa ON qa.id = qa_fts.id
          WHERE qa_fts MATCH ?1 ORDER BY (qa.answer = '' OR qa.kind = 'auto'), rank LIMIT 25`)
      .bind(ftsQuery(ts, op))
      .all();
    qa = r.results || [];
    if (qa.length) break;
  }
  const msgs = await db
    .prepare(
      `SELECT m.id, m.party, m.date, m.direction, m.subject, m.url,
              snippet(messages_fts, 2, '[', ']', ' … ', 24) AS snippet
         FROM messages_fts JOIN messages m ON m.id = messages_fts.id
        WHERE messages_fts MATCH ?1 ORDER BY rank LIMIT 15`)
    .bind(ftsQuery(ts, 'OR'))
    .all();
  if (qa.length) {
    const ids = qa.map((x) => 'qa:' + x.id);
    const ph = ids.map((_, i) => `?${i + 1}`).join(',');
    const e = await db.prepare(`SELECT src, dst FROM edges WHERE type = 'bears_on' AND src IN (${ph})`).bind(...ids).all();
    const by = {};
    for (const r of e.results || []) (by[r.src.slice(3)] ||= []).push(r.dst);
    for (const x of qa) {
      const n = by[x.id] || [];
      x.scenes = n.filter((d) => d.startsWith('scene:')).map((d) => d.slice(6));
      x.case_questions = n.filter((d) => d.startsWith('cq:')).map((d) => d.slice(3));
    }
  }
  return { qa, messages: msgs.results || [] };
}

async function fromStatic(request, env, q) {
  const url = new URL('/api/qa.json', request.url);
  const res = env.ASSETS ? await env.ASSETS.fetch(url) : await fetch(url);
  const data = await res.json();
  const ts = terms(q);
  const scored = [];
  for (const x of data.qa) {
    const hay = (x.question + ' ' + x.answer + ' ' + x.party_name).toLowerCase();
    const s = ts.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);
    if (s) scored.push([s, x]);
  }
  scored.sort((a, b) => (+!a[1].answer - +!b[1].answer) || b[0] - a[0] || (b[1].answered || '').localeCompare(a[1].answered || ''));
  const qa = scored.slice(0, 25).map(([, x]) => ({
    id: x.id, party_name: x.party_name, asked: x.asked, answered: x.answered, kind: x.kind, pairing: x.pairing,
    url: x.url, ref: x.ref, question: x.question.slice(0, 400), answer: x.answer.slice(0, 900),
    case_questions: x.case_questions,
  }));
  return { qa, messages: [] };
}

export async function onRequestGet({ request, env }) {
  const q = new URL(request.url).searchParams.get('q') || '';
  if (!q.trim()) return json({ error: 'Add ?q= with what you are looking for.' }, 400);
  if (env.DB) {
    try {
      const out = await fromD1(env.DB, q);
      return json({ q, source: 'd1', ...out });
    } catch (_e) {
      /* tables not loaded yet: fall through */
    }
  }
  return json({ q, source: 'static', ...(await fromStatic(request, env, q)) });
}
