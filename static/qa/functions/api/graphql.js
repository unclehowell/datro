// Lightweight GraphQL-style JSON API for the QA graph
// POST /api/graphql  { "query": "search", "q": "...", "limit": 20 }
// or   { "query": "qa", "id": "qa-..." }
// or   { "query": "parties" }
// or   { "query": "open", "limit": 30 }

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60', ...cors },
  });

async function loadQa(request, env) {
  const url = new URL('/api/qa.json', request.url);
  const res = env.ASSETS ? await env.ASSETS.fetch(url) : await fetch(url);
  const data = await res.json();
  return data.qa || [];
}

function slim(x) {
  return {
    id: x.id,
    party: x.party,
    party_name: x.party_name,
    asked: x.asked,
    answered: x.answered,
    kind: x.kind,
    pairing: x.pairing,
    ref: x.ref || '',
    asked_msg: x.asked_msg || '',
    answer_msg: x.answer_msg || '',
    question: x.question,
    answer: x.answer,
    url: x.url || '',
    refs: x.refs || [],
    years: x.years || [],
    case_questions: x.case_questions || [],
  };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestGet({ request }) {
  return json({
    schema: {
      queries: {
        search: { args: ['q', 'limit?'], returns: 'QA[]' },
        qa: { args: ['id'], returns: 'QA' },
        parties: { args: [], returns: 'PartyCount[]' },
        open: { args: ['limit?'], returns: 'QA[]' },
      },
      QA: [
        'id', 'party', 'party_name', 'asked', 'answered', 'kind', 'pairing',
        'ref', 'asked_msg', 'answer_msg', 'question', 'answer', 'url', 'refs', 'years', 'case_questions',
      ],
    },
    note: 'POST a JSON body: { "query": "search"|"qa"|"parties"|"open", ...args }',
    example: { query: 'search', q: 'WA231076', limit: 10 },
  });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ errors: [{ message: 'invalid JSON body' }] }, 400);
  }

  const op = body.query || body.operationName || '';
  const all = await loadQa(request, env);

  if (op === 'qa') {
    const id = body.id || body.variables?.id;
    const hit = all.find((x) => x.id === id);
    if (!hit) return json({ data: { qa: null }, errors: [{ message: 'not found' }] }, 404);
    return json({ data: { qa: slim(hit) } });
  }

  if (op === 'search') {
    const q = String(body.q || body.variables?.q || '').toLowerCase();
    const limit = Math.min(50, Math.max(1, Number(body.limit || body.variables?.limit) || 20));
    const ts = (q.match(/[\p{L}\p{N}][\p{L}\p{N}./'-]*/gu) || []).filter((t) => t.length > 1);
    const scored = all
      .map((x) => {
        const hay = (x.question + ' ' + x.answer + ' ' + x.party_name + ' ' + (x.ref || '')).toLowerCase();
        const s = ts.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);
        return [s, x];
      })
      .filter(([s]) => s > 0)
      .sort((a, b) => b[0] - a[0]);
    return json({ data: { search: scored.slice(0, limit).map(([, x]) => slim(x)) } });
  }

  if (op === 'parties') {
    const map = new Map();
    for (const x of all) {
      const k = x.party || 'unknown';
      const cur = map.get(k) || { party: k, party_name: x.party_name || k, count: 0 };
      cur.count += 1;
      map.set(k, cur);
    }
    return json({ data: { parties: [...map.values()].sort((a, b) => b.count - a.count) } });
  }

  if (op === 'open') {
    const limit = Math.min(100, Math.max(1, Number(body.limit || body.variables?.limit) || 30));
    const open = all
      .filter((x) => x.kind === 'unanswered' || x.kind === 'pending')
      .sort((a, b) => (b.asked || '').localeCompare(a.asked || ''));
    return json({ data: { open: open.slice(0, limit).map(slim) } });
  }

  return json({
    errors: [{ message: 'Unknown query. Use search | qa | parties | open' }],
  }, 400);
}
