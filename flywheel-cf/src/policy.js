export const DEFAULT_GEAR = 3;
export const REGULAR_COOLDOWN_SECONDS = 2 * 60 * 60;
export const CRON_EXPRESSION = '*/2 * * * *';

export const RATE_BY_GEAR = Object.freeze([
  7200, 5400, 3600, 2400, 1800, 1200, 600, 300, 120, 60
]);

export const BRANCH_NUMBERS = Object.freeze({
  command: 1,
  'command-agent-endpoint': 2,
  cnei: 3,
  ceo: 4,
  financecheque: 5,
  'financecheque-monday-agent': 6,
  carfinancecheque: 7,
  bpvsbuckler: 8,
  'bpvsbuckler-redflag': 9,
  bucklervsbp: 10,
  rerelease: 11,
  wayback: 12,
  'gh-pages': 13,
  gui: 14,
  ui: 15,
  dash: 16,
  althea: 17,
  datro: 18,
  dcc: 19,
  ccan: 20,
  llmwiki: 21,
  pirateclaw: 22,
  whitepaper: 23,
  wave: 24,
  bw_base: 25,
  subrepos: 26
});

export const ALL_RELEASE_BRANCHES = Object.freeze(Object.keys(BRANCH_NUMBERS));
export const REGULAR_BRANCHES = Object.freeze(
  ALL_RELEASE_BRANCHES.filter((branch) => branch !== 'cnei')
);

export function normalizeGear(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_GEAR;
  return Math.max(1, Math.min(10, Math.trunc(numeric)));
}

export function cooldownForBranch(branch, gear = DEFAULT_GEAR) {
  if (branch !== 'cnei') return REGULAR_COOLDOWN_SECONDS;
  return RATE_BY_GEAR[normalizeGear(gear) - 1];
}

export function cadenceForGear(gear = DEFAULT_GEAR) {
  const normalizedGear = normalizeGear(gear);
  const cneiCooldownSec = cooldownForBranch('cnei', normalizedGear);
  return {
    gear: normalizedGear,
    regularCooldownSec: REGULAR_COOLDOWN_SECONDS,
    cneiCooldownSec,
    regularCooldownHuman: '2h',
    cneiCooldownHuman: `${Math.round(cneiCooldownSec / 60)}min`,
    cron: CRON_EXPRESSION,
    regularCadenceFixed: true,
    pattern: 'each regular branch is eligible exactly 2h after its latest canonical release; gear only affects cnei'
  };
}

export function branchNumber(branch) {
  const number = BRANCH_NUMBERS[branch];
  if (!number) throw new Error(`Unsupported release branch: ${branch}`);
  return number;
}

export function formatVersion(branch, releaseCounter) {
  const counter = Number(releaseCounter);
  if (!Number.isInteger(counter) || counter < 1 || counter > 9999) {
    throw new Error(`Invalid release counter for ${branch}: ${releaseCounter}`);
  }
  const high = Math.floor(counter / 100);
  const low = counter % 100;
  return `0.${branchNumber(branch)}.${high}.${String(low).padStart(2, '0')}`;
}

export function parseVersionNum(tagName, branch) {
  if (typeof tagName !== 'string') return null;
  const escapedBranch = branch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tagName.match(
    new RegExp(`^${escapedBranch}-v0\\.${branchNumber(branch)}\\.(0|[1-9]\\d*)\\.(\\d{2})$`)
  );
  if (!match) return null;
  const counter = Number(match[1]) * 100 + Number(match[2]);
  return counter <= 9999 ? counter : null;
}

export function assertSafeRepositoryPath(path) {
  if (typeof path !== 'string' || path.length === 0 || path.length > 240) {
    throw new Error('A repository-relative path is required');
  }
  if (path.startsWith('/') || path.includes('\\') || path.includes('\0') || path.includes('\n')) {
    throw new Error(`Unsafe repository path: ${path}`);
  }
  const segments = path.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..' || segment === '.git')) {
    throw new Error(`Unsafe repository path: ${path}`);
  }
  return path;
}

export function isReleaseArtifactPath(path) {
  assertSafeRepositoryPath(path);
  const basename = path.split('/').at(-1);
  if (basename === '.version' || basename === 'CHANGELOG.md' || basename === 'process_output.log') {
    return false;
  }
  return !/^(AGENT|CONTEXT|GLOSSARY|HEARTBEAT|IDENTITY|MASTERPLAN|MEMORY|PLAN|RESOURCES|RULES|SKILLS|SOUL|SPEC|TASKS|TEMPLATE)(\.[^.]+)?\.md$/i.test(basename);
}

export function applyExactReplacement(content, oldText, newText) {
  if (typeof content !== 'string' || typeof oldText !== 'string' || typeof newText !== 'string') {
    throw new Error('Exact replacement requires string content, old_text, and new_text');
  }
  if (oldText.length === 0) throw new Error('old_text cannot be empty');
  if (oldText === newText) throw new Error('old_text and new_text must differ');
  if (oldText.length > 30000 || newText.length > 60000) {
    throw new Error('Exact replacement exceeds the safe edit size');
  }

  let count = 0;
  let position = 0;
  while ((position = content.indexOf(oldText, position)) !== -1) {
    count += 1;
    position += oldText.length;
    if (count > 1) break;
  }
  if (count !== 1) {
    throw new Error(`old_text must match exactly once; found ${count}`);
  }
  return content.replace(oldText, newText);
}

export function parseAgentToolCall(reply) {
  if (typeof reply !== 'string') throw new Error('Tool reply must be text');
  const toolMatch = reply.match(/^TOOL:\s*([a-z][a-z0-9_]*)\s*$/im);
  if (!toolMatch) return null;

  const fenced = reply.match(/ARGS_JSON:\s*```(?:json)?\s*([\s\S]*?)```/i);
  const inline = reply.match(/ARGS_JSON:\s*(\{[^\n]*\})/i);
  const rawArgs = fenced?.[1]?.trim() || inline?.[1]?.trim();
  if (!rawArgs) throw new Error('Tool calls require ARGS_JSON with one JSON object');

  let args;
  try {
    args = JSON.parse(rawArgs);
  } catch (error) {
    throw new Error(`Invalid ARGS_JSON: ${error.message}`);
  }
  if (!args || Array.isArray(args) || typeof args !== 'object') {
    throw new Error('ARGS_JSON must be one JSON object');
  }
  return { name: toolMatch[1], args };
}

const ALWAYS_ADMIN_PATHS = new Set([
  '/__cron',
  '/__sync_cron',
  '/__reset',
  '/__unlock',
  '/__mcp',
  '/__agent',
  '/__pages_cleanup'
]);
const ADMIN_POST_PATHS = new Set(['/__mode', '/__config', '/__bias']);

export function requiresAdmin(pathname, method, proxyAction = '') {
  const normalizedMethod = String(method || 'GET').toUpperCase();
  if (normalizedMethod === 'OPTIONS') return false;
  if (ALWAYS_ADMIN_PATHS.has(pathname)) return true;
  if (ADMIN_POST_PATHS.has(pathname) && normalizedMethod !== 'GET') return true;
  return pathname === '/api/proxy'
    && normalizedMethod !== 'GET'
    && (proxyAction === 'register' || proxyAction === 'heartbeat');
}
