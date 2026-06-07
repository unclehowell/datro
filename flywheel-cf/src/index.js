const GITHUB_REPO = 'unclehowell/datro';
const GITLAWB_NODE = 'https://node.gitlawb.com';
const GITLAWB_BOUNTY_LIST_URL = `${GITLAWB_NODE}/api/v1/bounties`;

const ALL_BRANCHES = [
  "althea", "archives", "bpvsbuckler", "carfinancecheque",
  "ccan", "ceo", "dash", "datro", "dcc", "financecheque",
  "gui", "hbnb", "library", "llmwiki", "cnei",
  "subrepos", "ui", "wave", "wayback", "pirateclaw"
];

const REGULAR_BRANCHES = ALL_BRANCHES.filter(b => b !== 'cnei');

const HONCHO_TENANT_IDS = {
  bpvsbuckler: '0lCBWsZN-CS-DyY8THX7H',
  datro: 'Q-sPB_HUr__vWcP1cc-UQ',
  financecheque: 'oSx32NCcWFHT7gRXWtrGo',
};
const RATE_BY_GEAR = [600, 438, 320, 233, 170, 124, 91, 66, 48, 35]; // Compressed: gear1=10min, gear10~35s
const CNEI_RATIO = Math.floor(137 / REGULAR_BRANCHES.length); // 137/20 = 6
const DOMAIN = 'datro.directory';
const GITHUB_REPO_OBJ = { owner: 'unclehowell', repo: 'datro' };
const BRAIN_BRANCH = 'brain';

const startTime = Math.floor(Date.now() / 1000);

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
  const token = env.GITHUB_TOKEN;
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
  const honchoMem = await getHonchoMemory(env, branch);
  const brainMem = await getBrainSummary(token);
  const sciHub = await getSciHubIdeas(env, branch, category);
  const dailyDigest = await getDailyBestPractices(env);
  const wallet = await getBranchWallet(env, branch);

  const toolDescriptions = Object.entries(AGENT_TOOLS).map(([name, tool]) =>
    `- ${name}: ${tool.description}\n  Args: ${Object.keys(tool.args).length > 0 ? Object.entries(tool.args).map(([k, v]) => `${k} (${v})`).join(', ') : 'none'}`
  ).join('\n\n');

  const systemPrompt = `You are the autonomous agentic flywheel for the DATRO monorepo (${GITHUB_REPO}).

## Your Mission
Analyze branch "${branch}" deeply. You have ${maxIterations} tool iterations to investigate and make changes.
Use tools to read files, search code, run scans, and write changes. Commit changes via write_file as you go.

## Earn $GITLAWB While Working
You can earn gitlawb bounties (paid in $GITLAWB tokens on Base L2) by claiming and completing tasks during your release cycle:
1. **gitlawv_bounty_list** — find open bounties matching this branch's needs
2. **gitlawv_bounty_claim** — claim a bounty to signal you are working on it
3. **gitlawv_bounty_submit** — after committing changes, submit the commit URL as bounty completion
Between every branch release, try to claim at least one bounty. The payout goes to the branch wallet.

## Available Tools
${toolDescriptions}

## Context
- Branch: ${branch} (category: ${category})
- Wing files loaded: ${context.wingFiles}
- Wallet: ${wallet.address} (compute budget: ${wallet.computeBudget})
- Bias: ${bias?.bias || 3}/5, Risk: ${bias?.risk || 3}/5

## Memory
${honchoMem.slice(0, 1500)}
${brainMem ? '---\n' + brainMem.slice(0, 1000) : ''}

## Research
${sciHub.slice(0, 500)}
${dailyDigest.slice(0, 500)}

## Protocol
To use a tool, output:
TOOL: <tool_name>
ARG: key=value
ARG: key=value

When you have made all your changes and want to finish, output:
DONE
SUMMARY: <what you changed and why>

## Rules
- Use read_file and search_code first to understand the codebase
- Use brainstorm for creative thinking/planning
- Use write_file to commit changes (it commits immediately to GitHub)
- Make at least 1 real visual/functional change to index.html
- Don't just add meta tags — add real UI elements
- Max 3 write_file calls per run`;

  conversation.push(systemPrompt);
  conversation.push(`Current index.html:
\`\`\`html
${currentHtml.slice(0, 30000)}
\`\`\`

Live website:
\`\`\`html
${(liveHtml || '').slice(0, 8000)}
\`\`\`

_headers:
\`\`\`
${headersContent || '(empty)'}
\`\`\`

What improvements should I make? Investigate and then make changes.`);

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

    if (reply.startsWith('DONE')) {
      console.log('Agent finished');
      const summary = reply.match(/SUMMARY:\s*([\s\S]*?)$/);
      return {
        changes: committedFiles,
        summary: summary ? summary[1].trim() : 'Agent completed changes',
        html: currentHtml,
        bounty: agentBounty
      };
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
  
  for (const b of branches) {
    if (b.name === BRAIN_BRANCH) continue;
    const path = `static/${b.name}/MEMORY.md`;
    const memFile = await getFileContent(token, b.name, path);
    if (memFile) {
      consolidatedMemory += `## Branch: ${b.name}\n\n${memFile.content}\n\n---\n\n`;
    }
  }
  
  await createOrUpdateFile(token, BRAIN_BRANCH, 'BRAIN_CONSOLIDATED.md', consolidatedMemory, 'docs(brain): update consolidated memory');
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
  try {
    const tenantId = HONCHO_TENANT_IDS[branch] || 'datro';
    const resp = await fetch(`https://api.honcho.ai/v1/memories?workspace=${tenantId}&session=${branch}`, {
      headers: { 'Authorization': `Bearer ${env.HONCHO_API_KEY}` }
    });
    if (!resp.ok) return "No Honcho memory.";
    const data = await resp.json();
    return `## HONCHO PEER OBSERVATIONS (Durable Facts)\n${JSON.stringify(data.slice(-5), null, 2)}`;
  } catch (err) {
    console.log(`  Honcho lookup failed: ${err.message}`);
    return "No Honcho memory.";
  }
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
  await env.FLYWHEEL_STATE.delete('lock');
}

