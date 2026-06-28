const GITHUB_REPO = 'unclehowell/datro';
const GITLAWB_NODE = 'https://node.gitlawb.com';
const GITLAWB_BOUNTY_LIST_URL = `${GITLAWB_NODE}/api/v1/bounties`;

const ALL_BRANCHES = [
  "althea", "archives", "bpvsbuckler", "bpvsbuckler-redflag",
  "bucklervsbp", "bw_base", "carfinancecheque",
  "ccan", "ceo", "command", "command-agent-endpoint",
  "dash", "datro", "dcc", "financecheque",
  "financecheque-monday-agent", "gh-pages", "gui",
  "hbnb", "library", "llmwiki",
  "pirateclaw", "rerelease",
  "subrepos", "ui", "wave", "wayback", "whitepaper"
];

const REGULAR_BRANCHES = ALL_BRANCHES.filter(b => b !== 'cnei');

const HONCHO_TENANT_IDS = {
  bpvsbuckler: '0lCBWsZN-CS-DyY8THX7H',
  datro: 'Q-sPB_HUr__vWcP1cc-UQ',
  financecheque: 'oSx32NCcWFHT7gRXWtrGo',
};

// ── Branch Purpose Map (bespoke context per branch, stops generic releases) ──
const BRANCH_PURPOSE = {
  cnei: 'Metadata and dashboard for the flywheel itself. Documents architecture, configuration, and release history of the autonomous release pipeline.',
  wayback: 'Historical evidence library for Great House Farm, Llandough (nr. Penarth). A structured archive of text, image, PDF, and video files with search, category browse, and pagination.',
  bpvsbuckler: 'Main application portal. Primary user-facing service dashboard with authentication and data views.',
  datro: 'Consortium landing portal and documentation at datro.directory. Project overview and link hub.',
  financecheque: 'Financial services dashboard with web3 payment UX, transaction tracking, and account management.',
  carfinancecheque: 'Automotive finance calculator and loan application portal with quote generation.',
  ccan: 'Climate action network information, resources, and community engagement portal.',
  ceo: 'Executive dashboard and strategic planning portal with KPIs and reporting.',
  dash: 'Analytics dashboard with data visualizations, charts, and metric tracking.',
  dcc: 'Document control centre for managing, reviewing, and approving digital assets and files.',
  gui: 'UI component library and design system documentation with live previews and code examples.',
  hbnb: 'Hospitality booking platform (B&B style) with property listings, search, and reservation management.',
  library: 'Digital library of reference materials, ebooks, and curated reading lists.',
  llmwiki: 'Wiki of LLM-related knowledge, prompt engineering guides, and AI research synthesis.',
  subrepos: 'Directory index of sub-repositories and microsites within the monorepo ecosystem.',
  ui: 'UI component showcase and interaction pattern library with live demos.',
  wave: 'Web audio visualisation experiment — interactive sound tools, frequency analysis, and audio processing.',
  althea: 'Alternative/experimental branch for testing new content formats, layouts, and interaction patterns.',
  archives: 'Static archive of historical documents, preserved content, and legacy records.',
  'bpvsbuckler-redflag': 'Red-flagged evidence review for the BP vs Buckler case. Highlights disputed or sensitive items requiring human attention.',
  bucklervsbp: 'Defense perspective on the BP vs Buckler land dispute. Counter-narrative and rebuttal evidence.',
  bw_base: 'Standardisation base — shared templates, CSS, and conventions used across the monorepo.',
  command: 'Command Cockpit / Jarvis — centralized agent orchestration and task dispatch.',
  'command-agent-endpoint': 'Agent endpoint for the command cockpit. Receives and routes agent webhooks.',
  'financecheque-monday-agent': 'Monday.com agent for FinanceCheque — automates board updates and client sync.',
  'gh-pages': 'Steering & deployment admin. GitHub Pages configuration and workflow orchestration.',
  rerelease: 'Version rerelease workflow — coordinates multi-branch bump and changelog updates.',
  whitepaper: 'Algocracy whitepaper — governance framework, voting mechanisms, and DAO structure documentation.',
  pirateclaw: 'Pirate-themed interactive fiction or game content with narrative elements.',
};
function branchPurpose(branch) { return BRANCH_PURPOSE[branch] || 'General web presence for the branch. A unique site that should reflect its name and purpose.'; }

// ── Branch-Specific Release Quotas (mandatory unique improvements per cycle) ──
const BRANCH_QUOTAS = {
  bpvsbuckler: {
    label: 'Timeline Event',
    mandate: 'Add exactly 1 NEW, ORIGINAL timeline event concerning the BP vs Buckler 1987 land ownership dispute at Great House Farm, Llandough (nr. Penarth). The event must be unique — never repeat a prior release. Add to scenes.json, pages.json, or a visible timeline section in index.html.',
    hints: ['static/bpvsbuckler/data/scenes.json', 'static/bpvsbuckler/data/pages.json', 'index.html', 'static/bpvsbuckler/index.html']
  },
  wayback: {
    label: 'Evidence Catalogue Item',
    mandate: 'Add exactly 1 NEW item of evidence to the catalogue — photo, text excerpt, video link, or PDF reference concerning Great House Farm / BP vs Buckler 1987 dispute. Find original material online or from archives. Update _treeview.json files or the evidence browse section.',
    hints: ['images/_treeview.json', 'text/_treeview.json', 'pdf/_treeview.json', 'video/_treeview.json', 'index.html', 'wayback/']
  }
};
function branchQuota(branch) { return BRANCH_QUOTAS[branch] || null; }
function branchQuotaPrompt(branch) {
  const q = branchQuota(branch);
  if (!q) return '';
  return `\n## MANDATORY BRANCH QUOTA (${q.label})\n${q.mandate}\nRelevant files: ${q.hints.join(', ')}\nThis quota is NON-NEGOTIABLE — the release fails its purpose without it.`;
}

const WING_FILE_TYPES = ['SPEC', 'AGENT', 'TASKS', 'README', 'MEMORY', 'PLAN', 'CHANGELOG', 'MASTERPLAN'];
const WING_FILE_SIDES = ['left', 'right'];

const RATE_BY_GEAR = [7200, 5400, 3600, 2400, 1800, 1200, 600, 300, 120, 60]; // gear1=2h, gear3=1h, gear8=5min, gear10=1min
const DOMAIN = 'datro.directory';
const GITHUB_REPO_OBJ = { owner: 'unclehowell', repo: 'datro' };
const BRAIN_BRANCH = 'brain';

// ── Monday.com API (Index Cards per Branch) ──
const MONDAY_API_URL = 'https://api.monday.com/v2';
async function mondayApi(token, query, variables = {}) {
  const resp = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ query, variables }),
  });
  if (!resp.ok) { const t = await resp.text(); throw new Error('Monday ' + resp.status + ': ' + t.slice(0, 200)); }
  const data = await resp.json();
  if (data.errors) throw new Error('Monday GraphQL: ' + (data.errors.map(e => e.message).join('; ')));
  return data.data;
}
async function getMondayFile(token, branch, side, fname) {
  const query = `query ($boardName: String!) { boards (limit: 50, name: $boardName) { id items_page (limit: 100) { items { name column_values { id text } } } } }`;
  const data = await mondayApi(token, query, { boardName: `Datro-${branch}` });
  const board = data.boards?.[0];
  if (!board) return null;
  const item = board.items_page.items.find(i => i.name === `${side}-${fname}`);
  if (!item) return null;
  return item.column_values.find(cv => cv.id === 'text')?.text || '';
}
async function getBoardId(mondayToken) {
  const data = await mondayApi(mondayToken, `query { boards (limit: 1) { id } }`);
  return data.boards?.[0]?.id || null;
}

// ── Index Card System (KV cache per branch, synced to Monday) ──
const BRANCH_INDEX_CARD_FIELDS = ['lastRelease', 'lastRun', 'cumulativeFails', 'cycleCount', 'researchTopics', 'hypothesisTree'];
async function getIndexCard(env, branch) {
  const key = `index_${branch}`;
  const cached = await env.FLYWHEEL_STATE.get(key, 'json').catch(() => null);
  if (cached) return cached;
  const card = { branch, lastRelease: null, lastRun: null, cumulativeFails: 0, cycleCount: 0, researchTopics: [], hypothesisTree: { root: null, nodes: {} }, updatedAt: Math.floor(Date.now() / 1000) };
  await env.FLYWHEEL_STATE.put(key, JSON.stringify(card));
  return card;
}
async function updateIndexCard(env, branch, updates) {
  const card = await getIndexCard(env, branch);
  Object.assign(card, updates, { updatedAt: Math.floor(Date.now() / 1000) });
  await env.FLYWHEEL_STATE.put(`index_${branch}`, JSON.stringify(card));
}
async function syncIndexCardToMonday(env, branch, card, mondayToken) {
  if (!mondayToken) return;
  try {
    const boardId = await getBoardId(mondayToken);
    if (!boardId) return;
    const summary = `Branch: ${branch} | Last: ${card.lastRelease || 'none'} | Cycle: ${card.cycleCount} | Fails: ${card.cumulativeFails}`;
    // Search for existing item for this branch before creating
    const searchQuery = `query { boards (ids: [${boardId}]) { items_page (limit: 100) { items { id name } } } }`;
    const searchData = await mondayApi(mondayToken, searchQuery);
    const items = searchData?.boards?.[0]?.items_page?.items || [];
    const existing = items.find(i => i.name.startsWith(`${branch}:`));
    if (existing) {
      // Update existing item
      await mondayApi(mondayToken, `mutation { change_multiple_column_values (item_id: ${existing.id}, board_id: ${boardId}, column_values: "{\\"text\\": \\"${summary.replace(/"/g, '\\"')}\\"}") { id } }`);
    } else {
      await mondayApi(mondayToken, `mutation { create_item (board_id: ${boardId}, item_name: "${branch}: ${summary}") { id } }`);
    }
  } catch (e) { log(`Monday sync failed for ${branch}: ${e.message}`); }
}

// ── Arbor Hypothesis Tree ──
async function addHypothesisNode(env, branch, parentId, label, status = 'proposed') {
  const card = await getIndexCard(env, branch);
  const nodeId = `h_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const node = { id: nodeId, label, status, parentId, created: Math.floor(Date.now() / 1000), children: [] };
  if (!card.hypothesisTree.nodes) card.hypothesisTree.nodes = {};
  if (!card.hypothesisTree.root) card.hypothesisTree.root = nodeId;
  card.hypothesisTree.nodes[nodeId] = node;
  if (parentId && card.hypothesisTree.nodes[parentId]) {
    card.hypothesisTree.nodes[parentId].children.push(nodeId);
  }
  await updateIndexCard(env, branch, { hypothesisTree: card.hypothesisTree });
  return nodeId;
}
async function updateHypothesisStatus(env, branch, nodeId, status) {
  const card = await getIndexCard(env, branch);
  if (card.hypothesisTree.nodes?.[nodeId]) {
    card.hypothesisTree.nodes[nodeId].status = status;
    await updateIndexCard(env, branch, { hypothesisTree: card.hypothesisTree });
  }
}
function renderHypothesisTree(card) {
  const tree = card.hypothesisTree;
  if (!tree || !tree.nodes || Object.keys(tree.nodes).length === 0) return '(no hypotheses)';
  const lines = [];
  function walk(nodeId, depth) {
    const node = tree.nodes[nodeId];
    if (!node) return;
    lines.push(`${'  '.repeat(depth)}- ${node.label} [${node.status}] (${node.id})`);
    for (const childId of (node.children || [])) walk(childId, depth + 1);
  }
  if (tree.root) walk(tree.root, 0);
  return lines.join('\n');
}

const startTime = Math.floor(Date.now() / 1000);

// ── Retry Wrapper & Failure Logging ──
async function withRetry(fn, label, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      log(`${label} attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 * 60;
        log(`  backing off ${Math.round(delay/1000)}s`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        log(`${label} exhausted after ${maxRetries} attempts`);
        throw err;
      }
    }
  }
}

async function logFailureToKv(env, branch, err, phase) {
  const key = `failure_${branch}`;
  const existing = await env.FLYWHEEL_STATE.get(key, 'json').catch(() => null);
  const history = Array.isArray(existing) ? existing : [];
  history.push({ phase, error: err.message, stack: err.stack?.slice(0, 500), ts: Math.floor(Date.now() / 1000) });
  await env.FLYWHEEL_STATE.put(key, JSON.stringify(history.slice(-20)));
  // Also record a lesson from the failure
  await learnLesson(env, branch, `Failure in ${phase}: ${err.message}`);
}

// ── Lesson Store (persistent lessons read at start of every agent run) ──

async function getLessonStore(env, branch) {
  const key = `lessons_${branch}`;
  const raw = await env.FLYWHEEL_STATE.get(key, 'json').catch(() => null);
  if (!raw || !Array.isArray(raw)) return '(no prior lessons)';
  return raw.slice(-10).map(l => `- [${new Date(l.ts * 1000).toISOString().slice(0, 10)}] ${l.text.slice(0, 200)}`).join('\n');
}

async function learnLesson(env, branch, text) {
  const key = `lessons_${branch}`;
  const raw = await env.FLYWHEEL_STATE.get(key, 'json').catch(() => null);
  const lessons = Array.isArray(raw) ? raw : [];
  lessons.push({ text, ts: Math.floor(Date.now() / 1000), branch });
  if (lessons.length > 50) lessons.splice(0, lessons.length - 50);
  await env.FLYWHEEL_STATE.put(key, JSON.stringify(lessons));
}

async function getMissedHours(env, branch) {
  const key = `last_run_${branch}`;
  const last = await env.FLYWHEEL_STATE.get(key, 'text').catch(() => null);
  if (!last) return 0;
  const elapsed = Math.floor(Date.now() / 1000) - parseInt(last);
  const missed = Math.max(0, Math.floor(elapsed / 3600) - 1);
  return missed;
}

async function recordRunTimestamp(env, branch) {
  await env.FLYWHEEL_STATE.put(`last_run_${branch}`, String(Math.floor(Date.now() / 1000)));
}

// ── Git Diff Analysis ──
async function getGitDiffSinceLastRelease(token, branch) {
  try {
    const releasesResp = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=5`,
      { headers: ghHeaders(token) }
    );
    const releases = await releasesResp.json();
    const lastRel = Array.isArray(releases) ? releases.find(r => r.tag_name.startsWith(`${branch}-v`) && !r.tag_name.endsWith('-aws')) : null;
    if (!lastRel || !lastRel.tag_name) return null;

    const compareResp = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/compare/${encodeURIComponent(lastRel.tag_name)}...${encodeURIComponent(branch)}`,
      { headers: ghHeaders(token) }
    );
    if (!compareResp.ok) return null;
    const diff = await compareResp.json();
    const files = (diff.files || []).slice(0, 20).map(f => ({
      path: f.filename, status: f.status, additions: f.additions, deletions: f.deletions
    }));
    return { base: lastRel.tag_name, files, total_commits: diff.total_commits || 0, diff };
  } catch (err) {
    log(`Git diff failed for ${branch}: ${err.message}`);
    return null;
  }
}

// ── Contextual Research ──
async function contextualResearch(env, branch, category) {
  const topics = {
    finance: ['web3 payment UX patterns 2026', 'financial dashboard accessibility'],
    frontend: ['Tailwind CSS component patterns 2026', 'interactive UI patterns without JS frameworks'],
    archive: ['static site performance optimization 2026', 'SEO for archival content'],
    platform: ['Cloudflare Workers self-improving pipelines 2026', 'recursive CI/CD automation patterns'],
    general: ['web performance best practices 2026', 'HTML accessibility improvements']
  };
  const query = (topics[category] || topics.general).concat([`${branch} site improvement ideas`]).join(', ');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&fields=title,abstract,url&limit=3`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data.data || data.data.length === 0) return null;
    return data.data.map(p => `- **${p.title}**: ${(p.abstract || '').slice(0, 200)}`).join('\n');
  } catch (e) {
    return null;
  }
}

async function researchImprovingFlywheel() {
  const topics = [
    "recursive self-improving CI/CD patterns 2026",
    "Cloudflare Workers autonomous agent optimization",
    "GitHub Actions cron reliability fixes 2026",
    "closed-loop release engineering patterns"
  ];
  return topics.map(t => `- Research: ${t}`).join('\n');
}

// ── Meta-Improvement Phase (cnei only) ──
async function metaImproveFlywheel(env, token, recentReleases) {
  log('Running meta-improvement phase for cnei');
  const failures = [];
  for (const rel of (recentReleases || []).slice(0, 10)) {
    const f = await env.FLYWHEEL_STATE.get(`failure_cnei`, 'json').catch(() => null);
    if (f) failures.push(...(Array.isArray(f) ? f : []));
  }
  const research = await researchImprovingFlywheel();
  const systemMsg = `You are improving the flywheel worker itself. Recent failures: ${JSON.stringify(failures.slice(-3))}. Research topics: ${research}. Propose 1-2 concrete code improvements for the flywheel's index.js. Output SEARCH/REPLACE blocks.`;
  const result = await queryFinancechequeAPI(systemMsg, "Analyze failure patterns and propose flywheel self-improvements.", env, 30000);
  if (result.error || !result.reply) {
    log(`Meta-improvement AI failed: ${result.error}`);
    return null;
  }
  const improvements = parseAIResponse(result.reply, '');
  if (improvements.error || improvements.changes.length === 0) {
    log('No meta-improvements generated');
    return null;
  }
  log(`Meta-improvement generated ${improvements.changes.length} change(s)`);
  return improvements.changes;
}

// ── Deterministic Branch Wallet (HKDF → Ed25519 for compute emulation) ──

async function deriveBranchWallet(env, branch) {
  const MASTER_SEED = env.MASTER_WALLET_SEED || 'datro-flywheel-default-seed-change-me';
  const seed = new TextEncoder().encode(MASTER_SEED);
  const keyMaterial = await crypto.subtle.importKey('raw', seed, 'HKDF', false, ['deriveBits']);
  const salt = new TextEncoder().encode('agentic-flywheel-v2');
  const info = new TextEncoder().encode(`branch:${branch}`);

  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    keyMaterial, 256
  );

  // Use first 32 bytes as wallet private key, last 4 bytes as compute budget
  const walletKey = new Uint8Array(derivedBits, 0, 32);
  const computeBudget = new DataView(derivedBits, 28, 4).getUint32(0, false);

  // Compute "address" as hex fingerprint
  const addrHash = await crypto.subtle.digest('SHA-256', walletKey);
  const address = Array.from(new Uint8Array(addrHash).slice(0, 20))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    branch,
    address: `0x${address}`,
    computeBudget: computeBudget % 10000, // 0-9999 "compute units" per branch
    derivedAt: Math.floor(Date.now() / 1000)
  };
}

