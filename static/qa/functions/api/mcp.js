// WebMCP endpoint for agents — tools over the FOI Q&A graph
// GET /api/mcp  → tool catalogue (JSON-RPC style discovery)
// POST /api/mcp → { "method": "tools/call", "params": { "name": "...", "arguments": {...} } }

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type, authorization',
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...cors },
  });

const TOOLS = [
  {
    name: 'search_qa',
    description:
      'Search FOI/EIR questions and answers by keyword or natural language. Returns UID-keyed records with party, dates, kind, and message UIDs.',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Search query (refs, party names, free text)' },
        limit: { type: 'integer', description: 'Max results (default 20, max 50)' },
      },
      required: ['q'],
    },
  },
  {
    name: 'get_qa',
    description: 'Fetch a single Q&A record by its stable UID (qa-…).',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'QA UID, e.g. qa-559240cdf50d' },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_parties',
    description: 'List parties that appear in the correspondence graph with Q&A counts.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_open',
    description: 'List unanswered or pending questions (still open FOI asks).',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Max results (default 30)' },
      },
    },
  },
];

async function loadQa(request, env) {
  const url = new URL('/api/qa.json', request.url);
  const res = env.ASSETS ? await env.ASSETS.fetch(url) : await fetch(url);
  const data = await res.json();
  return data.qa || [];
}

function score(q, x) {
  const ts = (q.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}./'-]*/gu) || []).filter((t) => t.length > 1);
  const hay = (x.question + ' ' + x.answer + ' ' + x.party_name + ' ' + (x.ref || '') + ' ' + x.id).toLowerCase();
  return ts.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);
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
    question: (x.question || '').slice(0, 800),
    answer: (x.answer || '').slice(0, 1200),
    url: x.url || '',
    case_questions: x.case_questions || [],
    refs: x.refs || [],
  };
}

async function callTool(name, args, request, env) {
  const all = await loadQa(request, env);
  if (name === 'search_qa') {
    const q = String(args.q || '').trim();
    if (!q) return { error: 'q is required' };
    const limit = Math.min(50, Math.max(1, Number(args.limit) || 20));
    const scored = all
      .map((x) => [score(q, x), x])
      .filter(([s]) => s > 0)
      .sort((a, b) => b[0] - a[0] || +!a[1].answer - +!b[1].answer);
    return { count: scored.length, results: scored.slice(0, limit).map(([, x]) => slim(x)) };
  }
  if (name === 'get_qa') {
    const id = String(args.id || '').trim();
    const hit = all.find((x) => x.id === id);
    if (!hit) return { error: 'not_found', id };
    return slim(hit);
  }
  if (name === 'list_parties') {
    const map = new Map();
    for (const x of all) {
      const k = x.party || 'unknown';
      const cur = map.get(k) || { party: k, party_name: x.party_name || k, count: 0, open: 0 };
      cur.count += 1;
      if (x.kind === 'unanswered' || x.kind === 'pending') cur.open += 1;
      map.set(k, cur);
    }
    return { parties: [...map.values()].sort((a, b) => b.count - a.count) };
  }
  if (name === 'list_open') {
    const limit = Math.min(100, Math.max(1, Number(args.limit) || 30));
    const open = all
      .filter((x) => x.kind === 'unanswered' || x.kind === 'pending')
      .sort((a, b) => (b.asked || '').localeCompare(a.asked || ''));
    return { count: open.length, results: open.slice(0, limit).map(slim) };
  }
  return { error: 'unknown_tool', name };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestGet() {
  return json({
    protocol: 'webmcp',
    version: '0.1',
    name: 'qa-bucklerfamily-estate',
    description: 'FOI/EIR Questions & Answers graph for Great House Farm correspondence. All records carry stable UIDs.',
    tools: TOOLS,
    endpoints: {
      tools_list: 'GET /api/mcp',
      tools_call: 'POST /api/mcp',
      ask: 'GET /api/ask?q=',
      graphql: 'POST /api/graphql',
      dump: 'GET /api/qa.json',
    },
  });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const method = body.method || 'tools/call';
  if (method === 'tools/list' || method === 'initialize') {
    return json({ tools: TOOLS, protocol: 'webmcp', version: '0.1' });
  }

  const name = body.name || body.params?.name;
  const args = body.arguments || body.params?.arguments || body.params || {};
  if (!name) return json({ error: 'tool name required' }, 400);

  try {
    const result = await callTool(name, args, request, env);
    return json({
      ok: !result.error,
      tool: name,
      result,
    });
  } catch (e) {
    return json({ ok: false, tool: name, error: 'tool_failed' }, 500);
  }
}