async function getRotationState(env) {
  try {
    const raw = await env.FLYWHEEL_STATE.get('rotation', 'json');
    if (raw) return { regular_index: 0, cnei_queue: 0, lap: 0, mode: 'AUTO', ...raw };
  } catch (_) {}
  return { regular_index: 0, cnei_queue: 0, lap: 0, mode: 'AUTO' };
}

async function getFlywheelConfig(env) {
  try {
    const raw = await env.FLYWHEEL_STATE.get('config', 'json');
    if (raw) return { gear: 3, ...raw };
  } catch (_) {}
  return { gear: 3 };
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

async function getMaxBranchReleaseNum(token, branch) {
  let max = 0, page = 1;
  while (true) {
    const resp = await ghFetch(
      `https://api.github.com/repos/${GITHUB_REPO}/git/matching-refs/tags/${encodeURIComponent(branch)}-v?per_page=100&page=${page}`,
      token
    );
    const refs = await resp.json();
    if (!Array.isArray(refs) || refs.length === 0) break;
    for (const r of refs) {
      const tagName = r.ref.replace('refs/tags/', '');
      if (tagName.startsWith(`${branch}-v`)) {
        const versionStr = tagName.split('-v')[1];
        const parts = versionStr.split('.').map(p => parseInt(p, 10));
        
        // Robust calculation: (major*1M) + (minor*10k) + (patch*100) + build
        let num = 0;
        if (parts.length >= 4) num = (parts[0]*1000000) + (parts[1]*10000) + (parts[2]*100) + parts[3];
        else if (parts.length >= 3) num = (parts[0]*10000) + (parts[1]*100) + parts[2];
        else if (parts.length >= 2) num = (parts[0]*100) + parts[1];
        else num = parts[0];

        console.log(`DEBUG: Parsing tag ${tagName} -> versionStr ${versionStr} -> parts ${parts} -> num ${num}`);
        if (num > max) max = num;
      }
    }
    if (refs.length < 100) break;
    page++;
  }
  console.log(`DEBUG: Max version num for ${branch} is ${max}`);
  return max;
}

async function getLatestReleaseDate(token, branch) {
  let page = 1;
  while (true) {
    const resp = await ghFetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=100&page=${page}`,
      token
    );
    const releases = await resp.json();
    if (!Array.isArray(releases) || releases.length === 0) break;
    for (const r of releases) {
      if (r.tag_name && r.tag_name.startsWith(`${branch}-v`) && !r.tag_name.endsWith('-aws') && r.published_at) {
        return new Date(r.published_at).getTime() / 1000;
      }
    }
    if (releases.length < 100) break;
    page++;
  }
  return 0;
}

async function isOnCooldown(token, branch, gear) {
  const baseCooldown = RATE_BY_GEAR[gear - 1] || 3600;
  const cooldown = branch === 'cnei' ? Math.floor(baseCooldown / 2) : baseCooldown;
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
  let branch;
  if (state.cnei_queue >= CNEI_RATIO) {
    branch = 'cnei';
    console.log('CNEI_QUEUE: >=' + CNEI_RATIO + ', selecting cnei branch');
    state.cnei_queue = 0;
  } else {
    const prevIndex = state.regular_index;
    branch = REGULAR_BRANCHES[state.regular_index % REGULAR_BRANCHES.length];
    state.regular_index = (state.regular_index + 1) % REGULAR_BRANCHES.length;
    if (state.regular_index <= prevIndex) state.lap = (state.lap || 0) + 1;
    state.cnei_queue = (state.cnei_queue || 0) + 1;
  }
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

async function getAllWingFiles(token, branch) {
  const sides = ['left', 'right', 'high', 'low'];
  const types = ['SPEC', 'AGENT', 'TASKS', 'README', 'MEMORY', 'PLAN', 'CHANGELOG'];
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

async function getBiasFromKv(env) {
  try {
    const raw = await env.FLYWHEEL_STATE.get('bias', 'json');
    if (raw && raw.bias) return { bias: 3, steering: 'CTR', risk: 3, ...raw };
  } catch (_) {}
  return { bias: 3, steering: 'CTR', risk: 3 };
}

function buildSystemPrompt(wingFiles, branch, category, bias) {
  const harnessRules = extractHarnessRules(wingFiles);
  const harnessPriorities = extractHarnessPriorities(wingFiles);
  const biasLabel = ({1:'STRICT LEFT',2:'FAVOUR LEFT',3:'NEUTRAL',4:'FAVOUR RIGHT',5:'STRICT RIGHT'})[bias?.bias || 3] || 'NEUTRAL';
  const steeringLabel = bias?.steering || 'CTR';
  const riskLabel = ({1:'LOW RISK',2:'FAVOUR LOW',3:'NEUTRAL',4:'FAVOUR HIGH',5:'HIGH RISK'})[bias?.risk || 3] || 'NEUTRAL';
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
  const token = env.GITHUB_TOKEN;
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
  console.log(`  Bias: ${bias?.bias || 3} (${bias?.steering || 'CTR'})`);

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

function extractVisualInstructions(wingFiles) {
  const instructions = { top: null, bottom: null, left: null, right: null };
  for (const [key, content] of Object.entries(wingFiles)) {
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      const barMatch = trimmed.match(/(\w+)\s*bar\s*(?:at\s+)?(?:the\s+)?(top|bottom|left|right)/);
      if (barMatch) {
        const color = barMatch[1];
        const position = barMatch[2];
        instructions[position] = color;
      }
      const stripMatch = trimmed.match(/(\w+)\s*strip(?:p?e?d?)?\s*(?:at\s+)?(?:the\s+)?(top|bottom|left|right)/);
      if (stripMatch) {
        const color = stripMatch[1];
        const position = stripMatch[2];
        instructions[position] = color;
      }
    }
  }
  return instructions;
}

function injectVisualBars(html, instructions) {
  let modified = html;
  const positions = { top: '0, 0, auto, 0', bottom: 'auto, 0, 0, 0', left: '0, auto, 0, 0', right: '0, 0, 0, auto' };
  const sizes = { top: 'height: 6px', bottom: 'height: 6px', left: 'width: 6px', right: 'width: 6px' };

  for (const [pos, color] of Object.entries(instructions)) {
    if (!color) continue;
    const cssColor = color;
    const inset = positions[pos];
    const size = sizes[pos];
    const barHtml = `<div class="cnei-bar cnei-bar-${pos}" style="position:fixed;${size};${inset};background:${cssColor};z-index:9999;pointer-events:none"></div>`;
    if (!modified.includes(`cnei-bar-${pos}`)) {
      modified = modified.replace('</body>', `${barHtml}\n</body>`);
    }
  }
  return modified;
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

async function findAndApplyBestPractice(token, branch) {
  console.log(`Analyzing ${branch} for best-practice improvements`);

  // Read TASKS.md to skip already-completed items
  const completedTasks = await readTASKS(token, branch);
  if (completedTasks.length > 0) {
    console.log(`Found ${completedTasks.length} completed tasks in TASKS.md`);
  }

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
  const token = env.GITHUB_TOKEN;
  console.log(`Processing branch: ${branch}`);

  // Check branch exists
  const resp = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/refs/heads/${encodeURIComponent(branch)}`,
    { headers: ghHeaders(token) }
  );
  if (!resp.ok) {
    console.log(`Branch ${branch} does not exist, skipping`);
    return { tagName: null, error: 'branch_not_found' };
  }

  const maxNum = await getMaxBranchReleaseNum(token, branch);
  const nextNum = maxNum + 1;
  const version = formatVersion(nextNum);
  const tagName = `${branch}-v${version}`;
  console.log(`Max release num: ${maxNum}, Next: ${tagName}`);

  // For cnei, apply self-improvements first
  let selfImprovements = null;
  if (branch === 'cnei') {
    selfImprovements = await applySelfImprovements(token, branch);
  }

  // Run MCP scans for data-driven UX/bug insight
  const branchUrl = `https://${branch}.${DOMAIN || 'datro.directory'}`;
  const mcpResults = await runMcpScans(env, branchUrl);
  const mcpSection = formatMcpReleaseNotes(mcpResults, branch);

  // ── MASTER RECORD VISUALS (wing file → visual HTML injection) ──
  const visualWingFiles = await getAllWingFiles(token, branch);
  const visualInstructions = extractVisualInstructions(visualWingFiles);
  const hasVisuals = Object.values(visualInstructions).some(v => v);
  let visualHtmlChanged = false;
  if (hasVisuals) {
    const idxFile = await getFileContent(token, branch, 'index.html');
    if (idxFile) {
      const newHtml = injectVisualBars(idxFile.content, visualInstructions);
      if (newHtml !== idxFile.content) {
        await createCommit(token, branch, 'index.html', newHtml, 'chore: apply master record visual bars from wing files');
        console.log(`Injected master record visuals: ${JSON.stringify(visualInstructions)}`);
        visualHtmlChanged = true;
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
  } catch (e) { console.log(`Could not fetch live site for ${branch}: ${e.message}`); }

  // ── AGENTIC AI ENGINE (chain-of-thought with tool use) ──
  let commitSha = null;
  let releaseNotes = '';
  const wallet = await getBranchWallet(env, branch);

  const agentResult = await runAgentLoop(env, branch, idxHtml, hdrContent, visualWingFiles, liveHtml, { token, env });

  if (agentResult && agentResult.changes.length > 0) {
    // Get latest commit SHA for tagging
    const headResp = await ghFetch(
      `https://api.github.com/repos/${GITHUB_REPO}/git/refs/heads/${encodeURIComponent(branch)}`,
      token
    );
    const headData = await headResp.json();
    commitSha = headData.object.sha;

    // Build release notes from agent summary
    const committedPaths = agentResult.changes.map(c => `- \`${c.path}\``).join('\n');
    let bountyText = '';
    if (agentResult.bounty) {
      if (agentResult.bounty.action === 'claimed') {
        bountyText = `\n### Gitlawv Bounty\n- Claimed bounty \`${agentResult.bounty.bountyId}\` on \`${agentResult.bounty.branch}\`\n- Wallet: \`${wallet.address}\` will receive $GITLAWB on completion`;
      } else if (agentResult.bounty.action === 'submitted') {
        bountyText = `\n### Gitlawv Bounty\n- Submitted bounty \`${agentResult.bounty.bountyId}\` — ${agentResult.bounty.submissionUrl}\n- Wallet: \`${wallet.address}\` pending $GITLAWB payout`;
      }
    }
    releaseNotes = [
      `## Agentic Release: ${tagName}`,
      ``,
      `The autonomous agent analyzed \`${branch}\` using ${Object.keys(AGENT_TOOLS).length} MCP tools.`,
      ``,
      `### Files Changed`,
      committedPaths,
      ``,
      `### Agent Summary`,
      agentResult.summary || 'No summary provided.',
      ``,
      `### Wallet`,
      `- Branch wallet: ${wallet.address}`,
      `- Compute budget: ${wallet.computeBudget}`,
      bountyText,
      ``,
      mcpSection
    ].join('\n');

    // Write MEMORY.md
    const cycleNum = await getNextCycleNum(token, branch);
    const agentLesson = `Agentic engine: ${agentResult.changes.length} file(s) committed to \`${branch}\`. Wallet: ${wallet.address}. Summary: ${agentResult.summary || ''}`;
    const pseudoBp = {
      name: `agent: ${committedPaths.slice(0, 80)}`,
      description: `Applied ${agentResult.changes.length} agent commits to ${branch}`,
      source: 'Agentic Flywheel (ReAct loop + MCP tools)'
    };
    await writeMEMORY(token, branch, cycleNum, pseudoBp, agentLesson);

    // Tag release and verify
    await createGitTag(token, tagName, commitSha);
    const release = await createGitHubRelease(token, tagName, branch, version, releaseNotes);
    if (release) {
      await verifyRelease(token, tagName);
    }

    console.log(`Agentic release ${tagName}: ${agentResult.changes.length} files committed`);

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
      console.log(`Bounty ${agentResult.bounty.action}: ${agentResult.bounty.bountyId} on ${branch}`);
    }
    return { tagName, version, type: 'agent', changes: agentResult.changes, aiError: null, selfImprovements, wallet: wallet.address };
  }

  // ── FALLBACK: Best-practice engine ──
  console.log(`Falling back to best-practice engine for ${branch}`);
  const bpResult = await findAndApplyBestPractice(token, branch);

  if (bpResult) {
    const enhancedNotes = bpResult.notes + '\n\n' + mcpSection;
    await createGitTag(token, tagName, bpResult.commit);
    const release = await createGitHubRelease(token, tagName, branch, version, enhancedNotes);
    if (release) await verifyRelease(token, tagName);
    console.log(`Best-practice release ${tagName}: ${bpResult.bestPractice.name}`);
    return { tagName, version, type: 'best-practice', aiError: null, selfImprovements, wallet: wallet.address };
  }

  // ── FALLBACK: Audit-only release ──
  console.log(`No improvements found, audit-only release for ${branch}`);
  const notes = [
    `## [${tagName}]`,
    ``,
    `### Changed`,
    `- Agentic analysis: no changes needed after tool-based investigation`,
    `- Best-practice audit: no Tier 1-2 gaps found in \`index.html\``,
    `- Branch wallet: ${wallet.address} (compute: ${wallet.computeBudget})`,
    ``,
    `### Audit Summary`,
    `- Branch: \`${branch}\``,
    `- Category: ${computeBranchCategory(branch)}`,
    `- Best practices checked: ${BEST_PRACTICES.length}`,
    ``,
    mcpSection
  ].join('\n');
  commitSha = commitSha || await getDefaultBranchSha(token, branch);
  await createGitTag(token, tagName, commitSha);
  const auditRelease = await createSimpleRelease(token, branch, tagName, version, notes);
  if (auditRelease) await verifyRelease(token, tagName);
  console.log(`Audit-only release ${tagName}`);
  return { tagName, version, type: 'audit-only', aiError: null, selfImprovements, wallet: wallet.address };
}

async function triggerOtaAfterCneiRelease(env, tagName) {
  await env.FLYWHEEL_STATE.put('last_cnei_release', JSON.stringify({
    tag: tagName,
    timestamp: Math.floor(Date.now() / 1000),
    commit_sha: null
  }));
  console.log(`Recorded cnei release ${tagName} in KV for OTA detection`);
}

async function findAvailableBranch(state, token, gear) {
  const savedState = { regular_index: state.regular_index, cnei_queue: state.cnei_queue, lap: state.lap, mode: state.mode };
  for (let attempt = 0; attempt < 40; attempt++) {
    const branch = selectBranch(state);
    const onCooldown = await isOnCooldown(token, branch, gear);
    if (!onCooldown) return branch;
  }
  console.log('All branches on cooldown, skipping run');
  state.regular_index = savedState.regular_index;
  state.cnei_queue = savedState.cnei_queue;
  state.lap = savedState.lap;
  return null;
}

async function runFlywheel(env, forcedBranch) {
  console.log(`Flywheel triggered at ${new Date().toISOString()}`);
  if (!env.GITHUB_TOKEN) { console.error('GITHUB_TOKEN not configured'); return; }

  const locked = await acquireLock(env);
  if (!locked) { console.log('Another invocation in progress, skipping'); return; }

  // Update brain memory
  try {
      await aggregateMemory(env.GITHUB_TOKEN);
  } catch (e) {
      console.log(`Memory aggregation skipped: ${e.message}`);
  }

  try {
    const state = await getRotationState(env);
    const config = await getFlywheelConfig(env);
    const bias = await getBiasFromKv(env);

    // ── BURST MODE: auto-advance gear based on bias/risk/wallet ──
    // Progressive bias (1-2) → faster releases. Conservative (4-5) → slower.
    // High risk tolerance → faster. High compute budget per branch → faster.
    let effectiveGear = config.gear;
    if ((bias?.bias || 3) <= 2) effectiveGear = Math.min(10, effectiveGear + 2);
    if ((bias?.risk || 3) >= 4) effectiveGear = Math.min(10, effectiveGear + 1);

    // Sample a wallet to see average compute budget
    try {
      const sampleWallet = await getBranchWallet(env, REGULAR_BRANCHES[state.regular_index % REGULAR_BRANCHES.length]);
      if (sampleWallet.computeBudget > 5000) effectiveGear = Math.min(10, effectiveGear + 1);
    } catch (_) {}

    console.log(`State: idx=${state.regular_index} cnei=${state.cnei_queue} lap=${state.lap} mode=${state.mode} baseGear=${config.gear} effectiveGear=${effectiveGear}`);

    if (state.mode === 'PAUSED' && !forcedBranch) {
      console.log('Flywheel paused, skipping');
      return;
    }

    let branch;
    if (forcedBranch) {
      branch = forcedBranch;
      console.log(`Forced branch: ${branch}`);
    } else {
      branch = await findAvailableBranch(state, env.GITHUB_TOKEN, effectiveGear);
      if (!branch) {
        // If no branch available, force cnei for self-improvement
        const cneiCD = await isOnCooldown(env.GITHUB_TOKEN, 'cnei', effectiveGear);
        if (!cneiCD) {
          branch = 'cnei';
          console.log('No regular branch available, forcing cnei self-improvement');
        } else {
          console.log('No available branch found');
          return;
        }
      }
    }

    const savedState = { regular_index: state.regular_index, cnei_queue: state.cnei_queue, lap: state.lap, mode: state.mode };
    console.log(`Selected branch: ${branch}`);

    const result = await processBranch(env, branch);
    console.log(`Result: ${JSON.stringify(result)}`);

    await env.FLYWHEEL_STATE.put('last_run_result', JSON.stringify({
      branch,
      tagName: result?.tagName,
      version: result?.version,
      type: result?.type,
      timestamp: Math.floor(Date.now() / 1000)
    }));

    if (result && (result.error === 'branch_not_found' || !result.error)) {
      await saveRotationState(env, savedState);
      if (branch === 'cnei' && result.tagName && !result.error) {
        await triggerOtaAfterCneiRelease(env, result.tagName);
      }
    }
  } catch (err) {
    console.error(`Fatal error: ${err.message}`);
    console.error(err.stack);
  } finally {
    await releaseLock(env);
  }
}

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
      const state = { regular_index: 0, cnei_queue: 0, lap: 0, mode: 'AUTO' };
      await saveRotationState(env, state);
      return new Response('State reset', { status: 200 });
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
          const updated = { ...current, ...body };
          await env.FLYWHEEL_STATE.put('config', JSON.stringify(updated));
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
      const branch = url.searchParams.get('branch') || 'cnei';
      const config = await getFlywheelConfig(env);
      const cooldown = RATE_BY_GEAR[config.gear - 1] || 3600;
      const cneiCooldown = Math.floor(cooldown / 2);
      const actualCooldown = branch === 'cnei' ? cneiCooldown : cooldown;
      const now = Math.floor(Date.now() / 1000);
      const lastRelease = await getLatestReleaseDate(env.GITHUB_TOKEN, branch);
      const elapsed = now - lastRelease;
      const maxNum = await getMaxBranchReleaseNum(env.GITHUB_TOKEN, branch);
      const isCD = lastRelease > 0 && elapsed < actualCooldown;
      const info = {
        branch, gear: config.gear, cooldown: actualCooldown, now, lastRelease,
        lastReleaseDate: lastRelease ? new Date(lastRelease * 1000).toISOString() : 'none',
        elapsed, elapsedHours: (elapsed / 3600).toFixed(1),
        available: !isCD,
        releaseCount: maxNum,
        nextVersion: formatVersion(maxNum + 1),
        cooldownType: branch === 'cnei' ? 'half-gear' : 'gear-based'
      };
      return new Response(JSON.stringify(info, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
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
          const bias = { bias: body.bias || 3, steering: body.steering || 'CTR', risk: body.risk || 3 };
          await env.FLYWHEEL_STATE.put('bias', JSON.stringify(bias));
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
      const branch = url.searchParams.get('branch') || 'cnei';
      const prompt = url.searchParams.get('prompt') || 'Analyze this branch and suggest improvements';
      const idx = await getFileContent(env.GITHUB_TOKEN, branch, 'index.html');
      const hdr = await getFileContent(env.GITHUB_TOKEN, branch, '_headers');
      const wingFiles = await getAllWingFiles(env.GITHUB_TOKEN, branch);
      const wallet = await getBranchWallet(env, branch);
      const result = await runAgentLoop(env, branch, idx ? idx.content : '', hdr ? hdr.content : '', wingFiles, '', { token: env.GITHUB_TOKEN, env });
      return new Response(JSON.stringify({ branch, wallet, agentResult: result }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
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

    return new Response('Flywheel Worker. Endpoints: /__cron?branch=X, /__sync_cron, /__state, /__reset, /__mode, /__config, /__debug?branch=X, /__status, /__bias, /__mcp?url=X, /__wallet?branch=X, /__wallets, /__agent?branch=X, /__bounties?branch=X', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