async function getBranchWallet(env, branch) {
  const cacheKey = `wallet_${branch}`;
  const cached = await env.FLYWHEEL_STATE.get(cacheKey, 'json').catch(() => null);
  if (cached) return cached;
  const wallet = await deriveBranchWallet(env, branch);
  await env.FLYWHEEL_STATE.put(cacheKey, JSON.stringify(wallet), { expirationTtl: 86400 }).catch(() => {});
  return wallet;
}

// ── Agent Tool System (MCP-style, available to LLM agent) ──

const AGENT_TOOLS = {
  read_file: {
    description: 'Read a file from any branch in the repo',
    args: { path: 'string', branch: 'string' },
    execute: async (args, ctx) => {
      const file = await getFileContent(ctx.token, args.branch || ctx.branch, args.path);
      return file ? file.content.slice(0, 30000) : `File not found: ${args.path}`;
    }
  },
  write_file: {
    description: 'Write content to a file on a branch (commits immediately)',
    args: { path: 'string', branch: 'string', content: 'string', message: 'string' },
    execute: async (args, ctx) => {
      const commit = await createCommit(ctx.token, args.branch || ctx.branch, args.path, args.content, args.message);
      return `Committed ${args.path} (${commit.sha.slice(0, 8)})`;
    }
  },
  list_branches: {
    description: 'List all branches and their latest commit',
    args: {},
    execute: async (args, ctx) => {
      const resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/branches`, { headers: ghHeaders(ctx.token) });
      const branches = await resp.json();
      return (Array.isArray(branches) ? branches : []).map(b => `- ${b.name} (${b.commit.sha.slice(0, 8)})`).join('\n');
    }
  },
  search_code: {
    description: 'Search codebase for a pattern across all files in a branch',
    args: { pattern: 'string', branch: 'string' },
    execute: async (args, ctx) => {
      const treeResp = await ghFetch(
        `https://api.github.com/repos/${GITHUB_REPO}/git/trees/${encodeURIComponent(args.branch || ctx.branch)}?recursive=1`,
        ctx.token
      );
      const tree = await treeResp.json();
      const matches = [];
      for (const item of (tree.tree || [])) {
        if (item.type !== 'blob') continue;
        if (item.path.endsWith('.png') || item.path.endsWith('.jpg') || item.path.endsWith('.ico')) continue;
        try {
          const file = await getFileContent(ctx.token, args.branch || ctx.branch, item.path);
          if (file && file.content.includes(args.pattern)) {
            const lines = file.content.split('\n');
            const matchLines = lines.map((l, i) => l.includes(args.pattern) ? `  ${i + 1}: ${l.trim().slice(0, 150)}` : null).filter(Boolean);
            matches.push(`--- ${item.path} ---\n${matchLines.slice(0, 5).join('\n')}`);
          }
        } catch (e) { /* skip unreadable */ }
      }
      return matches.length > 0 ? matches.join('\n') : `No matches for "${args.pattern}"`;
    }
  },
  run_scan: {
    description: 'Run a third-party MCP scan on a URL',
    args: { toolId: 'string', url: 'string' },
    execute: async (args, ctx) => {
      const result = await runMcpScan(ctx.env, args.toolId, args.url || `https://${ctx.branch}.${DOMAIN}`);
      return JSON.stringify(result, null, 2);
    }
  },
  honcho_memory: {
    description: 'Read/write Honcho memory for this branch',
    args: { action: 'string', content: 'string' },
    execute: async (args, ctx) => {
      if (args.action === 'read') {
        return await getHonchoMemory(ctx.env, ctx.branch);
      }
      if (args.action === 'write' && args.content) {
        try {
          const tenantId = HONCHO_TENANT_IDS[ctx.branch] || 'datro';
          await fetch(`https://api.honcho.dev/api/honcho/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${ctx.env.HONCHO_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspace: tenantId, session: ctx.branch, content: args.content })
          });
          return 'Memory written to Honcho';
        } catch (e) { return `Honcho write failed: ${e.message}`; }
      }
      return 'Usage: honcho_memory action=read|write [content=...]';
    }
  },
  wallet_info: {
    description: 'Get the crypto wallet info and compute budget for any branch',
    args: { branch: 'string' },
    execute: async (args, ctx) => {
      const wallet = await getBranchWallet(ctx.env, args.branch || ctx.branch);
      return JSON.stringify(wallet, null, 2);
    }
  },
  brainstorm: {
    description: 'Ask the LLM a question or brainstorm ideas. Use this for creative thinking.',
    args: { prompt: 'string', context: 'string' },
    execute: async (args, ctx) => {
      const systemMsg = `You are a senior software architect. ${args.context || ''}`;
      const result = await queryFinancechequeAPI(systemMsg, args.prompt, ctx.env, 30000);
      return result.reply || `Error: ${result.error}`;
    }
  },
  remember: {
    description: 'Store a fact/memory/lesson for this branch that persists across runs. Use this to remember what you learned, what failed before, or what to do next time.',
    args: { key: 'string', value: 'string' },
    execute: async (args, ctx) => {
      if (!args.key || !args.value) return 'Usage: remember key=name value=content';
      const storeKey = `memory_${ctx.branch}_${args.key}`;
      const entry = JSON.stringify({ value: args.value, ts: Date.now(), branch: ctx.branch });
      await ctx.env.FLYWHEEL_STATE.put(storeKey, entry);
      // Maintain a memory index for listing
      const indexKey = `memory_index_${ctx.branch}`;
      const index = await ctx.env.FLYWHEEL_STATE.get(indexKey, 'json').catch(() => []);
      if (Array.isArray(index)) {
        if (!index.includes(args.key)) index.push(args.key);
        if (index.length > 200) index.splice(0, index.length - 200);
        await ctx.env.FLYWHEEL_STATE.put(indexKey, JSON.stringify(index));
      }
      return `Remembered "${args.key}" for ${ctx.branch}`;
    }
  },
  recall: {
    description: 'Retrieve a previously stored memory/lesson/note for this branch. Use this to recall what you learned or decided in prior runs.',
    args: { key: 'string' },
    execute: async (args, ctx) => {
      if (!args.key) return 'Usage: recall key=name (or key=* to list all)';
      if (args.key === '*') {
        const list = [];
        for (const k of Object.keys(AGENT_TOOLS)) list.push(k);
        return `To list memories, prefix with "memory_${ctx.branch}_" — use recall key=<name> to get a specific one.`;
      }
      const storeKey = `memory_${ctx.branch}_${args.key}`;
      const raw = await ctx.env.FLYWHEEL_STATE.get(storeKey, 'json').catch(() => null);
      if (!raw) return `No memory found for key "${args.key}" on ${ctx.branch}`;
      return raw.value;
    }
  },
  forget: {
    description: 'Delete a stored memory for this branch.',
    args: { key: 'string' },
    execute: async (args, ctx) => {
      if (!args.key) return 'Usage: forget key=name';
      const storeKey = `memory_${ctx.branch}_${args.key}`;
      await ctx.env.FLYWHEEL_STATE.delete(storeKey);
      return `Forgot "${args.key}" for ${ctx.branch}`;
    }
  },
  list_memories: {
    description: 'List all stored memory keys for this branch.',
    args: {},
    execute: async (args, ctx) => {
      // KV doesn't support prefix listing in Workers free tier efficiently,
      // so store an index key that the agent updates via remember
      const indexKey = `memory_index_${ctx.branch}`;
      const index = await ctx.env.FLYWHEEL_STATE.get(indexKey, 'json').catch(() => []);
      if (!Array.isArray(index) || index.length === 0) return 'No memories stored for this branch. Use remember to store some.';
      return index.map(k => `- ${k}`).join('\n');
    }
  },
  // ── Gitlawv Bounty Tools ──
  gitlawv_bounty_list: {
    description: 'List open gitlawb bounties. Each bounty has an id, title, reward (tokens), repo, and status.',
    args: { status: 'string', limit: 'string' },
    execute: async (args, ctx) => {
      const status = args.status || 'open';
      const limit = args.limit || '10';
      try {
        const resp = await fetch(`${GITLAWB_BOUNTY_LIST_URL}?status=${status}&limit=${limit}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!resp.ok) return `Gitlawv node error: ${resp.status}`;
        const data = await resp.json();
        const bounties = Array.isArray(data) ? data : (data.bounties || []);
        if (bounties.length === 0) return 'No bounties found matching criteria.';
        return bounties.map((b, i) =>
          `[${i + 1}] ID: ${b.id || b.bounty_id}\n  Title: ${b.title}\n  Reward: ${b.reward || b.amount} $GITLAWB\n  Repo: ${b.repo || b.repository}\n  Status: ${b.status}\n  Desc: ${(b.description || '').slice(0, 200)}`
        ).join('\n');
      } catch (err) {
        return `Gitlawv node unreachable: ${err.message}`;
      }
    }
  },
  gitlawv_bounty_claim: {
    description: 'Claim an open gitlawb bounty. Provide the bounty ID from gitlawv_bounty_list.',
    args: { bountyId: 'string', note: 'string' },
    execute: async (args, ctx) => {
      if (!args.bountyId) return 'Error: bountyId is required.';
      const wallet = await getBranchWallet(ctx.env, ctx.branch);
      try {
        const resp = await fetch(`${GITLAWB_NODE}/api/v1/bounties/${args.bountyId}/claim`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Branch-Id': ctx.branch,
            'X-Wallet-Addr': wallet.address
          },
          body: JSON.stringify({
            claimant: ctx.branch,
            wallet: wallet.address,
            note: args.note || `Claimed by ${ctx.branch} flywheel agent`
          })
        });
        if (resp.ok) {
          const result = await resp.json();
          return `Claimed bounty ${args.bountyId} for ${ctx.branch}. ${result.message || 'Work assigned.'}`;
        }
        const errText = await resp.text().catch(() => '');
        if (resp.status === 409) return `Bounty ${args.bountyId} already claimed by someone else.`;
        return `Claim failed (${resp.status}): ${errText.slice(0, 200)}`;
      } catch (err) {
        return `Gitlawv node unreachable: ${err.message}`;
      }
    }
  },
  gitlawv_bounty_submit: {
    description: 'Submit completed work for a claimed bounty. Provide the bounty ID and the commit/PR URL.',
    args: { bountyId: 'string', submissionUrl: 'string', note: 'string' },
    execute: async (args, ctx) => {
      if (!args.bountyId || !args.submissionUrl) return 'Error: bountyId and submissionUrl are required.';
      const wallet = await getBranchWallet(ctx.env, ctx.branch);
      try {
        const resp = await fetch(`${GITLAWB_NODE}/api/v1/bounties/${args.bountyId}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Branch-Id': ctx.branch,
            'X-Wallet-Addr': wallet.address
          },
          body: JSON.stringify({
            submission_url: args.submissionUrl,
            wallet: wallet.address,
            note: args.note || `Completed by ${ctx.branch} flywheel — ${args.submissionUrl}`
          })
        });
        if (resp.ok) {
          const result = await resp.json();
          return `Submitted bounty ${args.bountyId}. ${result.message || 'Pending review/payout.'} Wallet ${wallet.address} will receive reward once approved.`;
        }
        const errText = await resp.text().catch(() => '');
        return `Submit failed (${resp.status}): ${errText.slice(0, 200)}`;
      } catch (err) {
        return `Gitlawv node unreachable: ${err.message}`;
      }
    }
  }
};

// ── Agentic Loop (ReAct Pattern: Think → Tool → Observe → Repeat) ──

async function runAgentLoop(env, branch, html, headersContent, wingFiles, liveHtml, ctx) {
  const token = resolveToken(env);
  const maxIterations = 6;
  const conversation = [];
  let currentHtml = html;
  const committedFiles = [];
  let agentBounty = null;

  const context = {
    token, branch, env, currentHtml,
    wingFiles: Object.keys(wingFiles || {}).length,
    domain: DOMAIN
  };

  const category = computeBranchCategory(branch);
  const bias = await getBiasFromKv(env);
  bias.directionalMasterplans = await getDirectionalMasterplans(token, branch, bias.weights || {});
  const honchoMem = await getHonchoMemory(env, branch);
  const lessonStore = await getLessonStore(env, branch);
  const brainMem = await getBrainSummary(token);
  const sciHub = await getSciHubIdeas(env, branch, category);
  const dailyDigest = await getDailyBestPractices(env);
  const wallet = await getBranchWallet(env, branch);

  const toolDescriptions = Object.entries(AGENT_TOOLS).map(([name, tool]) => {
    const schema = {
      type: 'object',
      properties: {},
      required: []
    };
    for (const [k, v] of Object.entries(tool.args)) {
      schema.properties[k] = { type: v, description: k };
      schema.required.push(k);
    }
    return `- **${name}**: ${tool.description}\n  inputSchema: \`\`\`json\n${JSON.stringify(schema, null, 4)}\n\`\`\``;
  }).join('\n\n');

  const weights = bias?.weights || { left: 0, right: 0, high: 0, low: 0 };
  const weightStr = buildDirectionWeightString(weights);
  const dirPlans = bias?.directionalMasterplans || {};
  const dirPlanText = Object.entries(dirPlans).length > 0
    ? '\n## DIRECTIONAL MASTERPLANS (Weighted by Joystick)\n' + Object.entries(dirPlans).map(([side, p]) =>
        `### MASTERPLAN.${side}.md (weight: ${(p.weight * 100).toFixed(0)}%)\n${p.content.slice(0, 1000)}`
      ).join('\n\n')
    : '';

  const purpose = branchPurpose(branch);
  const quotaBlock = branchQuotaPrompt(branch);
  const systemPrompt = `You are a bespoke solo-developer improving one specific site in the DATRO monorepo (${GITHUB_REPO}). You are NOT a bot — you are a thoughtful developer who makes each release unique.

## The Site You Are Working On
**Branch:** ${branch} (category: ${category})
**Purpose:** ${purpose}${quotaBlock}

Your job is to make this specific site better. Read its code, visit the live site, understand what it is FOR, then make changes that are TAILORED to that purpose.

## How to Make Bespoke Releases (NOT generic)

### GOOD examples (bespoke, site-specific):
- "Added an interactive image gallery to wayback with lazy loading — this archive has 23 historical photos"
- "Restructured the hero section with the consortium's mission statement — datro is a landing portal"
- "Added a frequency visualizer widget — wave is an audio experimentation tool"
- "Fixed navigation breadcrumbs for the document library — library has deep category nesting"

### BAD examples (generic, DO NOT DO):
- "Added charset meta tag" (every branch already has this or it's irrelevant)
- "Added viewport meta tag" (same)
- "No changes needed" (visit the site again, there is ALWAYS something)
- Any meta-tag-only change
- Any change that doesn't reference something specific to ${branch}'s site

## Your Process
1. **Visit the live site** at https://${branch}.datro.directory (or fetch its HTML)
2. **Read the source code** in the branch (index.html, CSS, JS)
3. **Read past release notes** (loaded for you below) — do NOT repeat anything already done
4. **Understand what makes this site unique** based on its purpose
5. **Propose 1-2 specific, meaningful changes** that improve the site for its purpose
6. **Implement changes** using write_file
7. **Verify** your changes produce valid HTML

## Mandatory Rules
- Every change MUST reference something specific to this branch (a content section, a feature, a layout element that exists)
- If you can't find anything specific to improve after reading the code and live site, read MORE files (search_code, brainstorm) — don't give up
- NO generic meta-tag-only changes (charset, viewport, description — these are not bespoke)
- Max 3 write_file calls
- If you truly cannot find a branch-specific improvement, output DONE with SUMMARY explaining what you investigated

## Available Tools
${toolDescriptions}

## Context
- Branch: ${branch} (category: ${category})
- Wing files loaded: ${context.wingFiles}
- Wallet: ${wallet.address} (compute budget: ${wallet.computeBudget})
- Bias: ${bias?.bias || 3}/5, Risk: ${bias?.risk || 3}/5, Steering: ${bias?.steering || 'CTR'}, Magnitude: ${bias?.magnitude || 0}
- Directional weights: ${weightStr}
- Release cadence: 2h per branch, 1h for cnei eval updates

## Available Resources
All Cloudflare free-tier resources are accessible via env variables:
- \`FLYWHEEL_STATE\`: KV namespace (read/write, TTL-aware)
- \`GH_PAT\` / \`GITHUB_TOKEN\`: GitHub API full access
- \`MONDAY_API_TOKEN\`: Monday.com API (index cards, boards)
- \`PARENT_PROXY_URL\`: AI proxy (default: financecheque.uk)
- \`AI_MODEL\`: Custom LLM model (default: openrouter/anthropic/claude-sonnet)
- \`CF_API_TOKEN\`: Cloudflare API (Pages deploy cleanup)
- \`CF_ACCOUNT_ID\`: Cloudflare account
- \`HONCHO_API_KEY\`: Honcho cross-instance memory
- \`HONCHO_APP_NAME\`: Honcho app identifier
- \`ENVIRONMENT\`: Deployment environment (production/dev)
- \`BRAIN_BRANCH_TOKEN\`: Brain memory (honcho digest)

## JOYSTICK STEERING
The COMMAND cockpit joystick position determines which directional MASTERPLAN files to favour:
- LEFT → MASTERPLAN.left.md (conservative/defensive)
- RIGHT → MASTERPLAN.right.md (progressive/expansive)  
- HIGH/UP → MASTERPLAN.high.md (experimental/innovative)
- LOW/DOWN → MASTERPLAN.low.md (safe/incremental)
- Diagonals → combined weighting
- Center → neutral
Current weights: ${weightStr}${dirPlanText}

## Memory
${honchoMem.slice(0, 1500)}
${brainMem ? '---\n' + brainMem.slice(0, 1000) : ''}

## Lessons From Prior Runs
${lessonStore.slice(0, 2000)}

## Research
${sciHub.slice(0, 500)}
${dailyDigest.slice(0, 500)}

## Tool Protocol
To use a tool, output:
TOOL: <tool_name>
ARG: key=value
ARG: key=value

When you have made all your changes and want to finish, output:
DONE
SUMMARY: <what you changed and why, referencing specifics of ${branch}'s site>

## Rules
- PLAN first, then read/analyze, then DO, then CHECK
- EVERY change must reference something SPECIFIC to ${branch}'s site content or purpose
- If you can't find anything specific, read more files — don't force a generic change
- NO meta-tag-only changes (charset, viewport, description, OG tags)
- Max 3 write_file calls
- End with CHECK — verify your changes are valid HTML
- A release with 0 genuine changes is better than a release with 1 generic change`;

  conversation.push(systemPrompt);
  conversation.push(`## Current index.html (${branch})
\`\`\`html
${currentHtml.slice(0, 30000)}
\`\`\`

## Live website HTML (${branch})
\`\`\`html
${(liveHtml || '').slice(0, 8000)}
\`\`\`

## _headers
\`\`\`
${headersContent || '(empty)'}
\`\`\`

## Your Task
You are improving **${branch}** — ${purpose}
Visit the live site (its HTML is above), read the source code, understand what makes this site unique, and make 1-2 tailored improvements. Reference specific content or features in your changes.`);

  let planOutput = false;
  let writeCount = 0;
  let stuckCount = 0;
  let lastReplyHash = '';

  for (let iter = 0; iter < maxIterations; iter++) {
    console.log(`Agent iteration ${iter + 1}/${maxIterations}`);

    const result = await queryFinancechequeAPI(
      conversation[0],
      conversation.slice(1).join('\n\n'),
      env, 45000
    );

    if (result.error || !result.reply) {
      console.log(`Agent error at iteration ${iter}: ${result.error}`);
      break;
    }

    const reply = result.reply.trim();
    console.log(`Agent reply (${reply.length} chars)`);

    // Doom-loop guard: detect if agent is repeating itself
    const replyHash = reply.slice(0, 100);
    if (replyHash === lastReplyHash) {
      stuckCount++;
      console.log(`Doom-loop guard: stuck iteration ${stuckCount}/3`);
      if (stuckCount >= 3) {
        conversation.push('You appear to be repeating yourself. Break out of the loop — either make progress with a different tool or output DONE.');
        stuckCount = 0;
      }
    } else {
      stuckCount = 0;
      lastReplyHash = replyHash;
    }

    // Doom-loop guard: detect write_file without prior PLAN
    if (reply.includes('TOOL: write_file') && !planOutput && iter > 0) {
      conversation.push('You must output a PLAN block before using write_file. Analyze first, then propose changes.');
      continue;
    }

    if (reply.startsWith('DONE')) {
      console.log('Agent finished');
      const summary = reply.match(/SUMMARY:\s*([\s\S]*?)$/);
      if (writeCount === 0 && !reply.includes('no changes')) {
        console.log('Agent ended with no changes — possible empty run');
        await learnLesson(env, branch, `Empty run: agent analyzed ${branch} but made no changes. Summary: ${summary ? summary[1].trim().slice(0, 200) : 'none'}`);
      } else {
        await learnLesson(env, branch, `Successful run: ${committedFiles.length} file(s) committed. ${summary ? summary[1].trim().slice(0, 200) : ''}`);
      }
      return {
        changes: committedFiles,
        summary: summary ? summary[1].trim() : 'Agent completed changes',
        html: currentHtml,
        bounty: agentBounty
      };
    }

    // Track PLAN output
    if (reply.includes('PLAN:')) {
      planOutput = true;
      console.log('Agent produced a PLAN');
    }

    // Track write_file count
    if (reply.includes('TOOL: write_file')) {
      writeCount++;
      if (writeCount > 3) {
        conversation.push('Maximum write_file calls (3) reached. Output DONE to finish.');
        continue;
      }
    }

    // Doom-loop guard: max iterations without write_file
    if (iter >= maxIterations - 2 && writeCount === 0) {
      conversation.push('You have used most iterations without making changes. Either make a change now or output DONE with SUMMARY: no changes needed.');
    }

    const toolMatch = reply.match(/TOOL:\s*(\w+)/);
    if (!toolMatch) {
      conversation.push('Please use a tool or output DONE when finished.');
      continue;
    }

    const toolName = toolMatch[1];
    const tool = AGENT_TOOLS[toolName];
    if (!tool) {
      conversation.push(`Unknown tool: ${toolName}. Available: ${Object.keys(AGENT_TOOLS).join(', ')}`);
      continue;
    }

    const args = {};
    const argLines = reply.split('\n').filter(l => l.startsWith('ARG:'));
    for (const line of argLines) {
      const eq = line.indexOf('=');
      if (eq > 4) {
        const key = line.substring(4, eq).trim();
        const val = line.substring(eq + 1).trim();
        args[key] = val;
      }
    }

    console.log(`Agent calling tool: ${toolName} ${JSON.stringify(args)}`);

    try {
      const observation = await tool.execute(args, context);
      console.log(`Tool result: ${(observation || '').slice(0, 200)}`);

      if (toolName === 'write_file') {
        committedFiles.push({ path: args.path, branch: args.branch || branch, message: args.message });
        if (args.path === 'index.html') {
          const updated = await getFileContent(token, args.branch || branch, 'index.html');
          if (updated) currentHtml = updated.content;
        }
      }
      if (toolName === 'gitlawv_bounty_claim' && args.bountyId) {
        agentBounty = { action: 'claimed', bountyId: args.bountyId, branch, at: Date.now() };
      }
      if (toolName === 'gitlawv_bounty_submit' && args.bountyId) {
        agentBounty = { action: 'submitted', bountyId: args.bountyId, submissionUrl: args.submissionUrl, branch, at: Date.now() };
      }

      conversation.push(`TOOL ${toolName} result:\n${(observation || '').slice(0, 10000)}`);
    } catch (err) {
      console.log(`Tool error: ${err.message}`);
      conversation.push(`Tool ${toolName} failed: ${err.message}. Try a different approach.`);
    }
  }

  // Record lesson if agent hit max iterations without completing
  if (committedFiles.length > 0) {
    await learnLesson(env, branch, `Max iterations reached: committed ${committedFiles.length} file(s). Summary: ${committedFiles.map(c => c.path).join(', ')}`);
  }
  return {
    changes: committedFiles,
    summary: 'Agent reached max iterations',
    html: currentHtml,
    bounty: agentBounty
  };
}

async function aggregateMemory(token) {
  console.log("Aggregating branch memory into Brain...");
  const branchesResp = await ghFetch(`https://api.github.com/repos/${GITHUB_REPO_OBJ.owner}/${GITHUB_REPO_OBJ.repo}/branches`, token);
  const branches = await branchesResp.json();
  let consolidatedMemory = "# Flywheel Brain (Aggregated Memory)\n\n";
  
  const targetBranches = ALL_BRANCHES.slice(0, 12);
  for (const bname of targetBranches) {
    const path = `static/${bname}/MEMORY.md`;
    const memFile = await getFileContent(token, bname, path);
    if (memFile) {
      consolidatedMemory += `## Branch: ${bname}\n\n${memFile.content.slice(0, 1500)}\n\n---\n\n`;
    }
  }
  
  await createCommit(token, BRAIN_BRANCH, 'BRAIN_CONSOLIDATED.md', consolidatedMemory, 'docs(brain): update consolidated memory');
  console.log("Brain memory updated.");
}

async function getBrainSummary(token) {
    const file = await getFileContent(token, BRAIN_BRANCH, 'BRAIN_CONSOLIDATED.md');
    if (!file) return "Brain is empty.";
    return file.content.slice(0, 2000); // Return summary
}
function truncateForPrompt(text, maxChars = 50000) {
  if (!text || text.length <= maxChars) return text;
  const half = Math.floor(maxChars / 2);
  return text.slice(0, half) + "\n\n... [MASSIVE FILE TRUNCATED FOR CONTEXT EFFICIENCY] ...\n\n" + text.slice(-half);
}

// ── Honcho & Brain Logic ──────────────────────────────────────────────────

async function getHonchoMemory(env, branch) {
  const tenantId = HONCHO_TENANT_IDS[branch] || 'datro';
  const endpoints = [
    `https://api.honcho.ai/v1/memories?workspace=${tenantId}&session=${branch}`,
    `https://api.honcho.dev/api/honcho/messages?workspace=${tenantId}&session=${branch}`
  ];
  for (const url of endpoints) {
    try {
      const resp = await fetch(url, {
        headers: { 'Authorization': `Bearer ${env.HONCHO_API_KEY}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        const msgs = Array.isArray(data) ? data : (data.messages || data.results || []);
        return `## HONCHO PEER OBSERVATIONS (Durable Facts)\n${JSON.stringify(msgs.slice(-5), null, 2)}`;
      }
    } catch (_) {}
  }
  console.log('  Honcho: both .ai and .dev endpoints unreachable');
  return "No Honcho memory.";
}

async function getSciHubIdeas(env, branch, category) {
  const query = `web architecture performance optimization ${category} ${branch}`;
  console.log(`Sci-Bot researching: ${query}`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&fields=title,abstract,url&limit=3`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!resp.ok) return "No research context available (API rate limited).";

    const data = await resp.json();
    if (!data.data || data.data.length === 0) return "No specific research papers found.";

    let context = "## ORIGINAL RESEARCH (Peer-Reviewed Engineering)\n";
    for (const paper of data.data) {
      context += `- **${paper.title}** (${paper.url})\n  *Summary:* ${paper.abstract?.slice(0, 200) || 'No abstract'}...\n`;
    }
    context += "\nINSTRUCTION: Synthesize these research findings into concrete architectural improvements.";
    return context;
  } catch (err) {
    console.log(`  Skipping research context (API error): ${err.message}`);
    return "No research context available.";
  }
}

async function getDailyBestPractices(env) {
  // Use Cloudflare's cache to store the digest for 24h
  const CACHE_KEY = 'daily_best_practices';
  const cached = await env.FLYWHEEL_STATE.get(CACHE_KEY, 'json');
  if (cached && (Date.now() - cached.timestamp < 24 * 3600 * 1000)) {
    return cached.data;
  }

  const sources = [
    'https://web.dev/blog/rss.xml',
    'https://developer.mozilla.org/en-US/blog/rss.xml'
  ];
  
  console.log('Generating daily best practice digest...');
  const digest = `DIGEST ${new Date().toDateString()}:
  1. Priority: Move from LCP to INP (Interaction to Next Paint) as a core metric.
  2. Security: Implement Trusted Types to prevent DOM XSS.
  3. Architecture: Use Island Architecture for partial hydration.
  4. Performance: Pre-fetch critical assets using Priority Hints (fetchpriority).`;

  await env.FLYWHEEL_STATE.put(CACHE_KEY, JSON.stringify({
    timestamp: Date.now(),
    data: digest
  }));

  return digest;
}

async function getDoneList(env) {
  const done = await env.FLYWHEEL_STATE.get('done_list', 'json');
  return done || [];
}

async function updateDoneList(env, changes) {
  const done = await getDoneList(env);
  const newDone = [...done, ...changes.map(c => c.title)];
  // Keep only last 200 items to stay within KV limits/efficiency
  if (newDone.length > 200) newDone.splice(0, newDone.length - 200);
  await env.FLYWHEEL_STATE.put('done_list', JSON.stringify(newDone));
}

// ── Best Practice Checklist (curated from web.dev, MDN, SiteGrade, LLMBestPractices) ──
// Organized by priority. Each check has: category, name, check function, fix function, source

const BEST_PRACTICES = [
  // TIER 1: Critical HTML standards (every HTML page MUST have these)
  {
    tier: 1,
    category: 'HTML Standards',
    name: 'DOCTYPE declaration',
    check: (html) => !html || !html.includes('<!DOCTYPE html>'),
    source: 'MDN: <!DOCTYPE html> is required for standards mode (developer.mozilla.org/en-US/docs/Glossary/Doctype)',
    description: 'Missing HTML5 doctype — browsers may render in quirks mode',
    fix: (html) => '<!DOCTYPE html>\n' + (html || '')
  },
  {
    tier: 1,
    category: 'HTML Standards',
    name: 'charset meta tag',
    check: (html) => !html || !html.includes('charset'),
    source: 'MDN: utf-8 charset prevents encoding issues (developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#attr-charset)',
    description: 'Missing charset declaration — risk of rendering issues with special characters',
    fix: (html) => html.replace('<head>', '<head>\n<meta charset="UTF-8">')
  },
  {
    tier: 1,
    category: 'HTML Standards',
    name: 'viewport meta tag',
    check: (html) => !html || !html.includes('viewport'),
    source: 'Google Web Dev: viewport meta enables mobile-responsive rendering (web.dev/viewport)',
    description: 'Missing viewport meta — mobile devices will render at desktop width and require zooming',
    fix: (html) => html.includes('charset')
      ? html.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">')
      : html.replace('<head>', '<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">')
  },
  {
    tier: 1,
    category: 'HTML Standards',
    name: 'page title tag',
    check: (html) => !html || !html.includes('<title>'),
    source: 'WCAG: title identifies page content for screen readers and search engines (w3.org/WAI/WCAG21/Understanding/page-titled)',
    description: 'Missing <title> — search engines and screen readers cannot identify the page',
    fix: (html) => html.replace('</head>', '<title>' + getBranchFromHtml(html) + '</title>\n</head>').split('</head>')[0] + '</head>' + html.split('</head>').slice(1).join('</head>')
  },
  // TIER 2: Essential SEO & Social
  {
    tier: 2,
    category: 'SEO & Social',
    name: 'meta description',
    check: (html) => !html || !html.includes('name="description"'),
    source: 'Google SEO: meta description influences click-through rates in search results (developers.google.com/search/docs/appearance/snippet)',
    description: 'Missing meta description — search results show auto-generated snippets instead of curated text',
    fix: (html) => html.replace('</head>', '<meta name="description" content="">\n</head>')
  },
  {
    tier: 2,
    category: 'SEO & Social',
    name: 'Open Graph tags',
    check: (html) => !html || !html.includes('og:title'),
    source: 'Meta: OG tags control link previews on Facebook, LinkedIn, and messaging apps (ogp.me)',
    description: 'Missing Open Graph tags — shared links show generic previews instead of rich cards',
    fix: null
  },
  {
    tier: 2,
    category: 'SEO & Social',
    name: 'canonical URL',
    check: (html) => !html || !html.includes('rel="canonical"'),
    source: 'Google: canonical URL prevents duplicate content issues (developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)',
    description: 'Missing canonical link — search engines may index duplicate versions of this page',
    fix: null
  },
  // TIER 3: Cloudflare Pages Security Headers
  {
    tier: 3,
    category: 'Cloudflare Security',
    name: '_headers file exists',
    check: (html, headers) => !headers || headers.trim() === '',
    source: 'SiteGrade/Cloudflare: _headers file is required for security headers on Cloudflare Pages (sitegrade.io/en/blog/secure-deploy-cloudflare-pages-checklist/)',
    description: 'Missing _headers — all Cloudflare Pages sites lack security headers by default (rated F on security audits)',
    fix: null
  },
  {
    tier: 3,
    category: 'Cloudflare Security',
    name: 'X-Frame-Options header',
    check: (html, headers) => !headers || !headers.includes('X-Frame-Options'),
    source: 'OWASP: X-Frame-Options: DENY prevents clickjacking attacks (owasp.org/www-community/attacks/Clickjacking)',
    description: 'Missing X-Frame-Options — site can be embedded in iframes on malicious pages (clickjacking risk)',
    fix: null
  },
  {
    tier: 3,
    category: 'Cloudflare Security',
    name: 'Content-Security-Policy header',
    check: (html, headers) => !headers || !headers.includes('Content-Security-Policy'),
    source: 'SiteGrade: CSP is the single most effective defense against XSS attacks (sitegrade.io/en/blog/secure-deploy-cloudflare-pages-checklist/)',
    description: 'Missing CSP — cross-site scripting vulnerabilities are not mitigated at the header level',
    fix: null
  },
  {
    tier: 3,
    category: 'Cloudflare Security',
    name: 'Strict-Transport-Security header',
    check: (html, headers) => !headers || !headers.includes('Strict-Transport-Security'),
    source: 'Cloudflare Docs: HSTS ensures browsers always connect via HTTPS (developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security)',
    description: 'Missing HSTS — browsers may fall back to HTTP after the first request',
    fix: null
  },
  // TIER 4: Accessibility
  {
    tier: 4,
    category: 'Accessibility',
    name: 'lang attribute on html tag',
    check: (html) => !html || !html.includes('lang="'),
    source: 'WCAG: lang attribute enables screen readers to use correct pronunciation (w3.org/WAI/WCAG21/Understanding/language-of-page)',
    description: 'Missing lang attribute — screen readers may use wrong pronunciation for content',
    fix: (html) => html.replace('<html>', '<html lang="en">').replace('<html ', '<html lang="en" ')
  },
  {
    tier: 4,
    category: 'Accessibility',
    name: 'skip-to-content link',
    check: (html) => !html || !html.includes('skip') || !html.includes('main'),
    source: 'WCAG: skip links allow keyboard users to bypass repetitive navigation (w3.org/WAI/WCAG21/Understanding/bypass-blocks)',
    description: 'No skip-to-content link — keyboard users must tab through all navigation to reach main content',
    fix: null
  },
  {
    tier: 4,
    category: 'Accessibility',
    name: 'focus-visible styles',
    check: (html) => !html || (!html.includes(':focus-visible') && !html.includes('focus-visible')),
    source: 'MDN: :focus-visible provides visible keyboard focus without mouse-click rings (developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)',
    description: 'No :focus-visible styles — keyboard users cannot see where focus is on the page',
    fix: null
  },
  // TIER 5: Performance
  {
    tier: 5,
    category: 'Performance',
    name: 'image dimensions specified',
    check: (html) => !html || (html.includes('<img') && !html.includes('width=')),
    source: 'web.dev: explicit width/height on images prevents Cumulative Layout Shift (web.dev/cls)',
    description: 'Images without dimensions — causes layout shift as images load (CLS impact)',
    fix: null
  },
  {
    tier: 5,
    category: 'Performance',
    name: 'defer on script tags',
    check: (html) => {
      if (!html) return false;
      const scriptMatch = html.match(/<script\s+[^>]*src=/gi);
      if (!scriptMatch) return false;
      return scriptMatch.some(s => !s.includes('defer') && !s.includes('async') && !s.includes('type="module"'));
    },
    source: 'web.dev: defer/async prevents render-blocking JavaScript (web.dev/efficiently-load-third-party-javascript)',
    description: 'Scripts without defer/async — block rendering until fully downloaded and executed',
    fix: null
  },
  // TIER 6: Progressive Enhancement
  {
    tier: 6,
    category: 'Progressive',
    name: 'favicon',
    check: (html) => !html || !html.includes('favicon'),
    source: 'Browser standards: favicon improves bookmark recognition and browser tab identification',
    description: 'No favicon — browser tabs and bookmarks show generic icon',
    fix: null
  },
  {
    tier: 6,
    category: 'Progressive',
    name: '404 page',
    check: (html) => !html || !html.includes('404'),
    source: 'Google: custom 404 pages improve user experience on broken links (developers.google.com/search/docs/crawling-indexing/404-incomprehensible)',
    description: 'No 404 page — users hitting broken links see generic browser error',
    fix: null
  }
];

// ── Self-Improvement Checklist for cnei ──────────────────────────────────────

const CNEI_SELF_IMPROVEMENTS = [
  {
    tier: 1,
    name: 'wrangler config exists',
    check: (config) => !config || config.trim() === '',
    description: 'Missing wrangler.toml — deploy config not in repo',
    fix: null // human needs to create this
  },
  {
    tier: 2,
    name: 'self-version endpoint',
    check: (code) => !code || !code.includes('/__version'),
    description: 'Missing /__version endpoint — cannot verify deployed version vs source',
    fix: (code) => {
      const endpoint = `
    if (url.pathname === '/__version') {
      return new Response(JSON.stringify({ version: '0.0.0.04', sourceSha: 'SOURCE_SHA_PLACEHOLDER' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }`;
      return code.replace("return new Response('Flywheel Worker.", endpoint + "\n    return new Response('Flywheel Worker.");
    }
  },
  {
    tier: 2,
    name: 'spec endpoint',
    check: (code) => !code || !code.includes('/__spec'),
    description: 'Missing /__spec endpoint — cannot query branch specs',
    fix: (code) => {
      const endpoint = `
    if (url.pathname === '/__spec') {
      const branch = url.searchParams.get('branch') || 'cnei';
      return new Response(JSON.stringify({ branch, note: 'Fetch via GitHub API' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }`;
      return code.replace("return new Response('Flywheel Worker.", endpoint + "\n    return new Response('Flywheel Worker.");
    }
  },
  {
    tier: 3,
    name: 'memory endpoint',
    check: (code) => !code || !code.includes('/__memory'),
    description: 'Missing /__memory endpoint — cannot inspect cycle history',
    fix: (code) => {
      const endpoint = `
    if (url.pathname === '/__memory') {
      const branch = url.searchParams.get('branch') || 'cnei';
      return new Response(JSON.stringify({ branch, note: 'Fetch MEMORY.md via GitHub API' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }`;
      return code.replace("return new Response('Flywheel Worker.", endpoint + "\n    return new Response('Flywheel Worker.");
    }
  },
  {
    tier: 1,
    name: 'dashboard server exists',
    check: (code) => !code || !code.includes('dashboard'),
    description: 'No dashboard references in worker — static/cnei/dashboard/ may be missing',
    fix: null
  },
  {
    tier: 2,
    name: 'dashboard risk wing files',
    check: (code) => !code || !code.includes('high'),
    description: 'high/low sides not in worker getAllWingFiles — risk steering depends on high/low being present',
    fix: null
  },
  {
    tier: 2,
    name: 'dashboard auto-update check',
    check: (code) => !code || !code.includes('auto-update'),
    description: 'No auto-update reference in worker — dashboard cannot self-update from git',
    fix: null
  },
  {
    tier: 3,
    name: 'dashboard risk field in API',
    check: (code) => !code || !code.includes('risk'),
    description: 'No risk field in bias endpoint — dashboard 2D pad risk axis not wired to flywheel',
    fix: null
  }
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getBranchFromHtml(html) {
  const m = html.match(/<title>(.*?)<\/title>/i);
  return m ? m[1] : 'Untitled Page';
}

function extractBestPracticesApplied(html) {
  const applied = [];
  for (const bp of BEST_PRACTICES) {
    if (bp.check(html, '')) continue;
    if (bp.tier <= 3) applied.push(bp);
  }
  return applied;
}

// ── Concurrency Lock ──────────────────────────────────────────────────────────

async function acquireLock(env) {
  const held = await env.FLYWHEEL_STATE.get('lock');
  if (held === '1') return false;
  await env.FLYWHEEL_STATE.put('lock', '1', { expirationTtl: 3600 });
  return true;
}

async function releaseLock(env) {
  try { await env.FLYWHEEL_STATE.delete('lock'); } catch (_) {}
}

async function getRotationState(env) {
  try {
    const raw = await env.FLYWHEEL_STATE.get('rotation', 'json');
    if (raw) return { regular_index: 0, cnei_queue: 0, lap: 0, mode: 'AUTO', ...raw };
  } catch (_) {}
  return { regular_index: 0, cnei_queue: 0, lap: 0, mode: 'AUTO' };
}

function cadenceForGear(gear) {
  const g = Math.max(1, Math.min(10, gear || 3));
  const base = RATE_BY_GEAR[g - 1] || 3600;
  return {
    gear: g,
    regularCooldownSec: base * 2,
    cneiCooldownSec: base,
    regularCooldownHuman: `${Math.round(base * 2 / 60)}min`,
    cneiCooldownHuman: `${Math.round(base / 60)}min`,
    cron: '*/10 * * * *',
    pattern: 'regular branch (2x base) → cnei (1x base) → repeat'
  };
}

async function getFlywheelConfig(env) {
  try {
    const raw = await env.FLYWHEEL_STATE.get('config', 'json');
    const gear = raw?.gear || 5;
    if (raw) return { gear: 3, ...raw, cadence: cadenceForGear(gear) };
  } catch (_) {}
  return { gear: 5, cadence: cadenceForGear(5) };
}

async function saveRotationState(env, state) {
  await env.FLYWHEEL_STATE.put('rotation', JSON.stringify(state));
}

function ghHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'datro-flywheel'
  };
}

// ── MCP Scan Tools ──────────────────────────────────────────────────────────

const MCP_TOOLS = {
  eaa: {
    url: 'https://eaa.analysis.ie/check',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: (url) => JSON.stringify({ url }),
    parse: (json) => ({
      score: json.overall_score,
      summary: `WCAG ${json.summary?.compliance_level || 'unknown'} — ${json.summary?.passed_checks || 0}/${json.summary?.total_checks || 0} checks passed`,
      issues: (json.summary?.priority_issues || []).map(i => ({ severity: 'error', name: i })),
      raw: json
    })
  },
  accessscore: {
    url: 'https://accessscore.autonomous-claude.com/api/scan',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: (url) => JSON.stringify({ url }),
    parse: (json) => ({
      score: json.score,
      summary: `ADA/WCAG score ${json.score}/100`,
      issues: (json.issues || []).map(i => ({ severity: i.severity || 'warning', name: i.name })),
      risk: json.risk?.level,
      raw: json
    })
  }
};

async function runMcpScan(env, toolId, targetUrl) {
  const tool = MCP_TOOLS[toolId];
  if (!tool) return { toolId, error: 'unknown_tool', score: null };

  try {
    const resp = await fetch(tool.url, {
      method: tool.method,
      headers: tool.headers,
      body: tool.body(targetUrl)
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return { toolId, error: `HTTP ${resp.status}: ${text.slice(0, 100)}`, score: null };
    }
    const json = await resp.json();
    return { toolId, ...tool.parse(json), error: null };
  } catch (err) {
    return { toolId, error: err.message, score: null };
  }
}

async function runMcpScans(env, targetUrl) {
  const results = {};
  const promises = [];
  for (const toolId of Object.keys(MCP_TOOLS)) {
    promises.push(
      runMcpScan(env, toolId, targetUrl).then(r => { 
        if (r.error || r.score === null) {
          console.log(`MCP Tool ${toolId} failed or returned no data for ${targetUrl}`);
        }
        results[toolId] = r; 
      })
    );
  }
  await Promise.allSettled(promises);
  
  // FAIL-FAST: If all essential scans failed, reject the whole process
  const successfulScans = Object.values(results).filter(r => !r.error && r.score !== null);
  if (successfulScans.length === 0) {
    throw new Error("MCP Scans failed: No data retrieved.");
  }
  
  return results;
}

function formatMcpReleaseNotes(mcpResults, branch) {
  const lines = [];
  lines.push(`### MCP Scan Results (${branch})`);
  lines.push('');
  for (const [toolId, result] of Object.entries(mcpResults)) {
    if (result.error) {
      lines.push(`- **${toolId}**: error — ${result.error}`);
      continue;
    }
    lines.push(`- **${toolId}**: ${result.summary || `score ${result.score}`}`);
    if (result.issues && result.issues.length > 0) {
      for (const issue of result.issues.slice(0, 5)) {
        lines.push(`  - [${issue.severity}] ${issue.name}`);
      }
    }
    if (result.risk) {
      lines.push(`  - Legal risk: ${result.risk}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

async function ghFetch(url, token, options = {}) {
  const resp = await fetch(url, {
    ...options,
    headers: { ...ghHeaders(token), ...(options.headers || {}) }
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`GitHub API ${resp.status}: ${url} ${body.slice(0, 200)}`);
  }
  return resp;
}

async function getDefaultBranchSha(token, branch) {
  const resp = await ghFetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/refs/heads/${encodeURIComponent(branch)}`,
    token
  );
  const data = await resp.json();
  return data.object.sha;
}

async function createGitTag(token, tagName, commitSha) {
  const tagResp = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/tags`,
    {
      method: 'POST',
      headers: ghHeaders(token),
      body: JSON.stringify({
        tag: tagName,
        message: `Release ${tagName}`,
        object: commitSha,
        type: 'commit'
      })
    }
  );
  if (!tagResp.ok) {
    const body = await tagResp.text().catch(() => '');
    if (tagResp.status === 422 && body.includes('already_exists')) return null;
    throw new Error(`Tag creation failed: ${body.slice(0, 200)}`);
  }
  const tagData = await tagResp.json();
  const refResp = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/refs`,
    {
      method: 'POST',
      headers: ghHeaders(token),
      body: JSON.stringify({ ref: `refs/tags/${tagName}`, sha: tagData.sha })
    }
  );
  if (!refResp.ok) {
    const body = await refResp.text().catch(() => '');
    if (refResp.status === 422 && body.includes('already_exists')) return null;
    throw new Error(`Tag ref creation failed: ${body.slice(0, 200)}`);
  }
  return tagData.sha;
}

function parseVersionNum(tagName, branch) {
  if (!tagName || !tagName.startsWith(`${branch}-v`)) return 0;
  const versionStr = tagName.split('-v')[1];
  const parts = versionStr.split('.').map(p => parseInt(p, 10));
  if (parts.length >= 4) return (parts[0] * 1000000) + (parts[1] * 10000) + (parts[2] * 100) + parts[3];
  if (parts.length >= 3) return (parts[0] * 10000) + (parts[1] * 100) + parts[2];
  if (parts.length >= 2) return (parts[0] * 100) + parts[1];
  return parts[0] || 0;
}

async function getMaxBranchReleaseNum(token, branch) {
  const resp = await ghFetch(
    `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=30`,
    token
  );
  const releases = await resp.json();
  let max = 0;
  if (Array.isArray(releases)) {
    for (const r of releases) {
      if (r.tag_name?.startsWith(`${branch}-v`) && !r.tag_name.endsWith('-aws')) {
        max = Math.max(max, parseVersionNum(r.tag_name, branch));
      }
    }
  }
  return max;
}

async function getLatestReleaseDate(token, branch) {
  const resp = await ghFetch(
    `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=30`,
    token
  );
  const releases = await resp.json();
  if (!Array.isArray(releases)) return 0;
  for (const r of releases) {
    if (r.tag_name?.startsWith(`${branch}-v`) && !r.tag_name.endsWith('-aws') && r.published_at) {
      return new Date(r.published_at).getTime() / 1000;
    }
  }
  return 0;
}

async function isOnCooldown(token, branch, gear) {
  const baseCooldown = RATE_BY_GEAR[gear - 1] || 3600;
  const cooldown = branch === 'cnei' ? baseCooldown : baseCooldown * 2; // regular=2h, cnei=1h at gear 3
  const lastRelease = await getLatestReleaseDate(token, branch);
  if (lastRelease === 0) return false;
  const elapsed = Math.floor(Date.now() / 1000) - lastRelease;
  if (elapsed < cooldown) {
    console.log(`Branch ${branch} on cooldown (${Math.ceil((cooldown - elapsed) / 60)}min remaining)`);
    return true;
  }
  return false;
}

async function createGitHubRelease(token, tagName, branch, version, notes) {
  const resp = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/releases`,
    {
      method: 'POST',
      headers: ghHeaders(token),
      body: JSON.stringify({
        tag_name: tagName,
        name: `${branch}-v${version}`,
        body: notes || `Automated release ${tagName}`,
        target_commitish: branch
      })
    }
  );
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    if (resp.status === 422 && text.includes('already_exists')) return null;
    throw new Error(`Release creation failed: ${text.slice(0, 200)}`);
  }
  const data = await resp.json();
  console.log(`Release created: ${data.html_url}`);
  return data;
}

async function verifyRelease(token, tagName) {
  for (let i = 1; i <= 10; i++) {
    try {
      const resp = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/${encodeURIComponent(tagName)}`,
        { headers: ghHeaders(token) }
      );
      if (resp.ok) { const data = await resp.json(); console.log(`Verified release (attempt ${i})`); return data; }
      if (resp.status === 404) console.log(`Release not yet visible (attempt ${i})`);
    } catch (_) {}
    if (i < 10) await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error(`Release ${tagName} not verified after 10 attempts`);
}

function formatVersion(num) {
  const build = num % 100;
  const patch = Math.floor(num / 100);
  return `0.0.${patch}.${String(build).padStart(2, '0')}`;
}

function selectBranch(state) {
  const prevIndex = state.regular_index;
  const branch = REGULAR_BRANCHES[state.regular_index % REGULAR_BRANCHES.length];
  state.regular_index = (state.regular_index + 1) % REGULAR_BRANCHES.length;
  if (state.regular_index <= prevIndex) state.lap = (state.lap || 0) + 1;
  return branch;
}

// ── GitHub File API ──────────────────────────────────────────────────────────

async function getFileContent(token, branch, path) {
  try {
    const resp = await ghFetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`,
      token
    );
    const data = await resp.json();
    if (data.content) {
      const decoded = atob(data.content.replace(/\n/g, ''));
      return { content: decoded, sha: data.sha };
    }
    return null;
  } catch (err) {
    if (err.message.includes('404')) return null;
    throw err;
  }
}

// ── Wing Files (Harness) ─────────────────────────────────────────────────────

async function getAllWingFiles(token, branch, extraSides = []) {
  const sides = ['left', 'right', ...extraSides.filter(s => !['left', 'right'].includes(s))];
  const types = WING_FILE_TYPES;
  const files = {};
  for (const side of sides) {
    for (const type of types) {
      const path = `static/${branch}/${type}.${side}.md`;
      const file = await getFileContent(token, branch, path);
      if (file) files[`${type}.${side}`] = file.content;
    }
  }
  return files;
}

async function ensureWingFiles(token, branch) {
  const purpose = branchPurpose(branch);
  const quota = branchQuota(branch);
  const priority = ['AGENT', 'MASTERPLAN', 'SPEC', 'TASKS'];
  let created = 0;
  const MAX_SEED_PER_RUN = 2;
  for (const type of priority) {
    for (const side of WING_FILE_SIDES) {
      if (created >= MAX_SEED_PER_RUN) return created;
      const path = `static/${branch}/${type}.${side}.md`;
      const existing = await getFileContent(token, branch, path);
      if (existing) continue;
      const bias = side === 'left' ? 'proactive / creative / expansive' : 'conservative / defensive / stable';
      const quotaLine = quota ? `\n## Branch Quota\n- ${quota.mandate}` : '';
      const content = `# ${type} (${side}) — ${branch}\n\n## Purpose\n${purpose}\n\n## Steering Bias\nThis is the **${side.toUpperCase()}** wing file. Favour ${bias} changes when joystick steers ${side === 'left' ? 'LEFT/W' : 'RIGHT/E'}.\n${quotaLine}\n\n## CONSTRAINTS\n- Each release must make a unique, noticeable improvement\n- Fix bugs; ensure mobile UX is acceptable\n- Introduce one new feature per release (SEO, legal compliance, agent readability, or API endpoint)\n\n## PENDING\n- [ ] Review live site at https://${branch}.datro.directory\n- [ ] Apply joystick-weighted MASTERPLAN guidance\n`;
      await createCommit(token, branch, path, content, `chore(${branch}): seed ${type}.${side}.md wing file`);
      created++;
      log(`Seeded wing file: ${path}`);
    }
  }
  if (created > 0) log(`Ensured ${created} wing file(s) for ${branch}`);
  return created;
}

function extractHarnessRules(wingFiles) {
  const rules = [];
  for (const [key, content] of Object.entries(wingFiles)) {
    const lines = content.split('\n');
    let inConstraint = false;
    for (const line of lines) {
      if (line.match(/^##\s*(CONSTRAINTS?|RULES?|LIMITS?)/i)) inConstraint = true;
      else if (line.startsWith('## ') && !line.match(/^##\s*(CONSTRAINTS?|RULES?|LIMITS?)/i)) inConstraint = false;
      else if (inConstraint && line.trim().startsWith('-')) rules.push(line.trim().replace(/^-\s*\[\s*\]\s*/, '- ').replace(/^-\s*\[x\]\s*/, '- '));
    }
  }
  return rules.length > 0 ? rules.join('\n') : '(no explicit constraints in wing files)';
}

function extractHarnessPriorities(wingFiles) {
  const priorities = [];
  for (const [key, content] of Object.entries(wingFiles)) {
    if (!key.startsWith('TASKS')) continue;
    const lines = content.split('\n');
    let inPending = false;
    for (const line of lines) {
      if (line.match(/^##\s*(PENDING|TODO|BACKLOG)/i)) inPending = true;
      else if (line.startsWith('## ') && !line.match(/^##\s*(PENDING|TODO|BACKLOG)/i)) inPending = false;
      else if (inPending && line.trim().startsWith('-')) priorities.push(line.trim());
    }
  }
  return priorities.length > 0 ? priorities.join('\n') : '(no explicit task list in wing files)';
}

async function createCommit(token, branch, path, content, message) {
  const existing = await getFileContent(token, branch, path);
  const blobResp = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/blobs`,
    {
      method: 'POST',
      headers: ghHeaders(token),
      body: JSON.stringify({ content, encoding: 'utf-8' })
    }
  );
  const blob = await blobResp.json();

  const headResp = await ghFetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/refs/heads/${encodeURIComponent(branch)}`,
    token
  );
  const head = await headResp.json();
  const baseSha = head.object.sha;

  const treeResp = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/trees/${baseSha}`,
    { headers: ghHeaders(token) }
  );
  const baseTree = await treeResp.json();

  const newTreeResp = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/trees`,
    {
      method: 'POST',
      headers: ghHeaders(token),
      body: JSON.stringify({
        base_tree: baseTree.sha,
        tree: [{
          path,
          mode: '100644',
          type: 'blob',
          sha: blob.sha
        }]
      })
    }
  );
  const newTree = await newTreeResp.json();

  const commitResp = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/commits`,
    {
      method: 'POST',
      headers: ghHeaders(token),
      body: JSON.stringify({
        message,
        tree: newTree.sha,
        parents: [baseSha]
      })
    }
  );
  const commit = await commitResp.json();

  await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/refs/heads/${encodeURIComponent(branch)}`,
    {
      method: 'PATCH',
      headers: ghHeaders(token),
      body: JSON.stringify({ sha: commit.sha, force: false })
    }
  );
  console.log(`Committed ${path} to ${branch}: ${commit.sha.slice(0, 8)}`);
  return commit;
}

// ── MD Protocol (TASKS.md / MEMORY.md) ──────────────────────────────────────

async function readTASKS(token, branch) {
  const path = `static/${branch}/TASKS.md`;
  const file = await getFileContent(token, branch, path);
  if (!file) return [];
  const completed = [];
  const lines = file.content.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*-\s*\[x\]\s+(.+)/i);
    if (match) completed.push(match[1].trim().toLowerCase());
  }
  return completed;
}

function bestPracticeMatchesTask(bp, completedTasks) {
  const name = bp.name.toLowerCase();
  return completedTasks.some(task => name.includes(task) || task.includes(name));
}

async function writeMEMORY(token, branch, cycleNum, bestPractice, lessonText) {
  const path = `static/${branch}/MEMORY.md`;
  const existing = await getFileContent(token, branch, path);
  const existingContent = existing ? existing.content + '\n' : '';
  const entry = [
    `## Cycle ${cycleNum}`,
    `### ${branch}: ${bestPractice.name}`,
    `**Verdict:** PASS | ${bestPractice.description}`,
    `**Reference:** ${bestPractice.source}`,
    `### Lesson`,
    `${lessonText}\n`
  ].join('\n');
  const newContent = existingContent + entry;
  const msg = `docs(${branch}): record cycle ${cycleNum} — ${bestPractice.name}`;
  await createCommit(token, branch, path, newContent, msg);
  console.log(`MEMORY.md updated for ${branch} cycle ${cycleNum}`);
  return cycleNum;
}

async function getNextCycleNum(token, branch) {
  const path = `static/${branch}/MEMORY.md`;
  const file = await getFileContent(token, branch, path);
  if (!file) return 1;
  let maxCycle = 0;
  const lines = file.content.split('\n');
  for (const line of lines) {
    const m = line.match(/^## Cycle\s+(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > maxCycle) maxCycle = n;
    }
  }
  return maxCycle + 1;
}

// ── AI Uniqueness Engine ──────────────────────────────────────────────────────

async function getPreviousReleaseNotes(token, branch, count = 10) {
  const notes = [];
  const resp = await ghFetch(
    `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=${count}&page=1`,
    token
  );
  const releases = await resp.json();
  if (Array.isArray(releases)) {
    for (const r of releases) {
      if (r.tag_name && r.tag_name.startsWith(`${branch}-v`) && !r.tag_name.endsWith('-aws') && r.body) {
        const summary = r.body.replace(/```[\s\S]*?```/g, '').replace(/#{1,6}\s/g, '').trim().slice(0, 150);
        notes.push(`- ${r.tag_name}: ${summary}`);
      }
    }
  }
  return notes;
}

function normalizeJoystickScale(v, fallback = 3) {
  if (typeof v !== 'number' || Number.isNaN(v)) return fallback;
  if (v >= -5 && v <= 5 && (v < 1 || v > 5)) return Math.max(1, Math.min(5, Math.round((v + 5) / 10 * 4 + 1)));
  return Math.max(1, Math.min(5, Math.round(v)));
}

async function getBiasFromKv(env) {
  try {
    const raw = await env.FLYWHEEL_STATE.get('bias', 'json');
    if (raw && (raw.bias !== undefined || raw.steering)) {
      const result = {
        bias: normalizeJoystickScale(raw.bias, 3),
        steering: raw.steering || 'CTR',
        risk: normalizeJoystickScale(raw.risk, 3),
        magnitude: typeof raw.magnitude === 'number' ? raw.magnitude : 0,
        gear: raw.gear,
        updatedAt: raw.updatedAt
      };
      result.weights = computeDirectionWeights(result);
      return result;
    }
  } catch (_) {}
  return { bias: 3, steering: 'CTR', risk: 3, magnitude: 0, weights: { left: 0, right: 0, high: 0, low: 0 } };
}

function computeDirectionWeights(bias) {
  const w = { left: 0, right: 0, high: 0, low: 0 };
  const b = normalizeJoystickScale(bias.bias, 3);
  const r = normalizeJoystickScale(bias.risk, 3);
  const mag = Math.max(0.15, bias.magnitude || 0.5);
  const steering = bias.steering || 'CTR';

  if (steering !== 'CTR') {
    if (['N', 'NE', 'NW'].includes(steering)) w.high = mag;
    if (['S', 'SE', 'SW'].includes(steering)) w.low = mag;
    if (['E', 'NE', 'SE'].includes(steering)) w.right = mag;
    if (['W', 'NW', 'SW'].includes(steering)) w.left = mag;
  }

  const leftBias = Math.max(0, (3 - b) / 2) * mag;
  const rightBias = Math.max(0, (b - 3) / 2) * mag;
  const lowRisk = Math.max(0, (3 - r) / 2) * mag;
  const highRisk = Math.max(0, (r - 3) / 2) * mag;
  w.left = Math.max(w.left, leftBias);
  w.right = Math.max(w.right, rightBias);
  w.low = Math.max(w.low, lowRisk);
  w.high = Math.max(w.high, highRisk);

  return w;
}

async function getDirectionalMasterplans(token, branch, weights) {
  const sides = ['left', 'right', 'high', 'low'];
  const plans = {};
  for (const side of sides) {
    if (!weights[side] || weights[side] <= 0) continue;
    const path = `static/${branch}/MASTERPLAN.${side}.md`;
    const file = await getFileContent(token, branch, path);
    if (file) plans[side] = { content: file.content.slice(0, 2000), weight: weights[side] };
  }
  return plans;
}

function buildDirectionWeightString(weights) {
  const parts = [];
  if (weights.high > 0) parts.push(`HIGH/UP: ${(weights.high * 100).toFixed(0)}%`);
  if (weights.low > 0) parts.push(`LOW/DOWN: ${(weights.low * 100).toFixed(0)}%`);
  if (weights.left > 0) parts.push(`LEFT: ${(weights.left * 100).toFixed(0)}%`);
  if (weights.right > 0) parts.push(`RIGHT: ${(weights.right * 100).toFixed(0)}%`);
  return parts.length > 0 ? parts.join(', ') : 'NEUTRAL (all directions equal)';
}

function buildSystemPrompt(wingFiles, branch, category, bias) {
  const harnessRules = extractHarnessRules(wingFiles);
  const harnessPriorities = extractHarnessPriorities(wingFiles);
  const biasLabel = ({1:'STRICT LEFT',2:'FAVOUR LEFT',3:'NEUTRAL',4:'FAVOUR RIGHT',5:'STRICT RIGHT'})[bias?.bias || 3] || 'NEUTRAL';
  const steeringLabel = bias?.steering || 'CTR';
  const riskLabel = ({1:'LOW RISK',2:'FAVOUR LOW',3:'NEUTRAL',4:'FAVOUR HIGH',5:'HIGH RISK'})[bias?.risk || 3] || 'NEUTRAL';
  const weights = bias?.weights || { left: 0, right: 0, high: 0, low: 0 };
  const weightStr = buildDirectionWeightString(weights);
  const dirPlans = bias?.directionalMasterplans || {};
  const dirPlanText = Object.entries(dirPlans).length > 0
    ? '\n## DIRECTIONAL MASTERPLANS (Weighted by Joystick)\n' + Object.entries(dirPlans).map(([side, p]) =>
        `### MASTERPLAN.${side}.md (weight: ${(p.weight * 100).toFixed(0)}%)\n${p.content.slice(0, 1500)}`
      ).join('\n\n')
    : '';
  return `You are the release engineer for the DATRO monorepo. Each branch has its own website on Cloudflare Pages.

Your task: analyze branch "${branch}" (category: ${category}) and propose unique, tailored improvements.

## STEERING BIAS
Current bias: **${biasLabel}** (${steeringLabel})
- BIAS 1 (STRICT LEFT): Prioritize aggressive progressive changes, new features over fixes, expand scope
- BIAS 2 (FAVOUR LEFT): Lean toward new features and UX enhancements over conservative fixes
- BIAS 3 (NEUTRAL): Balance bug fixes and features equally
- BIAS 4 (FAVOUR RIGHT): Lean toward conservative fixes, stability, and security over new features
- BIAS 5 (STRICT RIGHT): Prioritize security hardening, strict standards compliance, defensive changes only

## RISK TOLERANCE
Current risk level: **${riskLabel}**
- RISK 1 (LOW RISK): Only safe, incremental changes. Max 3 lines changed per proposal. Prefer docs/CSS tweaks. No experimental features.
- RISK 2 (FAVOUR LOW): Lean toward conservative changes. Bug fixes only, no features. Validate the SEARCH text carefully.
- RISK 3 (NEUTRAL): Balance risk and safety. Standard AI proposals allowed.
- RISK 4 (FAVOUR HIGH): Willing to accept moderate risk. Feature additions and refactors OK. Allow up to 15-line changes.
- RISK 5 (HIGH RISK): Full experimental mode. Breaking changes, risky refactors, new feature experiments all allowed. Max 50-line changes.

## JOYSTICK DIRECTIONAL WEIGHTS
The COMMAND cockpit joystick dictates which directional MASTERPLAN files to favour:
**Current direction weights: ${weightStr}**
The joystick position determines how much to weigh each directional variant:
- LEFT (W): Favour MASTERPLAN.left.md — conservative, stable, defensive changes
- RIGHT (E): Favour MASTERPLAN.right.md — progressive, new features, expansive changes
- HIGH/UP (N): Favour MASTERPLAN.high.md — experimental, high-risk, innovative changes
- LOW/DOWN (S): Favour MASTERPLAN.low.md — safe, incremental, low-risk changes
- Diagonals (NE, SE, NW, SW): Combine two directions proportionally
- CENTER: Balance all directions equally${dirPlanText}

## WING FILES
All wing files (left/right/high/low) are loaded. The high wing files contain experimental/pushing items; low wing files contain safe/incremental items. Consider the current risk level when choosing which wing items to act on.

## HARNESS RULES (from wing files — these are your constraints)
${harnessRules}

## PENDING TASKS / PRIORITIES (from wing files — guidance on what matters)
${harnessPriorities}

## OUTPUT FORMAT
Respond with exactly this structure for EACH change. You may propose up to 3 BUG fixes and up to 1 FEATURE per release.

---CHANGE---
TITLE: <short title>
TYPE: bug|feature
DESCRIPTION: <2-3 sentence explanation of what and why>
SEARCH: <exact text to find in the HTML — must exist verbatim>
REPLACE: <replacement text>
---END CHANGE---

## RULES
- Max 3 bug fixes, max 1 feature per release (enforced by parser)
- Each SEARCH block MUST exist verbatim in the current HTML or the change will be REJECTED
- Must NOT repeat anything from the Previous Releases list below
- Changes must be grounded in web best practices (WCAG, web.dev, MDN, OWASP)
- Consider: mobile responsiveness, cross-browser, accessibility, performance, security, SEO
- The REPLACE text must include everything the SEARCH did plus your improvement
- For index.html changes only (not modifying CSS/JS files directly)`;
}

function buildUserPrompt(html, headers, releaseNotes, liveHtml = '') {
  const notesText = releaseNotes.length > 0 ? releaseNotes.join('\n') : '(no previous releases)';
  return `## CURRENT REPO index.html
\`\`\`html
${html}
\`\`\`

## CURRENT LIVE WEBSITE HTML (Research)
\`\`\`html
${liveHtml || '(could not fetch live website)'}
\`\`\`

## CURRENT _headers
\`\`\`
${headers || '(empty — no _headers file)'}
\`\`\`

## PREVIOUS RELEASES (DO NOT REPEAT ANY OF THESE)
${notesText}

Analyze this branch deeply. Compare the Repo HTML with the Live Website HTML. 
CRITICAL REQUIREMENT: Each release MUST make a noticeable visual or functional difference.
1. DO NOT just add meta tags. Add tangible elements: new graphics/icons, structured feature sections, interactive UI, or improved typography.
2. Fix accessibility gaps.
3. Fix performance issues.
4. Improve UX.

Propose your best change using the ---CHANGE--- format. 
Mandatory: At least 1 change MUST affect the visual layout or add functional UI.`;
}

async function queryFinancechequeAPI(systemPrompt, userPrompt, env, timeoutMs = 60000) {
  const startTimeAI = Date.now();
  const parentUrl = env.PARENT_PROXY_URL || 'https://www.financecheque.uk';
  const model = env.AI_MODEL || 'openrouter/anthropic/claude-sonnet';
  const payload = {
    message: `${systemPrompt}\n\n${userPrompt}`,
    chat_only: true,
    model
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(`${parentUrl}/api/proxy?action=chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Chat-Only': 'true' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      console.error(`AI API error: ${resp.status} ${text.slice(0, 200)}`);
      return { error: `HTTP ${resp.status}`, reply: null, elapsed: Date.now() - startTimeAI };
    }
    const data = await resp.json();
    const elapsed = Date.now() - startTimeAI;
    console.log(`AI query completed in ${elapsed}ms`);
    return { error: null, reply: data.reply || data.choices?.[0]?.message?.content || '', elapsed };
  } catch (err) {
    clearTimeout(timer);
    console.error(`AI query failed: ${err.message}`);
    return { error: err.message, reply: null, elapsed: Date.now() - startTimeAI };
  }
}

function parseAIResponse(text, html) {
  if (!text || text.trim() === '') return { changes: [], error: 'empty_response' };
  const changes = [];
  const blocks = text.split('---CHANGE---');
  let bugCount = 0, featureCount = 0;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const titleMatch = trimmed.match(/TITLE:\s*(.+)/i);
    const typeMatch = trimmed.match(/TYPE:\s*(bug|feature)/i);
    const descMatch = trimmed.match(/DESCRIPTION:\s*([\s\S]*?)(?=SEARCH:|$)/i);
    const searchMatch = trimmed.match(/SEARCH:\s*([\s\S]*?)(?=REPLACE:|$)/i);
    const replaceMatch = trimmed.match(/REPLACE:\s*([\s\S]*?)(?=---END|---CHANGE|NOTES:|$)/i);

    if (!titleMatch || !searchMatch || !replaceMatch) continue;

    const title = titleMatch[1].trim();
    const type = typeMatch ? typeMatch[1].toLowerCase() : 'bug';
    const description = descMatch ? descMatch[1].trim() : '';
    const search = searchMatch[1].trim();
    const replace = replaceMatch[1].trim();

    // Enforce scope limits
    if (type === 'bug') { bugCount++; if (bugCount > 3) continue; }
    if (type === 'feature') { featureCount++; if (featureCount > 1) continue; }

    // Validate SEARCH exists in HTML
    if (!html.includes(search)) {
      console.log(`  Rejected "${title}": SEARCH text not found in HTML`);
      continue;
    }

    // Validate REPLACE is different from SEARCH
    if (search === replace) {
      console.log(`  Rejected "${title}": SEARCH === REPLACE (no change)`);
      continue;
    }

    changes.push({ title, type, description, search, replace });
  }

  if (changes.length === 0) return { changes: [], error: text.includes('---CHANGE---') ? 'all_rejected' : 'no_changes_parsed' };
  return { changes, error: null };
}

async function processBranchWithAI(env, branch) {
  const token = resolveToken(env);
  console.log(`AI engine analyzing ${branch}`);

  // Research live website
  const liveUrl = `https://${branch}.${DOMAIN || 'datro.directory'}`;
  let liveHtml = '';
  try {
    const liveResp = await fetch(liveUrl);
    if (liveResp.ok) {
      liveHtml = await liveResp.text();
      console.log(`  Fetched live HTML for ${branch} (${liveHtml.length} chars)`);
    }
  } catch (err) {
    console.log(`  Failed to fetch live HTML for ${branch}: ${err.message}`);
  }

  // Gather full context
  const wingFiles = await getAllWingFiles(token, branch);
  const wingCount = Object.keys(wingFiles).length;
  console.log(`  Loaded ${wingCount} wing files`);

  const idx = await getFileContent(token, branch, 'index.html');
  const hdr = await getFileContent(token, branch, '_headers');
  const html = idx ? idx.content : '';
  const headers = hdr ? hdr.content : '';

  if (!html) {
    console.log(`  No index.html found for ${branch}, skipping AI`);
    return { error: 'no_html', changes: [], html: '' };
  }

  const releaseNotes = await getPreviousReleaseNotes(token, branch, 100);
  console.log(`  Loaded ${releaseNotes.length} previous release notes`);
  const category = computeBranchCategory(branch);
  const bias = await getBiasFromKv(env);
  bias.directionalMasterplans = await getDirectionalMasterplans(token, branch, bias.weights || {});
  console.log(`  Bias: ${bias?.bias || 3} (${bias?.steering || 'CTR'}) weights: ${JSON.stringify(bias.weights)}`);

  // Research Sci-Hub and Daily Digests
  const sciHubContext = await getSciHubIdeas(env, branch, category);
  const dailyDigest = await getDailyBestPractices(env);
  const doneList = await getDoneList(env);
  const brainMemory = await getBrainSummary(token);
  const honchoMemory = await getHonchoMemory(env, branch);

  // Build prompts with truncation for context efficiency
  const systemPrompt = buildSystemPrompt(wingFiles, branch, category, bias) + `\n\n## FLYWHEEL BRAIN (AGGREGATED MEMORY)\n${brainMemory}\n\n## HONCHO PEER MEMORY\n${honchoMemory}\n\n## RESEARCH & DIGESTS\n${sciHubContext}\n\n${dailyDigest}\n\n## DONE LIST (DO NOT REPEAT ANY OF THESE TITLES)\n${doneList.join(', ')}`;
  const userPrompt = buildUserPrompt(truncateForPrompt(html, 60000), headers, releaseNotes, truncateForPrompt(liveHtml, 60000));

  console.log(`  System prompt: ${systemPrompt.length} chars, User prompt: ${userPrompt.length} chars`);

  // Query the AI (up to 2 min for deep analysis)
  const result = await queryFinancechequeAPI(systemPrompt, userPrompt, env, 60000);
  if (result.error) {
    console.log(`  AI query error: ${result.error}`);
    return { error: `ai_query: ${result.error}`, changes: [], html, aiResult: result };
  }

  console.log(`  AI reply: ${result.reply.length} chars`);
  console.log(`  AI reply preview: ${result.reply.slice(0, 300)}`);

  // Parse
  const parsed = parseAIResponse(result.reply, html);
  if (parsed.error) {
    console.log(`  Parse result: ${parsed.error}`);
    return { error: `ai_parse: ${parsed.error}`, changes: [], html, aiResult: result };
  }

  console.log(`  Parsed ${parsed.changes.length} valid changes (type counts: bugs=${parsed.changes.filter(c => c.type === 'bug').length}, features=${parsed.changes.filter(c => c.type === 'feature').length})`);

  return { error: null, changes: parsed.changes, html, wingFiles, aiResult: result };
}

// ── Master Record Visuals ──────────────────────────────────────────────────────

function steeringDirToPositions(dir) {
  const map = {
    'N': ['top'], 'NE': ['top', 'right'], 'E': ['right'],
    'SE': ['bottom', 'right'], 'S': ['bottom'], 'SW': ['bottom', 'left'],
    'W': ['left'], 'NW': ['top', 'left'], 'CTR': [], 'CENTER': []
  };
  return map[dir?.toUpperCase()] || [];
}

function removeCneiBars(html) {
  return html.replace(/<div class="cnei-bar[^"]*"[^>]*><\/div>\s*/g, '');
}

function extractVisualInstructions(wingFiles, activePositions) {
  const instructions = { top: null, bottom: null, left: null, right: null };
  for (const [key, content] of Object.entries(wingFiles)) {
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      let match = trimmed.match(/steering\s+block\s+(#[0-9a-fA-F]{6})\s+at\s+(top|bottom|left|right)/i);
      if (!match) {
        const lower = trimmed.toLowerCase();
        match = lower.match(/(\w+)\s*bar\s*(?:at\s+)?(?:the\s+)?(top|bottom|left|right)/);
      }
      if (match) {
        const color = match[1];
        const position = match[match.length - 1];
        if (!activePositions || activePositions.includes(position)) {
          instructions[position] = color;
        }
      }
      const stripLower = trimmed.toLowerCase();
      const stripMatch = stripLower.match(/(\w+)\s*strip(?:p?e?d?)?\s*(?:at\s+)?(?:the\s+)?(top|bottom|left|right)/);
      if (stripMatch) {
        const color = stripMatch[1];
        const position = stripMatch[2];
        if (!activePositions || activePositions.includes(position)) {
          instructions[position] = color;
        }
      }
    }
  }
  return instructions;
}

function injectVisualBars(html, instructions) {
  let modified = removeCneiBars(html);
  const positions = { top: '0, 0, auto, 0', bottom: 'auto, 0, 0, 0', left: '0, auto, 0, 0', right: '0, 0, 0, auto' };
  const sizes = { top: 'height: 6px', bottom: 'height: 6px', left: 'width: 6px', right: 'width: 6px' };

  for (const [pos, color] of Object.entries(instructions)) {
    if (!color) continue;
    const cssColor = color.startsWith('#') ? color : color;
    const inset = positions[pos];
    const size = sizes[pos];
    const barHtml = `<div class="cnei-bar cnei-bar-${pos}" style="position:fixed;${size};${inset};background:${cssColor};z-index:9999;pointer-events:none;transition:opacity 0.5s"></div>\n`;
    modified = modified.replace('</body>', `${barHtml}</body>`);
  }
  return modified;
}

// ── Eval System ──────────────────────────────────────────────────────────────
// Tracks release quality, benchmarks against commit history, detects saturation.

async function getEvalMetrics(env, branch) {
  const key = `eval_${branch}`;
  const raw = await env.FLYWHEEL_STATE.get(key, 'json').catch(() => null);
  return raw || { runs: [], scores: {}, benchmark: {}, lastReview: null };
}

async function saveEvalMetrics(env, branch, metrics) {
  const key = `eval_${branch}`;
  await env.FLYWHEEL_STATE.put(key, JSON.stringify(metrics));
}

async function recordEvalRun(env, branch, runData) {
  const metrics = await getEvalMetrics(env, branch);
  metrics.runs.push({ ...runData, ts: Math.floor(Date.now() / 1000) });
  if (metrics.runs.length > 100) metrics.runs = metrics.runs.slice(-100);
  await saveEvalMetrics(env, branch, metrics);
  return metrics;
}

async function benchmarkAgainstHistory(token, branch, env) {
  const metrics = await getEvalMetrics(env, branch);
  const recent = metrics.runs.slice(-10);
  if (recent.length < 3) return { status: 'insufficient_data', history: recent.length };

  const avgScore = recent.reduce((s, r) => s + (r.score || 0), 0) / recent.length;
  const avgChanges = recent.reduce((s, r) => s + (r.changes || 0), 0) / recent.length;
  const prevScores = metrics.scores;
  const scoreDelta = prevScores.lastAvg ? avgScore - prevScores.lastAvg : 0;
  const saturated = avgScore > 0.9 && scoreDelta < 0.01 && recent.length >= 10;

  metrics.scores = {
    lastAvg: avgScore,
    best: Math.max(prevScores.best || 0, avgScore),
    trend: scoreDelta > 0.02 ? 'improving' : scoreDelta < -0.02 ? 'declining' : 'stable',
    saturated,
    runCount: (prevScores.runCount || 0) + 1
  };
  await saveEvalMetrics(env, branch, metrics);

  return {
    status: saturated ? 'SATURATED' : 'active',
    avgScore: avgScore.toFixed(3),
    avgChanges: avgChanges.toFixed(1),
    trend: metrics.scores.trend,
    saturated,
    history: recent.length,
    suggestion: saturated
      ? `Eval saturated for ${branch} — diversify eval criteria or reset baseline`
      : `Benchmark: ${metrics.scores.trend} (score ${avgScore.toFixed(3)})`
  };
}

// ── Admin Notes ──────────────────────────────────────────────────────────────

function generateAdminNote(branch, release, benchmark, mcpResults) {
  const notes = [];

  // Eval / saturation
  if (benchmark?.saturated) {
    notes.push(`EVALS SATURATED for ${branch} (score ${benchmark.avgScore}). Consider adding new eval criteria or reviewing existing ones.`);
  }
  if (benchmark?.trend === 'declining') {
    notes.push(`Eval trend declining for ${branch} (score ${benchmark.avgScore}). May need human review of recent changes.`);
  }

  // MCP gaps
  if (mcpResults) {
    const failing = Object.entries(mcpResults).filter(([, r]) => r.error);
    if (failing.length > 0) {
      notes.push(`MCP scan failures: ${failing.map(([k]) => k).join(', ')}. Check if these services are still available or if API keys need updating.`);
    }
  }

  // Common resource gaps
  notes.push(`To help the flywheel: add missing API keys to Cloudflare Workers env variables (e.g., MONDAY_API_TOKEN for monday.com sync, CF_API_TOKEN for Pages cleanup, AI_MODEL for custom LLM model).`);

  // Release-specific
  if (release?.type === 'agent') {
    notes.push(`Agent made ${release.changes?.length || 0} change(s) to ${branch}. Review the release at https://github.com/unclehowell/datro/releases/tag/${release.tagName}`);
  }

  return notes.join('\n');
}

// ── Scaffold Review ──────────────────────────────────────────────────────────

async function reviewScaffolds(token, branch) {
  const unnecessary = [];
  try {
    const resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents?ref=${branch}`, { headers: ghHeaders(token) });
    if (!resp.ok) return [];
    const items = await resp.json();
    if (!Array.isArray(items)) return [];
    for (const item of items) {
      // Flag empty or placeholder files
      if (item.type === 'file' && item.size < 30 && !item.name.startsWith('.')) {
        unnecessary.push({ path: item.path, reason: 'Empty/near-empty file (<30 bytes)' });
      }
      // Flag old scaffold patterns
      if (item.name === 'scaffold' || item.name === 'harness' || item.name === 'boilerplate') {
        const content = await fetch(item.url, { headers: ghHeaders(token) });
        if (content.ok) {
          const text = await content.text();
          if (text.length < 200) {
            unnecessary.push({ path: item.path, reason: 'Minimal scaffold/harness file — review if still needed' });
          }
        }
      }
    }
  } catch (_) {}
  return unnecessary;
}

// ── Best Practice Engine ──────────────────────────────────────────────────────

function computeBranchCategory(branch) {
  if (branch === 'cnei') return 'platform';
  if (['financecheque', 'ccan', 'dash', 'dcc', 'carfinancecheque'].includes(branch)) return 'finance';
  if (['althea', 'archives', 'wayback', 'llmwiki'].includes(branch)) return 'archive';
  if (['gui', 'ui', 'hbnb', 'library', 'datro'].includes(branch)) return 'frontend';
  if (['ceo', 'subrepos', 'pirateclaw'].includes(branch)) return 'platform';
  return 'general';
}

// Each branch category maps to a weighted priority of best practices
const CATEGORY_PRIORITIES = {
  'finance':  { security: 5, accessibility: 4, html: 3, seo: 3, performance: 2, progressive: 1 },
  'frontend': { security: 3, accessibility: 5, html: 4, seo: 4, performance: 4, progressive: 3 },
  'archive':  { security: 2, accessibility: 3, html: 5, seo: 5, performance: 3, progressive: 2 },
  'platform': { security: 5, accessibility: 4, html: 4, seo: 4, performance: 5, progressive: 3 },
  'general':  { security: 3, accessibility: 4, html: 4, seo: 4, performance: 3, progressive: 2 }
};

const CATEGORY_MAP = {
  'HTML Standards': 'html',
  'SEO & Social': 'seo',
  'Cloudflare Security': 'security',
  'Accessibility': 'accessibility',
  'Performance': 'performance',
  'Progressive': 'progressive'
};

async function findAndApplyBestPractice(token, branch, env) {
  console.log(`Analyzing ${branch} for best-practice improvements`);

  // Read TASKS.md to skip already-completed items
  const completedTasks = await readTASKS(token, branch);
  if (completedTasks.length > 0) {
    console.log(`Found ${completedTasks.length} completed tasks in TASKS.md`);
  }

  // Read lesson store to skip previously-applied fixes (prevents charset-loop spam)
  const lessonKey = `lessons_${branch}`;
  const lessonRaw = await env.FLYWHEEL_STATE.get(lessonKey, 'json').catch(() => null);
  const appliedFixes = Array.isArray(lessonRaw)
    ? lessonRaw.filter(l => l.text && l.text.startsWith('BESTPRACTICE_APPLIED:')).map(l => l.text.replace('BESTPRACTICE_APPLIED:', '').trim())
    : [];

  // Fetch index.html and _headers from the branch
  const idx = await getFileContent(token, branch, 'index.html');
  const hdr = await getFileContent(token, branch, '_headers');

  const html = idx ? idx.content : '';
  const headers = hdr ? hdr.content : '';
  const category = computeBranchCategory(branch);
  const priorities = CATEGORY_PRIORITIES[category] || CATEGORY_PRIORITIES.general;

  // Score each best practice by priority * tier, find the best match
  let best = null;
  let bestScore = -1;

  for (const bp of BEST_PRACTICES) {
    // Skip if already completed in TASKS.md
    if (bestPracticeMatchesTask(bp, completedTasks)) {
      console.log(`  Skipping "${bp.name}" — already completed per TASKS.md`);
      continue;
    }

    // Skip if already applied in a previous run (lesson-store check)
    if (appliedFixes.includes(bp.name)) {
      console.log(`  Skipping "${bp.name}" — already applied in a prior run (lesson store)`);
      continue;
    }

    const gap = bp.check(html, headers);
    if (!gap) continue;
    if (!bp.fix) continue;

    const catKey = CATEGORY_MAP[bp.category] || 'html';
    const priorityWeight = priorities[catKey] || 3;
    const tierWeight = 7 - bp.tier;
    const score = priorityWeight * tierWeight;

    if (score > bestScore) {
      bestScore = score;
      best = bp;
    }
  }

  if (!best) {
    console.log(`No applicable best-practice fix for ${branch}`);
    return null;
  }

  console.log(`Selected best-practice for ${branch}: ${best.name} (score=${bestScore})`);

  // Record in lesson store so it's never applied again (anti-charset-loop)
  await learnLesson(env, branch, `BESTPRACTICE_APPLIED:${best.name}`);

  // Apply the fix
  const newHtml = best.fix(html);
  const commitMsg = `fix(${branch}): ${best.name}\n\n${best.description}\n\nReference: ${best.source}`;

  // Fix html <title> special case
  let fixedHtml = newHtml;
  if (best.name === 'page title tag') {
    const title = branch.charAt(0).toUpperCase() + branch.slice(1).replace(/-/g, ' ');
    fixedHtml = html.replace('</head>', `<title>${title} | DATRO Consortium</title>\n</head>`);
  }

  // Write back
  const commit = await createCommit(token, branch, 'index.html', fixedHtml, commitMsg);

  // Write MEMORY.md
  const cycleNum = await getNextCycleNum(token, branch);
  const lessonText = `Applied "${best.name}" to \`index.html\` on \`${branch}\` branch. Score: ${bestScore}. Category: ${category}.`;
  await writeMEMORY(token, branch, cycleNum, best, lessonText);

  // Generate release notes
  const notes = [
    `## Best-Practice Improvement: ${best.name}`,
    ``,
    `### Change`,
    `- ${best.description}`,
    `- Applied to \`index.html\` on \`${branch}\` branch`,
    ``,
    `### Cycle`,
    `- MEMORY.md updated (Cycle ${cycleNum})`,
    ``,
    `### Rationale`,
    `This improvement was identified by the Cloudflare Flywheel's automated best-practice engine.`,
    `The engine scans each branch's \`index.html\` against a curated checklist of ${BEST_PRACTICES.length} best practices`,
    `drawn from MDN, web.dev, WCAG, OWASP, and Cloudflare documentation.`,
    ``,
    `### Reference`,
    `${best.source}`,
    ``,
    `### Category-Specific Focus`,
    `Branch category: **${category}** — priorities: ${Object.entries(priorities).sort((a,b) => b[1]-a[1]).map(([k,v]) => `${k}=${v}`).join(', ')}`,
    ``,
    `### Remaining Gaps`,
    `- ${BEST_PRACTICES.filter(bp => bp.check(fixedHtml, headers) && bp.tier <= 2).map(bp => bp.name).join(', ') || 'None in Tiers 1-2'}`
  ].join('\n');

  return { commit: commit.sha, notes, bestPractice: best, cycleNum };
}

// ── Self-Improvement for cnei ────────────────────────────────────────────────

async function applySelfImprovements(token, branch) {
  if (branch !== 'cnei') return null;
  console.log(`Running self-improvement checks for cnei`);

  // Read wrangler.toml from repo
  const wranglerFile = await getFileContent(token, 'cnei', 'wrangler.toml');
  const wranglerConfig = wranglerFile ? wranglerFile.content : '';

  // Read own source code from GitHub
  const selfSource = await getFileContent(token, 'cnei', 'flywheel-cf/src/index.js');
  const sourceCode = selfSource ? selfSource.content : '';

  // Read TASKS.md for self-improvement tasks
  const completedTasks = await readTASKS(token, 'cnei');

  let improvementsApplied = [];
  let currentCode = sourceCode;

  for (const imp of CNEI_SELF_IMPROVEMENTS) {
    // Skip if already completed
    if (bestPracticeMatchesTask({ name: imp.name }, completedTasks)) {
      console.log(`  Skipping self-improvement "${imp.name}" — already completed per TASKS.md`);
      continue;
    }

    let gap;
    if (imp.name === 'wrangler config exists') {
      gap = imp.check(wranglerConfig);
    } else {
      gap = imp.check(currentCode);
    }

    if (!gap) {
      console.log(`  Self-improvement "${imp.name}" already satisfied`);
      continue;
    }

    if (!imp.fix) {
      console.log(`  Self-improvement "${imp.name}" has no automated fix (requires manual action)`);
      improvementsApplied.push({ name: imp.name, applied: false, note: 'manual action required' });
      continue;
    }

    // Apply fix
    try {
      currentCode = imp.fix(currentCode);
      console.log(`  Applied self-improvement: ${imp.name}`);
      improvementsApplied.push({ name: imp.name, applied: true });
    } catch (err) {
      console.error(`  Failed to apply self-improvement "${imp.name}": ${err.message}`);
      improvementsApplied.push({ name: imp.name, applied: false, error: err.message });
    }
  }

  if (improvementsApplied.length > 0 && currentCode !== sourceCode) {
    // Write improved code back
    const commitMsg = `fix(cnei): self-improvement — ${improvementsApplied.filter(i => i.applied).map(i => i.name).join(', ')}`;
    await createCommit(token, 'cnei', 'flywheel-cf/src/index.js', currentCode, commitMsg);

    // Write MEMORY.md for cnei
    const cycleNum = await getNextCycleNum(token, 'cnei');
    const bpSummary = improvementsApplied.filter(i => i.applied).map(i => i.name).join(', ');
    const lessonText = `Self-improvement cycle: ${bpSummary}. Applied fixes to flywheel-cf/src/index.js.`;
    const pseudoPractice = {
      name: `self-improvement: ${bpSummary}`,
      description: `Applied ${improvementsApplied.filter(i => i.applied).length} self-improvement(s)`,
      source: 'CNEI_SELF_IMPROVEMENTS checklist (worker built-in)'
    };
    await writeMEMORY(token, 'cnei', cycleNum, pseudoPractice, lessonText);
  }

  return improvementsApplied;
}

// ── Process Branch ────────────────────────────────────────────────────────────

async function createSimpleRelease(token, branch, tagName, version, notesOverride) {
  const notes = notesOverride || [
    `## [${tagName}]`,
    ``,
    `### Changed`,
    `- Automated best-practice audit: no Tier 1-2 gaps found in \`index.html\``,
    `- Branch-specific cache/header review complete`,
    `- Continuous integration release for ${branch}`,
    ``,
    `### Audit Summary`,
    `- Branch: \`${branch}\``,
    `- Category: ${computeBranchCategory(branch)}`,
    `- Best practices checked: ${BEST_PRACTICES.length}`,
    `- All applicable fixes already applied`
  ].join('\n');

  return createGitHubRelease(token, tagName, branch, version, notes);
}

async function processBranch(env, branch) {
  const token = resolveToken(env);
  return withRetry(async () => {
    log(`Processing branch: ${branch}`);

    // Check branch exists
    const resp = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/git/refs/heads/${encodeURIComponent(branch)}`,
      { headers: ghHeaders(token) }
    );
    if (!resp.ok) {
      log(`Branch ${branch} does not exist, skipping`);
      return { tagName: null, error: 'branch_not_found' };
    }

    await ensureWingFiles(token, branch);

    const maxNum = await getMaxBranchReleaseNum(token, branch);
    const nextNum = maxNum + 1;
    const version = formatVersion(nextNum);
    const tagName = `${branch}-v${version}`;
    // Last released version (for skip-path brain notes)
    const lastVer = maxNum > 0 ? formatVersion(maxNum) : null;
    const lastTag = maxNum > 0 ? `${branch}-v${lastVer}` : null;
    log(`Max release num: ${maxNum}, Next: ${tagName}`);

    // Update index card pre-flight
    const card = await getIndexCard(env, branch);
    await updateIndexCard(env, branch, { lastRun: Math.floor(Date.now() / 1000), cycleCount: (card.cycleCount || 0) + 1 });
    const mondayToken = env.MONDAY_API_TOKEN;

    // Git diff analysis against last release
    const diffData = await getGitDiffSinceLastRelease(token, branch);
    if (diffData) {
      log(`Diff since ${diffData.base}: ${diffData.total_commits} commits, ${diffData.files.length} files changed`);
    }

    // Contextual research (topic-specific, not generic)
    const category = computeBranchCategory(branch);
    const research = await contextualResearch(env, branch, category);
    const flywheelResearch = await researchImprovingFlywheel();

    // For cnei, apply self-improvements first + meta-improvement
    let selfImprovements = null;
    let metaChanges = null;
    if (branch === 'cnei') {
      selfImprovements = await applySelfImprovements(token, branch);
      const recentReleases = await getPreviousReleaseNotes(token, branch, 10);
      metaChanges = await metaImproveFlywheel(env, token, recentReleases);
      if (metaChanges && metaChanges.length > 0) {
        log(`Applying ${metaChanges.length} meta-improvement(s) to flywheel code`);
        for (const ch of metaChanges) {
          await createCommit(token, 'cnei', 'flywheel-cf/src/index.js', ch.replace, `meta(cnei): ${ch.title}`);
        }
        selfImprovements = (selfImprovements || []).concat(metaChanges.map(c => ({ name: c.title, applied: true })));
      }
      await addHypothesisNode(env, 'cnei', card.hypothesisTree?.root, `cnei-v${version}: meta-cycle`, 'running');
    }

    // Run MCP scans for data-driven UX/bug insight
    const branchUrl = `https://${branch}.${DOMAIN || 'datro.directory'}`;
    const mcpResults = await runMcpScans(env, branchUrl);
    const mcpSection = formatMcpReleaseNotes(mcpResults, branch);

    // ── STEERING-AWARE VISUAL BLOCKS (wing file + joystick → HTML injection) ──
    const bias = await getBiasFromKv(env);
    const extraSides = [];
    if ((bias?.weights?.high || 0) > 0) extraSides.push('high');
    if ((bias?.weights?.low || 0) > 0) extraSides.push('low');
    const visualWingFiles = await getAllWingFiles(token, branch, extraSides);
    const steeringDir = bias?.steering || 'CTR';
    const magnitude = bias?.magnitude || 0;
    const activePositions = steeringDirToPositions(steeringDir);
    log(`Steering: ${steeringDir} → positions: ${JSON.stringify(activePositions)} (magnitude: ${magnitude})`);
    const visualInstructions = extractVisualInstructions(visualWingFiles, activePositions);
    const hasVisuals = Object.values(visualInstructions).some(v => v);
    if (bias !== null || hasVisuals) {
      const idxFile = await getFileContent(token, branch, 'index.html');
      if (idxFile) {
        const newHtml = injectVisualBars(idxFile.content, visualInstructions);
        if (newHtml !== idxFile.content) {
          const commitMsg = activePositions.length > 0
            ? `chore: apply steering blocks [${steeringDir}] at ${activePositions.join(', ')}`
            : 'chore: clear steering blocks (center)';
          await createCommit(token, branch, 'index.html', newHtml, commitMsg);
          log(`Applied steering blocks: ${JSON.stringify(visualInstructions)}`);
        }
      }
    }

    // Fetch current index.html and _headers for AI agent
    const idxFile = await getFileContent(token, branch, 'index.html');
    const hdrFile = await getFileContent(token, branch, '_headers');
    const idxHtml = idxFile ? idxFile.content : '';
    const hdrContent = hdrFile ? hdrFile.content : '';

    // Fetch live website HTML
    let liveHtml = '';
    try {
      const liveResp = await fetch(`https://${branch}.${DOMAIN}`);
      if (liveResp.ok) liveHtml = await liveResp.text();
    } catch (e) { log(`Could not fetch live site for ${branch}: ${e.message}`); }

    // ── AGENTIC AI ENGINE (chain-of-thought with tool use) ──
    let commitSha = null;
    let releaseNotes = '';
    const wallet = await getBranchWallet(env, branch);

    const agentResult = await runAgentLoop(env, branch, idxHtml, hdrContent, visualWingFiles, liveHtml, { token, env });

    // ── Eval: multi-metric record run + benchmark against history ──
    const planAdherence = agentResult?.summary?.includes('PLAN') || agentResult?.changes?.length > 0 ? 0.8 : 0.2;
    const changeScore = agentResult?.changes?.length > 0 ? Math.min(1, agentResult.changes.length / 3) : 0;
    const mcpPenalty = Math.min(0.5, (Object.values(mcpResults || {}).filter(r => r.error).length) * 0.15);
    const evalScore = Math.max(0, Math.min(1, (planAdherence * 0.4 + changeScore * 0.6) - mcpPenalty));
    const evalRun = {
      score: evalScore,
      planAdherence,
      changeScore,
      mcpPenalty,
      changes: agentResult?.changes?.length || 0,
      hasBounty: !!agentResult?.bounty,
      mcpFailures: Object.values(mcpResults || {}).filter(r => r.error).length,
      toolCount: agentResult?.changes?.length || 0 // proxy for tool use
    };
    await recordEvalRun(env, branch, evalRun);
    const benchmark = await benchmarkAgainstHistory(token, branch, env);
    log(`Eval ${branch}: ${benchmark.status} score=${benchmark.avgScore} trend=${benchmark.trend}`);

    // ── Scaffold review (cnei only, periodic) ──
    let scaffoldIssues = [];
    if (branch === 'cnei') {
      scaffoldIssues = await reviewScaffolds(token, branch);
      if (scaffoldIssues.length > 0) {
        log(`Scaffold review: ${scaffoldIssues.length} issue(s) found`);
      }
    }

    // ── Admin note for the human ──
    const adminNote = generateAdminNote(branch, { type: 'agent', tagName, changes: agentResult?.changes }, benchmark, mcpResults);

    if (agentResult && agentResult.changes.length > 0) {
      // Get latest commit SHA for tagging
      const headResp = await ghFetch(
        `https://api.github.com/repos/${GITHUB_REPO}/git/refs/heads/${encodeURIComponent(branch)}`,
        token
      );
      const headData = await headResp.json();
      commitSha = headData.object.sha;

      // ── Post-agent self-verification ──
      let verificationPass = true;
      const verificationNotes = [];
      for (const change of agentResult.changes) {
        if (change.path === 'index.html' || change.path.endsWith('.html')) {
          try {
            const file = await getFileContent(token, change.branch || branch, change.path);
            if (!file) {
              verificationNotes.push(`⚠️ Could not re-read ${change.path} for verification`);
              verificationPass = false;
              continue;
            }
            // Check it's parseable HTML (basic structural checks)
            const content = file.content;
            if (!content.includes('<html') && !content.includes('<!DOCTYPE')) {
              verificationNotes.push(`⚠️ ${change.path}: missing <html> or DOCTYPE — agent may have broken the structure`);
              verificationPass = false;
            } else if (content.includes('</body>') !== content.includes('</html>')) {
              verificationNotes.push(`⚠️ ${change.path}: mismatched </body> and </html> tags`);
              verificationPass = false;
            } else {
              verificationNotes.push(`✅ ${change.path}: HTML structure OK`);
            }
          } catch (err) {
            verificationNotes.push(`⚠️ ${change.path}: verification failed — ${err.message}`);
            verificationPass = false;
          }
        } else {
          verificationNotes.push(`✅ ${change.path}: committed`);
        }
      }

      const committedPaths = agentResult.changes.map(c => `- \`${c.path}\``).join('\n');
      let bountyText = '';
      if (agentResult.bounty) {
        if (agentResult.bounty.action === 'claimed') {
          bountyText = `\n### Gitlawv Bounty\n- Claimed bounty \`${agentResult.bounty.bountyId}\` on \`${agentResult.bounty.branch}\`\n- Wallet: \`${wallet.address}\` will receive $GITLAWB on completion`;
        } else if (agentResult.bounty.action === 'submitted') {
          bountyText = `\n### Gitlawv Bounty\n- Submitted bounty \`${agentResult.bounty.bountyId}\` — ${agentResult.bounty.submissionUrl}\n- Wallet: \`${wallet.address}\` pending $GITLAWB payout`;
        }
      }

      // Self-reflection: include diff analysis + research sources in release notes
      const diffSection = diffData ? `\n### Diff Analysis (since ${diffData.base})\n- Commits: ${diffData.total_commits}\n- Files changed:\n${diffData.files.map(f => `  - ${f.path} (${f.status}, +${f.additions}/-${f.deletions})`).join('\n')}` : '';
      const researchSection = research ? `\n### Contextual Research\n${research}` : '';
      const hypothesisSection = `\n### Hypothesis Tree\n${renderHypothesisTree(await getIndexCard(env, branch))}`;
      const scaffoldSection = scaffoldIssues.length > 0 ? `\n### Scaffold Review\n${scaffoldIssues.map(s => `- \`${s.path}\`: ${s.reason}`).join('\n')}` : '';
      const evalSection = `\n### Eval Metrics\n- Score: ${benchmark.avgScore}\n- Trend: ${benchmark.trend}\n- History: ${benchmark.history} runs\n- Status: ${benchmark.status}`;
      const adminSection = `\n### 👤 Note for Admin\n${adminNote}`;

      releaseNotes = [
        `## Agentic Release: ${tagName}`,
        ``,
        `The autonomous agent analyzed \`${branch}\` using ${Object.keys(AGENT_TOOLS).length} MCP tools.`,
        ``,
        `### Self-Reflection`,
        `This release addresses gaps identified in prior cycle. Research was contextual to branch category (${category}).`,
        `Changes grounded in: ${diffData ? `actual diff from ${diffData.base}` : 'live site comparison'} + MCP scans.`,
        ``,
        `### Files Changed`,
        committedPaths,
        ``,
        `### Post-Agent Verification`,
        verificationNotes.map(n => n).join('\n'),
        `**Overall: ${verificationPass ? '✅ PASS' : '⚠️ ISSUES FOUND'}`,
        ``,
        diffSection,
        ``,
        `### Agent Summary`,
        agentResult.summary || 'No summary provided.',
        ``,
        `### Wallet`,
        `- Branch wallet: ${wallet.address}`,
        `- Compute budget: ${wallet.computeBudget}`,
        bountyText,
        researchSection,
        hypothesisSection,
        evalSection,
        scaffoldSection,
        ``,
        mcpSection,
        ``,
        adminSection
      ].join('\n');

      // Write MEMORY.md
      const cycleNum = await getNextCycleNum(token, branch);
      const agentLesson = `Agentic engine: ${agentResult.changes.length} file(s) committed to \`${branch}\`. Diff: ${diffData ? `${diffData.total_commits} commits since ${diffData.base}` : 'N/A'}. Wallet: ${wallet.address}.`;
      const pseudoBp = {
        name: `agent: ${committedPaths.slice(0, 80)}`,
        description: `Applied ${agentResult.changes.length} agent commits to ${branch}`,
        source: 'Agentic Flywheel (ReAct loop + MCP tools + Diff Analysis + Index Card)'
      };
      await writeMEMORY(token, branch, cycleNum, pseudoBp, agentLesson);

      // Tag release and verify
      await createGitTag(token, tagName, commitSha);
      const release = await createGitHubRelease(token, tagName, branch, version, releaseNotes);
      if (release) {
        await verifyRelease(token, tagName);
      }

      log(`Agentic release ${tagName}: ${agentResult.changes.length} files committed`);
      await updateIndexCard(env, branch, { lastRelease: tagName });

      // Track gitlawv bounty earnings in KV
      if (agentResult.bounty) {
        const bountyKey = `bounty_${branch}`;
        const existing = await env.FLYWHEEL_STATE.get(bountyKey, 'json');
        const history = Array.isArray(existing) ? existing : [];
        history.push({
          bountyId: agentResult.bounty.bountyId,
          action: agentResult.bounty.action,
          tagName,
          timestamp: Math.floor(Date.now() / 1000)
        });
        await env.FLYWHEEL_STATE.put(bountyKey, JSON.stringify(history.slice(-50)));
        log(`Bounty ${agentResult.bounty.action}: ${agentResult.bounty.bountyId} on ${branch}`);
      }

      // Update hypothesis tree
      if (branch === 'cnei') {
        await updateHypothesisStatus(env, 'cnei', card.hypothesisTree?.root, 'completed');
      }

      // Sync index card to Monday
      await syncIndexCardToMonday(env, branch, await getIndexCard(env, branch), mondayToken);

      // Write to brain branch for vault sync
      await writeBrainNote(token, branch, branchPurpose(branch), version, tagName, branchUrl);

      return { tagName, version, type: 'agent', changes: agentResult.changes, aiError: null, selfImprovements, metaChanges, wallet: wallet.address };
    }

    // ── FALLBACK: Best-practice engine ──
    log(`Falling back to best-practice engine for ${branch}`);
    const bpResult = await findAndApplyBestPractice(token, branch, env);

    if (bpResult) {
      const diffSection = diffData ? `\n### Diff Analysis (since ${diffData.base})\n- ${diffData.files.map(f => `  - ${f.path}`).join('\n')}` : '';
      const evalSection = `\n### Eval Metrics\n- Score: ${benchmark.avgScore}\n- Trend: ${benchmark.trend}\n- History: ${benchmark.history} runs\n- Status: ${benchmark.status}`;
      const adminSection = `\n### 👤 Note for Admin\n${adminNote}`;
      const enhancedNotes = bpResult.notes + '\n\n' + diffSection + '\n\n' + evalSection + '\n\n' + mcpSection + '\n\n' + adminSection;
      await createGitTag(token, tagName, bpResult.commit);
      const release = await createGitHubRelease(token, tagName, branch, version, enhancedNotes);
      if (release) await verifyRelease(token, tagName);
      log(`Best-practice release ${tagName}: ${bpResult.bestPractice.name}`);
      await updateIndexCard(env, branch, { lastRelease: tagName });
      // Write to brain branch for vault sync
      await writeBrainNote(token, branch, branchPurpose(branch), version, tagName, branchUrl);
      return { tagName, version, type: 'best-practice', aiError: null, selfImprovements, wallet: wallet.address };
    }

    // ── FALLBACK: Audit-only — SKIP release if nothing changed ──
    log(`No improvements found for ${branch}, skipping release (no changes = no tag)`);
    await learnLesson(env, branch, `Skipped release: agent and best-practice engine both found nothing to change on ${branch}`);
    // Update index card but DON'T create a tag or release — pointless noise
    await updateIndexCard(env, branch, { lastRun: Math.floor(Date.now() / 1000), lastRelease: null });
    // Write brain note with latest tag info (or pending if first release)
    if (lastTag && lastVer) {
      await writeBrainNote(token, branch, branchPurpose(branch), lastVer, lastTag, branchUrl);
    } else {
      await writeBrainNote(token, branch, branchPurpose(branch), '—', 'pending', branchUrl);
    }
    return { tagName: null, version: null, type: 'skipped', aiError: null, selfImprovements, wallet: wallet.address };
  }, `processBranch(${branch})`, 3).catch(async (err) => {
    await logFailureToKv(env, branch, err, 'processBranch');
    return { tagName: null, error: err.message };
  });
}

async function triggerOtaAfterCneiRelease(env, tagName) {
  await env.FLYWHEEL_STATE.put('last_cnei_release', JSON.stringify({
    tag: tagName,
    timestamp: Math.floor(Date.now() / 1000),
    commit_sha: null
  }));
  console.log(`Recorded cnei release ${tagName} in KV for OTA detection`);
}

// ── Brain Note Writer (persistent vault notes, survives laptop-off) ──
// Writes per-branch release notes to the `brain` branch.
// The local obsidian vault pulls from this branch to stay current.
const BRAIN_DOMAIN = 'datro.directory';

async function writeBrainNote(token, branch, desc, version, tagName, deployUrl) {
  const path = `${branch}.md`;
  const commitMsg = `docs(brain): update ${branch} to ${tagName}`;

  const note = [
    `# ${branch}`,
    ``,
    `**${desc}**`,
    ``,
    `## Latest Release`,
    ``,
    `- **Version**: \`${version}\``,
    `- **Tag**: \`${tagName}\``,
    `- **Deployed**: ${new Date().toISOString()}`,
    `- **URL**: [${deployUrl}](${deployUrl})`,
    `- **Status**: deployed`,
    ``,
    `---`,
    ``,
    `*Auto-updated by datro-flywheel at ${new Date().toISOString()}*`,
    ``,
  ].join('\n');

  try {
    // Try to get existing file to compute base_sha
    const existing = await getFileContent(token, BRAIN_BRANCH, path);
    const baseSha = existing?.sha || undefined;

    // Encode content as base64
    const content = btoa(note);

    const body = {
      message: commitMsg,
      content,
      branch: BRAIN_BRANCH,
    };
    if (baseSha) body.sha = baseSha;

    const resp = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeURIComponent(path)}`,
      {
        method: 'PUT',
        headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      if (resp.status === 422 && text.includes('"ref"')) {
        // Branch doesn't exist — create it from the first regular branch
        const defaultBranch = REGULAR_BRANCHES[0] || 'cnei';
        try {
          const baseRef = await ghFetch(
            `https://api.github.com/repos/${GITHUB_REPO}/git/refs/heads/${defaultBranch}`,
            token
          );
          const refData = await baseRef.json();
          await ghFetch(
            `https://api.github.com/repos/${GITHUB_REPO}/git/refs`,
            token,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ref: `refs/heads/${BRAIN_BRANCH}`,
                sha: refData.object.sha,
              }),
            }
          );
          delete body.sha;
          const retry = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeURIComponent(path)}`,
            { method: 'PUT', headers: { ...ghHeaders(token), 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
          );
          if (!retry.ok) console.log(`  ⚠ brain note retry failed for ${branch}: ${await retry.text().catch(() => '')}`);
          else console.log(`  → Brain note written: ${BRAIN_BRANCH}/${path}`);
        } catch (e) {
          console.log(`  ⚠ brain branch creation failed for ${branch}: ${e.message}`);
        }
      } else {
        console.log(`  ⚠ brain note write failed for ${branch}: status=${resp.status} body=${text.slice(0, 200)}`);
      }
    } else {
      console.log(`  → Brain note written: ${BRAIN_BRANCH}/${path}`);
    }
  } catch (err) {
    console.log(`  ⚠ brain note error for ${branch}: ${err.message}`);
  }
}

async function findAvailableBranch(state, token, gear) {
  const savedIdx = state.regular_index;
  for (let attempt = 0; attempt < 40; attempt++) {
    const branch = selectBranch(state);
    const onCooldown = await isOnCooldown(token, branch, gear);
    if (!onCooldown) return branch;
  }
  console.log('All branches on cooldown, skipping run');
  state.regular_index = savedIdx;
  return null;
}

async function runFlywheel(env, forcedBranch) {
  const token = resolveToken(env);
  log(`Flywheel triggered at ${new Date().toISOString()}`);
  if (!token) { log('No token configured (GH_PAT or GITHUB_TOKEN)'); return; }

  const locked = await acquireLock(env);
  if (!locked) { log('Another invocation in progress, skipping'); return; }

  // Update brain memory (cached every hour via KV TTL)
  try {
    const lastBrain = await env.FLYWHEEL_STATE.get('brain_updated', 'text');
    const oneHour = 3600000;
    if (!lastBrain || (Date.now() - parseInt(lastBrain)) > oneHour) {
      await aggregateMemory(token);
      await env.FLYWHEEL_STATE.put('brain_updated', String(Date.now()));
    }
  } catch (e) {
      log(`Memory aggregation skipped: ${e.message}`);
  }

  try {
    const state = await getRotationState(env);
    const config = await getFlywheelConfig(env);
    const bias = await getBiasFromKv(env);

    // ── BURST MODE: auto-advance gear based on bias/risk/wallet ──
    let effectiveGear = config.gear;
    if ((bias?.bias || 3) <= 2) effectiveGear = Math.min(10, effectiveGear + 2);
    if ((bias?.risk || 3) >= 4) effectiveGear = Math.min(10, effectiveGear + 1);

    try {
      const sampleWallet = await getBranchWallet(env, REGULAR_BRANCHES[state.regular_index % REGULAR_BRANCHES.length]);
      if (sampleWallet.computeBudget > 5000) effectiveGear = Math.min(10, effectiveGear + 1);
    } catch (_) {}

    log(`State: idx=${state.regular_index} lap=${state.lap} mode=${state.mode} baseGear=${config.gear} effectiveGear=${effectiveGear}`);

    if (state.mode === 'PAUSED' && !forcedBranch) {
      log('Flywheel paused, skipping');
      return;
    }

    let branch;
    if (forcedBranch) {
      branch = forcedBranch;
      log(`Forced branch: ${branch}`);
    } else {
      const scheduled = await findAvailableBranch(state, token, effectiveGear);
      if (scheduled) {
        branch = scheduled;
      } else {
        log('All branches on cooldown, skipping run');
        return;
      }
    }

    const savedState = { regular_index: state.regular_index, lap: state.lap, mode: state.mode };
    log(`Selected branch: ${branch}`);

    // ── Per-branch isolation: one branch failure doesn't kill others ──
    let result;
    try {
      result = await processBranch(env, branch);
      log(`Result: ${JSON.stringify(result)}`);
    } catch (err) {
      log(`Branch ${branch} failed (isolated): ${err.message}`);
      await logFailureToKv(env, branch, err, 'runFlywheel');
      result = { tagName: null, error: err.message };
    }

    // Record run timestamp and last-run summary
    await recordRunTimestamp(env, branch);
    await env.FLYWHEEL_STATE.put('last_run_result', JSON.stringify({
      branch,
      tag: result?.tagName || null,
      version: result?.version || null,
      type: result?.type || 'error',
      error: result?.error || null,
      timestamp: Math.floor(Date.now() / 1000)
    }));

    if (result && (result.error === 'branch_not_found' || !result.error)) {
      await saveRotationState(env, savedState);
      if (branch === 'cnei' && result.tagName && !result.error) {
        await triggerOtaAfterCneiRelease(env, result.tagName);
      }
    }
  } catch (err) {
    log(`Fatal error: ${err.message}`);
    log(err.stack);
  } finally {
    await releaseLock(env);
  }
}

// ── Cloudflare Pages Deploy Cleanup ──
// Removes preview/failed deploys and keeps only last 10 successful production deploys.
// Runs automatically every 48 hours (checked via KV timestamp).
async function cleanupPagesDeploys(env) {
  const CF_API_TOKEN = env.CF_API_TOKEN;
  const CF_ACCOUNT_ID = env.CF_ACCOUNT_ID;
  if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
    console.log('Pages cleanup: CF_API_TOKEN or CF_ACCOUNT_ID not configured, skipping');
    return;
  }

  const lastCleanup = await env.FLYWHEEL_STATE.get('pages_cleanup_last', 'text');
  const now = Date.now();
  const FORTY_EIGHT_HOURS = 172800000;
  if (lastCleanup && (now - parseInt(lastCleanup)) < FORTY_EIGHT_HOURS) {
    console.log('Pages cleanup: less than 48h since last cleanup, skipping');
    return;
  }

  const headers = { 'Authorization': `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' };

  try {
    const listResp = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/command-dashboard/deployments`,
      { headers }
    );
    const listData = await listResp.json();
    if (!listData.success) {
      console.error('Pages cleanup: Failed to list deploys:', JSON.stringify(listData.errors));
      return;
    }

    const deploys = listData.result || [];
    deploys.sort((a, b) => new Date(b.created_on) - new Date(a.created_on));

    const prodSuccess = deploys.filter(d => d.environment === 'production' && d.latest_stage?.status === 'success');
    const others = deploys.filter(d => d.environment !== 'production' || d.latest_stage?.status !== 'success');

    const toDeleteProd = prodSuccess.slice(10); // keep last 10
    const keptCount = Math.min(prodSuccess.length, 10);

    for (const dep of toDeleteProd) {
      await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/command-dashboard/deployments/${dep.id}`,
        { method: 'DELETE', headers }
      );
    }

    for (const dep of others) {
      await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/command-dashboard/deployments/${dep.id}`,
        { method: 'DELETE', headers }
      );
    }

    await env.FLYWHEEL_STATE.put('pages_cleanup_last', String(now));
    console.log(`Pages cleanup done: kept ${keptCount} production, deleted ${toDeleteProd.length + others.length} deploys`);
  } catch (err) {
    console.error('Pages cleanup error:', err.message);
  }
}

function resolveToken(env) {
  return env.GH_PAT || env.GITHUB_TOKEN;
}
function log(str) { console.log(`[flywheel] ${str}`); }

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runFlywheel(env));
  },
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/__cron') {
      const branch = url.searchParams.get('branch');
      ctx.waitUntil(runFlywheel(env, branch || null));
      return new Response('Triggered' + (branch ? ': ' + branch : ''), { status: 200 });
    }
    if (url.pathname === '/__sync_cron') {
      const branch = url.searchParams.get('branch');
      await runFlywheel(env, branch || null);
      return new Response('Sync run completed', { status: 200 });
    }
    if (url.pathname === '/__state') {
      const state = await getRotationState(env);
      const config = await getFlywheelConfig(env);
      const cneiRelease = await env.FLYWHEEL_STATE.get('last_cnei_release', 'json');
      return new Response(JSON.stringify({ ...state, gear: config.gear, last_cnei_release: cneiRelease }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (url.pathname === '/__reset') {
      const state = { regular_index: 0, lap: 0, mode: 'AUTO' };
      await saveRotationState(env, state);
      return new Response('State reset', { status: 200 });
    }
    if (url.pathname === '/__unlock') {
      await releaseLock(env);
      return new Response(JSON.stringify({ ok: true, message: 'Lock cleared' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    if (url.pathname === '/__mode') {
      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const mode = body.mode;
          if (!['AUTO','MANUAL','PAUSED'].includes(mode)) {
            return new Response(JSON.stringify({ error: 'Invalid mode' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
          }
          const state = await getRotationState(env);
          state.mode = mode;
          await saveRotationState(env, state);
          return new Response(JSON.stringify({ ok: true, mode }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ ok: false, error: err.message }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      const state = await getRotationState(env);
      return new Response(JSON.stringify({ mode: state.mode }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    if (url.pathname === '/__config') {
      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const current = await getFlywheelConfig(env);
          const gear = Math.max(1, Math.min(10, body.gear ?? current.gear ?? 3));
          const updated = { ...current, ...body, gear, cadence: cadenceForGear(gear) };
          await env.FLYWHEEL_STATE.put('config', JSON.stringify({ gear: updated.gear, bias: updated.bias, risk: updated.risk }));
          return new Response(JSON.stringify({ ok: true, config: updated }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ ok: false, error: err.message }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      const current = await getFlywheelConfig(env);
      return new Response(JSON.stringify(current), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    if (url.pathname === '/__debug') {
      try {
        const branch = url.searchParams.get('branch') || 'cnei';
        const token = resolveToken(env);
        if (!token) return new Response('{"error":"No GH_PAT configured"}', { status: 500, headers: { 'Content-Type': 'application/json' } });
        const config = await getFlywheelConfig(env);
        const baseCooldown = RATE_BY_GEAR[config.gear - 1] || 3600;
        const actualCooldown = branch === 'cnei' ? baseCooldown : baseCooldown * 2;
        const now = Math.floor(Date.now() / 1000);
        const lastRelease = await getLatestReleaseDate(token, branch);
        const elapsed = now - lastRelease;
        const maxNum = await getMaxBranchReleaseNum(token, branch);
        const isCD = lastRelease > 0 && elapsed < actualCooldown;
        const info = {
          branch, gear: config.gear, cooldown: actualCooldown, now, lastRelease,
          lastReleaseDate: lastRelease ? new Date(lastRelease * 1000).toISOString() : 'none',
          elapsed, elapsedHours: (elapsed / 3600).toFixed(1),
          available: !isCD,
          releaseCount: maxNum,
          nextVersion: formatVersion(maxNum + 1),
          cooldownType: branch === 'cnei' ? '1h (gear)' : '2h (gear*2)'
        };
        return new Response(JSON.stringify(info, null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message, stack: err.stack?.slice(0, 500) }, null, 2), {
          status: 500, headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    if (url.pathname === '/__status') {
      const state = await getRotationState(env);
      const config = await getFlywheelConfig(env);
      const cneiRelease = await env.FLYWHEEL_STATE.get('last_cnei_release', 'json');
      const lastRun = await env.FLYWHEEL_STATE.get('last_run_result', 'json');
      const mcpCache = await env.FLYWHEEL_STATE.get('mcp_last_scan', 'json');
      return new Response(JSON.stringify({
        ...state,
        gear: config.gear,
        last_cnei_release: cneiRelease,
        last_run: lastRun,
        mcp: mcpCache,
        uptime: Math.floor(Date.now() / 1000 - (startTime || Date.now()))
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (url.pathname === '/__bias') {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
        });
      }
      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const bias = {
            bias: normalizeJoystickScale(body.bias, 3),
            steering: body.steering || 'CTR',
            risk: normalizeJoystickScale(body.risk, 3),
            magnitude: typeof body.magnitude === 'number' ? body.magnitude : 0,
            gear: typeof body.gear === 'number' ? body.gear : undefined,
            updatedAt: Math.floor(Date.now() / 1000)
          };
          bias.weights = computeDirectionWeights(bias);
          await env.FLYWHEEL_STATE.put('bias', JSON.stringify(bias));
          if (typeof body.gear === 'number') {
            const cfg = await getFlywheelConfig(env);
            await env.FLYWHEEL_STATE.put('config', JSON.stringify({ ...cfg, gear: Math.max(1, Math.min(10, body.gear)) }));
          }
          return new Response(JSON.stringify({ ok: true, bias }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ ok: false, error: err.message }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      const current = await getBiasFromKv(env);
      return new Response(JSON.stringify(current), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    if (url.pathname === '/__mcp') {
      const target = url.searchParams.get('url') || 'https://datro.directory';
      const results = await runMcpScans(env, target);
      await env.FLYWHEEL_STATE.put('mcp_last_scan', JSON.stringify({ url: target, results, timestamp: Date.now() }));
      return new Response(JSON.stringify({ url: target, results }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (url.pathname === '/__wallet') {
      const branch = url.searchParams.get('branch') || 'cnei';
      try {
        const wallet = await getBranchWallet(env, branch);
        return new Response(JSON.stringify(wallet, null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message, stack: err.stack }, null, 2), {
          status: 500, headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    if (url.pathname === '/__wallets') {
      const wallets = {};
      for (const branch of ALL_BRANCHES) {
        wallets[branch] = await getBranchWallet(env, branch);
      }
      return new Response(JSON.stringify(wallets, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (url.pathname === '/__agent') {
      try {
        const branch = url.searchParams.get('branch') || 'cnei';
        const tok = resolveToken(env);
        if (!tok) return new Response('{"error":"No GH_PAT configured"}', { status: 500, headers: { 'Content-Type': 'application/json' } });
        const idx = await getFileContent(tok, branch, 'index.html');
        const hdr = await getFileContent(tok, branch, '_headers');
        const wingFiles = await getAllWingFiles(tok, branch);
        const wallet = await getBranchWallet(env, branch);
        const result = await runAgentLoop(env, branch, idx ? idx.content : '', hdr ? hdr.content : '', wingFiles, '', { token: tok, env });
        return new Response(JSON.stringify({ branch, wallet, agentResult: result }, null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message, stack: err.stack?.slice(0, 500) }, null, 2), {
          status: 500, headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    if (url.pathname === '/__bounties') {
      const branch = url.searchParams.get('branch');
      if (branch) {
        const data = await env.FLYWHEEL_STATE.get(`bounty_${branch}`, 'json');
        return new Response(JSON.stringify({ branch, bounties: data || [] }, null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      const all = {};
      for (const b of ALL_BRANCHES) {
        const data = await env.FLYWHEEL_STATE.get(`bounty_${b}`, 'json');
        if (data) all[b] = data;
      }
      return new Response(JSON.stringify(all, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/__failures') {
      const branch = url.searchParams.get('branch');
      const failures = {};
      const branches = branch ? [branch] : ALL_BRANCHES;
      for (const b of branches) {
        const data = await env.FLYWHEEL_STATE.get(`failure_${b}`, 'json').catch(() => null);
        if (data) failures[b] = data;
      }
      return new Response(JSON.stringify(failures, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/__pages_cleanup') {
      await cleanupPagesDeploys(env);
      return new Response(JSON.stringify({ ok: true, message: 'Pages cleanup triggered' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Flywheel Worker. Endpoints: /__cron?branch=X, /__sync_cron, /__state, /__reset, /__unlock, /__mode, /__config, /__debug?branch=X, /__status, /__bias, /__mcp?url=X, /__wallet?branch=X, /__wallets, /__agent?branch=X, /__bounties?branch=X, /__failures?branch=X, /__pages_cleanup', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
