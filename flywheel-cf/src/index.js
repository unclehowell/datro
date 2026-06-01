const GITHUB_REPO = 'unclehowell/datro';

const ALL_BRANCHES = [
  "althea", "archives", "bpvsbuckler", "carfinancecheque",
  "ccan", "ceo", "dash", "datro", "dcc", "financecheque",
  "gui", "hbnb", "library", "llmwiki", "cnei",
  "subrepos", "ui", "wave", "wayback", "pirateclaw"
];

const REGULAR_BRANCHES = ALL_BRANCHES.filter(b => b !== 'cnei');
const COOLDOWN_SECONDS = 3600;
const CNEI_COOLDOWN = 1800;
const DOMAIN = 'datro.directory';
const GITHUB_REPO_OBJ = { owner: 'unclehowell', repo: 'datro' };

const startTime = Math.floor(Date.now() / 1000);

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
      return new Response(JSON.stringify({ version: '0.0.0.03', sourceSha: 'SOURCE_SHA_PLACEHOLDER' }), {
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
    if (raw) return raw;
  } catch (_) {}
  return { regular_index: 0, cnei_queue: 0 };
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
      runMcpScan(env, toolId, targetUrl).then(r => { results[toolId] = r; })
    );
  }
  await Promise.allSettled(promises);
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
  let count = 0, page = 1;
  while (true) {
    const resp = await ghFetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=100&page=${page}`,
      token
    );
    const releases = await resp.json();
    if (!Array.isArray(releases) || releases.length === 0) break;
    for (const r of releases) {
      if (r.tag_name && r.tag_name.startsWith(`${branch}-v`)) {
        count++;
      }
    }
    if (releases.length < 100) break;
    page++;
  }
  return count;
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

async function isOnCooldown(token, branch) {
  const cooldown = branch === 'cnei' ? CNEI_COOLDOWN : COOLDOWN_SECONDS;
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
  if (state.cnei_queue >= 1) {
    branch = 'cnei';
    console.log('CNEI_QUEUE: >=1, selecting cnei branch for self-improvement');
    state.cnei_queue = 0;
  } else {
    branch = REGULAR_BRANCHES[state.regular_index % REGULAR_BRANCHES.length];
    state.regular_index = (state.regular_index + 1) % REGULAR_BRANCHES.length;
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
  const sides = ['left', 'right'];
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

async function getPreviousReleaseNotes(token, branch, count = 15) {
  const notes = [];
  let page = 1;
  while (notes.length < count) {
    const resp = await ghFetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=100&page=${page}`,
      token
    );
    const releases = await resp.json();
    if (!Array.isArray(releases) || releases.length === 0) break;
    for (const r of releases) {
      if (r.tag_name && r.tag_name.startsWith(`${branch}-v`) && !r.tag_name.endsWith('-aws') && r.body) {
        const summary = r.body.replace(/```[\s\S]*?```/g, '').replace(/#{1,6}\s/g, '').trim().slice(0, 500);
        notes.push(`- ${r.tag_name}: ${summary}`);
        if (notes.length >= count) break;
      }
    }
    if (releases.length < 100) break;
    page++;
  }
  return notes;
}

function buildSystemPrompt(wingFiles, branch, category) {
  const harnessRules = extractHarnessRules(wingFiles);
  const harnessPriorities = extractHarnessPriorities(wingFiles);
  return `You are the release engineer for the DATRO monorepo. Each branch has its own website on Cloudflare Pages.

Your task: analyze branch "${branch}" (category: ${category}) and propose ONE unique, tailored improvement.

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

function buildUserPrompt(html, headers, releaseNotes) {
  const notesText = releaseNotes.length > 0 ? releaseNotes.slice(0, 15).join('\n') : '(no previous releases)';
  return `## CURRENT index.html
\`\`\`html
${html}
\`\`\`

## CURRENT _headers
\`\`\`
${headers || '(empty — no _headers file)'}
\`\`\`

## PREVIOUS RELEASES (DO NOT REPEAT ANY OF THESE)
${notesText}

Analyze this branch deeply. Read the HTML carefully. Check for:
1. Missing responsive/mobile features (viewport, media queries, touch targets)
2. Accessibility gaps (aria labels, focus management, semantic HTML)
3. Performance issues (render-blocking resources, image optimization)
4. Security gaps (missing headers, inline scripts)
5. UX improvements (navigation, forms, content structure)
6. Cross-platform/browser compatibility
7. Missing standard meta tags or structured data
8. Opportunities for progressive enhancement

Propose your best change using the ---CHANGE--- format. One change block per proposal. Up to 3 bugs + 1 feature.`;
}

