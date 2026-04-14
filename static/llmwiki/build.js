#!/usr/bin/env node
// build.js — Cloudflare Pages build script
// Runs rebuild.sh for every section that has one

import { execSync } from 'child_process';
import { readdirSync, statSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { processIntray, checkWayback } from './process-intray.js';

const ROOT = new URL('.', import.meta.url).pathname;

// Step 1: classify and move any files in _intray/
await processIntray();

// Step 2: check wayback for existing versions and patch releasenotes
async function patchReleasenotes(latestDir, sectionName) {
  const rnPath = join(latestDir, 'source', 'releasenotes.md');
  if (!existsSync(rnPath)) return;
  const archived = await checkWayback(sectionName.replace(/_/g, '-'));
  if (!archived.length) return;

  let rn = readFileSync(rnPath, 'utf8');
  const links = archived.map(f =>
    `| [${f}](https://wayback.financecheque.xyz/wayback/${f}) | archived | - |`
  ).join('\n');

  if (!rn.includes('wayback.financecheque.xyz') && rn.includes('Older Versions')) {
    rn = rn.replace(
      /(\*\*Archive Date\*\*, \*\*Version\*\*.*\n)/,
      `$1${links}\n`
    );
    writeFileSync(rnPath, rn);
    console.log(`Patched releasenotes for ${sectionName} with ${archived.length} wayback links`);
  }
}

// Step 3: find and run rebuild.sh only for sections with changed source files
function needsRebuild(latestDir) {
  const srcDir = join(latestDir, 'source');
  const outDir = join(latestDir, 'build', 'html', 'en');
  if (!existsSync(outDir)) return true; // never built

  // Get newest mtime of any source file
  let newestSrc = 0;
  function walkSrc(d) {
    try {
      for (const f of readdirSync(d)) {
        const full = join(d, f);
        try {
          const s = statSync(full);
          if (s.isDirectory()) walkSrc(full);
          else if (s.mtimeMs > newestSrc) newestSrc = s.mtimeMs;
        } catch {}
      }
    } catch {}
  }
  walkSrc(srcDir);

  // Get oldest mtime of build output
  let oldestOut = Infinity;
  try {
    for (const f of readdirSync(outDir)) {
      const s = statSync(join(outDir, f));
      if (s.mtimeMs < oldestOut) oldestOut = s.mtimeMs;
    }
  } catch { return true; }

  return newestSrc > oldestOut;
}

function findRebuildScripts(dir, depth = 0) {
  if (depth > 4) return [];
  const scripts = [];
  try {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith('.') || entry === 'node_modules') continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (entry === 'latest' && existsSync(join(full, 'rebuild.sh'))) {
          scripts.push(full);
        } else {
          scripts.push(...findRebuildScripts(full, depth + 1));
        }
      }
    }
  } catch {}
  return scripts;
}

const latestDirs = findRebuildScripts(ROOT);
console.log(`Found ${latestDirs.length} rebuild targets`);

for (const dir of latestDirs) {
  const rel = dir.replace(ROOT, '');
  const sectionName = rel.split('/')[1];
  if (!needsRebuild(dir)) {
    console.log(`⏭ ${rel} — unchanged, skipping`);
    continue;
  }
  console.log(`\n=== ${rel} ===`);
  await patchReleasenotes(dir, sectionName);
  try {
    execSync('bash rebuild.sh', { cwd: dir, stdio: 'inherit' });
  } catch (e) {
    console.error(`✗ ${rel}: ${e.message}`);
  }
}

console.log('\nDone.');

// Write manifest of all deployed source MD files for brain API
const manifest = [];
for (const dir of latestDirs) {
  const srcDir = join(dir, 'source');
  if (existsSync(srcDir)) {
    try {
      for (const f of readdirSync(srcDir)) {
        if (f.endsWith('.md') && f !== 'index.md' && f !== 'releasenotes.md') {
          manifest.push(f);
        }
      }
    } catch {}
  }
}
writeFileSync(join(ROOT, '_deployed_manifest.json'), JSON.stringify({ deployed_files: manifest, built_at: new Date().toISOString() }, null, 2));
console.log(`Manifest: ${manifest.length} deployed source files`);
