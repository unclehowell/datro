// GET /api/ask?q=...  — FTS search over the QA graph (D1 with static fallback)

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=120',
      'access-control-allow-origin': '*',
    },
  });

const terms = (q) =>
  (q.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}./'-]*/gu) || []).filter((t) => t.length > 1).slice(0, 8);

const ftsQuery = (ts, op) => ts.map((t) => `"${t.replace(/"/g, '')}"`).join(` ${op} `);

async function fromD1(db, q) {
  const ts = terms(q);
  if (!ts.length) return { qa: [], messages: [] };
  let qa = [];
  for (const op of ['AND', 'OR']) {
    const r = await db
      .prepare(
        `SELECT qa.id, qa.party_name, qa.asked, qa.answered, qa.kind, qa.pairing, qa.url, qa.ref,
                substr(qa.question,1,500) AS question, substr(qa.answer,1,1000) AS answer,
                qa.asked_msg, qa.answer_msg, qa.case_questions
           FROM qa_fts JOIN qa ON qa.id = qa_fts.id
          WHERE qa_fts MATCH ?1
          ORDER BY (qa.answer = '' OR qa.kind = 'auto'), rank
          LIMIT 40`
      )
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
        WHERE messages_fts MATCH ?1 ORDER BY rank LIMIT 15`
    )
    .bind(ftsQuery(ts, 'OR'))
    .all();
  return { qa, messages: msgs.results || [] };
}

async function fromStatic(request, env, q) {
  const url = new URL('/api/qa.json', request.url);
  const res = env.ASSETS ? await env.ASSETS.fetch(url) : await fetch(url);
  const data = await res.json();
  const ts = terms(q);
  const scored = [];
  for (const x of data.qa || []) {
    const hay = (x.question + ' ' + x.answer + ' ' + x.party_name + ' ' + (x.ref || '')).toLowerCase();
    const s = ts.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);
    if (s) scored.push([s, x]);
  }
  scored.sort(
    (a, b) =>
      +!a[1].answer - +!b[1].answer ||
      b[0] - a[0] ||
      (b[1].answered || '').localeCompare(a[1].answered || '')
  );
  const qa = scored.slice(0, 40).map(([, x]) => ({
    id: x.id,
    party_name: x.party_name,
    asked: x.asked,
    answered: x.answered,
    kind: x.kind,
    pairing: x.pairing,
    url: x.url,
    ref: x.ref,
    asked_msg: x.asked_msg,
    answer_msg: x.answer_msg,
    question: (x.question || '').slice(0, 500),
    answer: (x.answer || '').slice(0, 1000),
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
      /* fall through */
    }
  }
  return json({ q, source: 'static', ...(await fromStatic(request, env, q)) });
}