async function queryFinancechequeAPI(systemPrompt, userPrompt, timeoutMs = 120000) {
  const startTimeAI = Date.now();
  const payload = {
    message: `${systemPrompt}\n\n${userPrompt}`,
    chat_only: true,
    model: 'openrouter/anthropic/claude-sonnet'
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch('https://www.financecheque.uk/api/proxy?action=chat', {
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

  const releaseNotes = await getPreviousReleaseNotes(token, branch, 15);
  console.log(`  Loaded ${releaseNotes.length} previous release notes`);
  const category = computeBranchCategory(branch);

  // Build prompts
  const systemPrompt = buildSystemPrompt(wingFiles, branch, category);
  const userPrompt = buildUserPrompt(html, headers, releaseNotes);

  console.log(`  System prompt: ${systemPrompt.length} chars, User prompt: ${userPrompt.length} chars`);

  // Query the AI (up to 2 min for deep analysis)
  const result = await queryFinancechequeAPI(systemPrompt, userPrompt, 120000);
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

  // ── TRY AI ENGINE FIRST (bespoke, tailored release) ──
  let releaseType = null;
  let commitSha = null;
  let releaseNotes = '';

  const aiResult = await processBranchWithAI(env, branch);

  if (aiResult && !aiResult.error && aiResult.changes.length > 0) {
    // Apply AI changes — apply all changes to index.html
    let currentHtml = aiResult.html;
    const appliedChanges = [];
    for (const change of aiResult.changes) {
      if (currentHtml.includes(change.search)) {
        currentHtml = currentHtml.replace(change.search, change.replace);
        appliedChanges.push(change);
        console.log(`  Applied AI change: ${change.title}`);
      }
    }

    if (appliedChanges.length > 0) {
      // Commit the changes
      const bugFixes = appliedChanges.filter(c => c.type === 'bug');
      const features = appliedChanges.filter(c => c.type === 'feature');
      const commitMsg = `feat(${branch}): AI release — ${features.map(f => f.title).join(', ')}${bugFixes.length > 0 ? '; fixes: ' + bugFixes.map(b => b.title).join(', ') : ''}`;

      const commit = await createCommit(token, branch, 'index.html', currentHtml, commitMsg);
      commitSha = commit.sha;

      // Build release notes
      const changesText = appliedChanges.map(c =>
        `### ${c.type === 'feature' ? '✨ Feature' : '🐛 Bug Fix'}: ${c.title}\n${c.description}`
      ).join('\n\n');
      releaseNotes = [
        `## AI-Powered Release: ${tagName}`,
        ``,
        `After deep analysis of the \`${branch}\` branch website, wing file harness, and ${aiResult.changes.length} previous releases, the AI identified and applied ${appliedChanges.length} unique, tailored improvement(s).`,
        ``,
        changesText,
        ``,
        `### AI Analysis`,
      `- Wing files loaded: ${Object.keys(aiResult.wingFiles || {}).length || 0}`,
      `- Previous releases analyzed: ${(await getPreviousReleaseNotes(token, branch, 1)).length || 0}`,
      `- AI query elapsed: ${((aiResult.aiResult?.elapsed || 0) / 1000).toFixed(1)}s`,
        ``,
        mcpSection
      ].join('\n');

      await createGitTag(token, tagName, commitSha);
      const release = await createGitHubRelease(token, tagName, branch, version, releaseNotes);
      if (release) await verifyRelease(token, tagName);
      releaseType = 'ai';

      console.log(`AI release ${tagName}: ${appliedChanges.length} changes applied`);
      return { tagName, version, type: 'ai', changes: appliedChanges, aiError: null, selfImprovements };
    }
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
    return { tagName, version, type: 'best-practice', aiError: aiResult?.error || null, selfImprovements };
  }

  // ── FALLBACK: Audit-only release ──
  console.log(`No improvements found, audit-only release for ${branch}`);
  const notes = [
    `## [${tagName}]`,
    ``,
    `### Changed`,
    `- AI analysis: ${aiResult?.error ? `failed (${aiResult.error})` : 'no changes needed'}`,
    `- Best-practice audit: no Tier 1-2 gaps found in \`index.html\``,
    `- Branch-specific cache/header review complete`,
    `- Continuous integration release for ${branch}`,
    ``,
    `### Audit Summary`,
    `- Branch: \`${branch}\``,
    `- Category: ${computeBranchCategory(branch)}`,
    `- Best practices checked: ${BEST_PRACTICES.length}`,
    `- AI error: ${aiResult?.error || 'none'}`,
    ``,
    mcpSection
  ].join('\n');
  commitSha = commitSha || await getDefaultBranchSha(token, branch);
  await createGitTag(token, tagName, commitSha);
  const auditRelease = await createSimpleRelease(token, branch, tagName, version, notes);
  if (auditRelease) await verifyRelease(token, tagName);
  console.log(`Audit-only release ${tagName}`);
  return { tagName, version, type: 'audit-only', aiError: aiResult?.error || null, selfImprovements };
}

async function triggerOtaAfterCneiRelease(env, tagName) {
  await env.FLYWHEEL_STATE.put('last_cnei_release', JSON.stringify({
    tag: tagName,
    timestamp: Math.floor(Date.now() / 1000),
    commit_sha: null
  }));
  console.log(`Recorded cnei release ${tagName} in KV for OTA detection`);
}

async function findAvailableBranch(state, token) {
  const savedState = { regular_index: state.regular_index, cnei_queue: state.cnei_queue };
  for (let attempt = 0; attempt < 40; attempt++) {
    const branch = selectBranch(state);
    const onCooldown = await isOnCooldown(token, branch);
    if (!onCooldown) return branch;
  }
  console.log('All branches on cooldown, skipping run');
  state.regular_index = savedState.regular_index;
  state.cnei_queue = savedState.cnei_queue;
  return null;
}

async function runFlywheel(env) {
  console.log(`Flywheel triggered at ${new Date().toISOString()}`);
  if (!env.GITHUB_TOKEN) { console.error('GITHUB_TOKEN not configured'); return; }

  const locked = await acquireLock(env);
  if (!locked) { console.log('Another invocation in progress, skipping'); return; }

  try {
    const state = await getRotationState(env);
    console.log(`State before: regular_index=${state.regular_index}, cnei_queue=${state.cnei_queue}`);

    const branch = await findAvailableBranch(state, env.GITHUB_TOKEN);
    if (!branch) { console.log('No available branch found'); return; }

    const savedState = { regular_index: state.regular_index, cnei_queue: state.cnei_queue };
    console.log(`Selected branch: ${branch}`);

    const result = await processBranch(env, branch);
    console.log(`Result: ${JSON.stringify(result)}`);

    // Store last run result for /__status endpoint
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
      ctx.waitUntil(runFlywheel(env));
      return new Response('Triggered', { status: 200 });
    }
    if (url.pathname === '/__sync_cron') {
      await runFlywheel(env);
      return new Response('Sync run completed', { status: 200 });
    }
    if (url.pathname === '/__state') {
      const state = await getRotationState(env);
      const cneiRelease = await env.FLYWHEEL_STATE.get('last_cnei_release', 'json');
      return new Response(JSON.stringify({ ...state, last_cnei_release: cneiRelease }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (url.pathname === '/__reset') {
      const state = { regular_index: 0, cnei_queue: 0 };
      await saveRotationState(env, state);
      return new Response('State reset', { status: 200 });
    }
    if (url.pathname === '/__debug') {
      const branch = url.searchParams.get('branch') || 'cnei';
      const cooldown = branch === 'cnei' ? CNEI_COOLDOWN : COOLDOWN_SECONDS;
      const now = Math.floor(Date.now() / 1000);
      const lastRelease = await getLatestReleaseDate(env.GITHUB_TOKEN, branch);
      const elapsed = now - lastRelease;
      const maxNum = await getMaxBranchReleaseNum(env.GITHUB_TOKEN, branch);
      const isCD = lastRelease > 0 && elapsed < cooldown;
      const info = {
        branch, cooldown, now, lastRelease,
        lastReleaseDate: lastRelease ? new Date(lastRelease * 1000).toISOString() : 'none',
        elapsed, elapsedHours: (elapsed / 3600).toFixed(1),
        available: !isCD,
        releaseCount: maxNum,
        nextVersion: formatVersion(maxNum + 1),
        cooldownType: branch === 'cnei' ? '30min' : '1h'
      };
      return new Response(JSON.stringify(info, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (url.pathname === '/__status') {
      const state = await getRotationState(env);
      const cneiRelease = await env.FLYWHEEL_STATE.get('last_cnei_release', 'json');
      const lastRun = await env.FLYWHEEL_STATE.get('last_run_result', 'json');
      const mcpCache = await env.FLYWHEEL_STATE.get('mcp_last_scan', 'json');
      return new Response(JSON.stringify({
        ...state,
        last_cnei_release: cneiRelease,
        last_run: lastRun,
        mcp: mcpCache,
        uptime: Math.floor(Date.now() / 1000 - (startTime || Date.now()))
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
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

    return new Response('Flywheel Worker. Endpoints: /__cron, /__sync_cron, /__state, /__reset, /__debug?branch=X, /__status, /__mcp?url=X', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
