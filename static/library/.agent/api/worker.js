/**
 * DATRO Agent Library API
 * Cloudflare Worker - Complements existing document library
 * 
 * Endpoints:
 * - GET/POST /.agent/api/projects
 * - GET/PUT/DELETE /.agent/api/projects/:id
 * - GET/POST /.agent/api/change_requests
 * - GET/POST /.agent/api/interactions
 */

const DB_PATH = '/library/.agent/data/';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function getToken(request) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return null;
  }
  return auth.slice(7);
}

async function getFile(env, path) {
  try {
    const file = await env.DATRO_LIBRARY.get(path);
    return file ? await file.text() : null;
  } catch {
    return null;
  }
}

async function putFile(env, path, content) {
  await env.DATRO_LIBRARY.put(path, content);
}

function generateId() {
  return crypto.randomUUID();
}

async function handleProjects(env, method, pathParts, body, token) {
  if (!token) return json({ error: 'Unauthorized' }, 401);

  const projectsPath = DB_PATH + 'projects/index.json';
  let projects = [];

  const existing = await getFile(env, projectsPath);
  if (existing) {
    projects = JSON.parse(existing);
  }

  if (method === 'GET') {
    const id = pathParts[2];
    if (id) {
      const project = projects.find(p => p.id === id);
      if (!project) return json({ error: 'Not found' }, 404);
      return json(project);
    }
    return json(projects);
  }

  if (method === 'POST') {
    const project = {
      id: generateId(),
      ...body,
      client: 'unclehowell',
      status: body.status || 'planning',
      stage: body.stage || 'initiation',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };
    projects.push(project);
    await putFile(env, projectsPath, JSON.stringify(projects, null, 2));
    return json(project, 201);
  }

  if (method === 'PUT') {
    const id = pathParts[2];
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return json({ error: 'Not found' }, 404);
    projects[index] = { ...projects[index], ...body, updated: new Date().toISOString() };
    await putFile(env, projectsPath, JSON.stringify(projects, null, 2));
    return json(projects[index]);
  }

  if (method === 'DELETE') {
    const id = pathParts[2];
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return json({ error: 'Not found' }, 404);
    projects.splice(index, 1);
    await putFile(env, projectsPath, JSON.stringify(projects, null, 2));
    return json({ success: true });
  }

  return json({ error: 'Method not allowed' }, 405);
}

async function handleChangeRequests(env, method, pathParts, body, token) {
  if (!token) return json({ error: 'Unauthorized' }, 401);

  const crPath = DB_PATH + 'change_requests/index.json';
  let crs = [];

  const existing = await getFile(env, crPath);
  if (existing) {
    crs = JSON.parse(existing);
  }

  if (method === 'GET') {
    const id = pathParts[2];
    if (id) {
      if (pathParts[3] === 'approve') {
        const cr = crs.find(c => c.id === id);
        if (!cr) return json({ error: 'Not found' }, 404);
        cr.status = 'approved';
        cr.reviewed = new Date().toISOString();
        await putFile(env, crPath, JSON.stringify(crs, null, 2));
        return json(cr);
      }
      if (pathParts[3] === 'reject') {
        const cr = crs.find(c => c.id === id);
        if (!cr) return json({ error: 'Not found' }, 404);
        cr.status = 'rejected';
        cr.reviewed = new Date().toISOString();
        await putFile(env, crPath, JSON.stringify(crs, null, 2));
        return json(cr);
      }
      const cr = crs.find(c => c.id === id);
      if (!cr) return json({ error: 'Not found' }, 404);
      return json(cr);
    }
    return json(crs);
  }

  if (method === 'POST') {
    const cr = {
      id: generateId(),
      ...body,
      client: 'unclehowell',
      status: body.status || 'draft',
      requested: new Date().toISOString(),
    };
    crs.push(cr);
    await putFile(env, crPath, JSON.stringify(crs, null, 2));
    return json(cr, 201);
  }

  return json({ error: 'Method not allowed' }, 405);
}

async function handleInteractions(env, method, pathParts, body, token) {
  if (!token) return json({ error: 'Unauthorized' }, 401);

  const logPath = DB_PATH + 'interactions/index.json';
  let logs = [];

  const existing = await getFile(env, logPath);
  if (existing) {
    logs = JSON.parse(existing);
  }

  if (method === 'GET') {
    const id = pathParts[2];
    if (id) {
      const entry = logs.find(l => l.id === id);
      if (!entry) return json({ error: 'Not found' }, 404);
      return json(entry);
    }
    return json(logs);
  }

  if (method === 'POST') {
    const entry = {
      id: generateId(),
      ...body,
      timestamp: new Date().toISOString(),
      client: 'unclehowell',
    };
    logs.unshift(entry);
    await putFile(env, logPath, JSON.stringify(logs, null, 2));
    return json(entry, 201);
  }

  return json({ error: 'Method not allowed' }, 405);
}

async function handleAuth(env, method, body) {
  if (method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const { agent, secret } = body;

  const tokensPath = DB_PATH + '../tokens/index.json';
  const tokensData = await getFile(env, tokensPath);
  const tokens = tokensData ? JSON.parse(tokensData) : { tokens: {} };

  if (tokens.tokens[agent] && tokens.tokens[agent] === secret) {
    return json({ access_token: secret, token_type: 'bearer' });
  }

  return json({ error: 'Invalid credentials' }, 401);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/^\/\.agent\.api/, '').replace(/^\.agent\/api/, '') || '/';
      const pathParts = path.split('/').filter(Boolean);

      const token = getToken(request);
      let body = {};
      if (['POST', 'PUT'].includes(request.method)) {
        body = await request.json();
      }

      if (pathParts[0] === 'projects') {
        return handleProjects(env, request.method, pathParts, body, token);
      }
      if (pathParts[0] === 'change_requests') {
        return handleChangeRequests(env, request.method, pathParts, body, token);
      }
      if (pathParts[0] === 'interactions') {
        return handleInteractions(env, request.method, pathParts, body, token);
      }
      if (pathParts[0] === 'auth') {
        return handleAuth(env, request.method, body);
      }

      return json({ error: 'Not found' }, 404);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  },
};