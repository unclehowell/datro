import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_GEAR,
  REGULAR_COOLDOWN_SECONDS,
  applyExactReplacement,
  cadenceForGear,
  cooldownForBranch,
  formatVersion,
  isReleaseArtifactPath,
  parseAgentToolCall,
  parseVersionNum,
  requiresAdmin
} from '../src/policy.js';

test('regular branch eligibility remains exactly two hours at every gear', () => {
  assert.equal(DEFAULT_GEAR, 3);
  for (let gear = 1; gear <= 10; gear += 1) {
    assert.equal(cooldownForBranch('financecheque', gear), REGULAR_COOLDOWN_SECONDS);
    assert.equal(cadenceForGear(gear).regularCooldownSec, REGULAR_COOLDOWN_SECONDS);
  }
  assert.equal(cadenceForGear().cron, '*/2 * * * *');
});

test('canonical versions use the mandatory branch number and ignore legacy tags', () => {
  assert.equal(formatVersion('cnei', 1), '0.3.0.01');
  assert.equal(formatVersion('cnei', 252), '0.3.2.52');
  assert.equal(formatVersion('financecheque', 7), '0.5.0.07');
  assert.equal(parseVersionNum('cnei-v0.3.2.52', 'cnei'), 252);
  assert.equal(parseVersionNum('cnei-v0.0.300.03', 'cnei'), null);
  assert.equal(parseVersionNum('cnei-v0.0.2.20', 'cnei'), null);
  assert.equal(parseVersionNum('financecheque-v0.5.0.07', 'cnei'), null);
});

test('exact replacement preserves multiline files and rejects ambiguous edits', () => {
  const before = 'header\nold line one\nold line two\nfooter\n';
  const after = applyExactReplacement(before, 'old line one\nold line two', 'new line one\nnew line two');
  assert.equal(after, 'header\nnew line one\nnew line two\nfooter\n');
  assert.throws(() => applyExactReplacement('same same', 'same', 'new'), /exactly once/);
  assert.throws(() => applyExactReplacement(before, 'missing', 'new'), /found 0/);
});

test('tool parser accepts JSON-escaped multiline exact replacements', () => {
  const call = parseAgentToolCall(`TOOL: replace_exact
ARGS_JSON:
\`\`\`json
{"path":"index.html","old_text":"one\\ntwo","new_text":"one\\nthree","message":"fix(cnei): exact edit"}
\`\`\``);
  assert.deepEqual(call, {
    name: 'replace_exact',
    args: {
      path: 'index.html',
      old_text: 'one\ntwo',
      new_text: 'one\nthree',
      message: 'fix(cnei): exact edit'
    }
  });
  assert.throws(
    () => parseAgentToolCall('TOOL: replace_exact\nARG: content=collapsed'),
    /ARGS_JSON/
  );
});

test('operator mutations require admin auth while status reads remain public', () => {
  assert.equal(requiresAdmin('/__cron', 'GET'), true);
  assert.equal(requiresAdmin('/__config', 'POST'), true);
  assert.equal(requiresAdmin('/__config', 'GET'), false);
  assert.equal(requiresAdmin('/__status', 'GET'), false);
  assert.equal(requiresAdmin('/__state', 'GET'), false);
  assert.equal(requiresAdmin('/api/proxy', 'POST', 'register'), true);
  assert.equal(requiresAdmin('/api/proxy/v1/chat/completions', 'POST'), false);
});

test('bookkeeping-only files cannot qualify an agent release', () => {
  assert.equal(isReleaseArtifactPath('index.html'), true);
  assert.equal(isReleaseArtifactPath('flywheel-cf/src/index.js'), true);
  assert.equal(isReleaseArtifactPath('CHANGELOG.md'), false);
  assert.equal(isReleaseArtifactPath('static/cnei/MEMORY.md'), false);
  assert.equal(isReleaseArtifactPath('static/cnei/TASKS.left.md'), false);
});
