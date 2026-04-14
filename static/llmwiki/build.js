#!/usr/bin/env node
// build.js — Cloudflare Pages build script
// Uses content hashes (not mtimes) to skip unchanged documents.
// Hash state persists in _build_hashes.json so fresh CF clones don't rebuild everything.

import { execSync } from 'child_process';
import { readdirSync, statSync, existsSync, readFileSync, writeFileSync, createHash } from 'fs';
import { join } from 'path';
import { processIntray } from './process-intray.js';

const ROOT = new URL('.', import.meta.url).pathname;
const HASH_FILE = join(ROOT, '_build_hashes.json');

function hashDir(dir) {
  const h = createHash('md5');
  function walk(d) {
    try {
      for (const f of readdirSync(d).sort()) {
        const full = join(d, f);
        try {
          if (statSync(full).isDirectory()) walk(full);
          else h.update(readFileSync(full));
        } catch {}
      }
    } catch {}
  }
  walk(dir);
  return h.digest('hex');
}

function loadHashes() {
  try { return JSON.parse(readFileSync(HASH_FILE, 'utf8')); } catch { return {}; }
}
function saveHashes(h) { writeFileSync(HASH_FILE, JSON.stringify(h, null, 2)); }

function findLatestDirs(dir, depth = 0) {
  if (depth > 4) return [];
  const results = [];
  try {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith('.') || entry === 'node_modules') continue;
      const full = join(dir, entry);
      try {
        if (!statSync(full).isDirectory()) continue;
        if (entry === 'latest' && existsSync(join(full, 'rebuild.sh'))) {
          results.push(full);
        } else {
          results.push(...findLatestDirs(full, depth + 1));
        }
      } catch {}
    }
  } catch {}
  return results;
}

// Step 1: process intray
await processIntray();

// Step 1b: rebuild root _treeview.json from actual category dirs on disk
// (ensures homepage always shows categories, not documents)
{
  const SKIP = new Set(['.', '..', 'node_modules', 'functions', 'wiki', 'raw', '_intray', '_outtray', '_test', '_theme-docs', '_theme-explorer', '_theme-vitepress', '_vitepress-theme']);
  const catEntries = [];
  for (const entry of readdirSync(ROOT)) {
    if (entry.startsWith('_') || SKIP.has(entry)) continue;
    const full = join(ROOT, entry);
    try {
      if (!statSync(full).isDirectory()) continue;
      // Must have at least one document subdir with a latest/source
      const hasDocs = readdirSync(full).some(d => existsSync(join(full, d, 'latest', 'source')));
      if (!hasDocs) continue;
      // Read label from existing category _treeview.json if present
      let label = entry.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      try {
        const tv = JSON.parse(readFileSync(join(full, '_treeview.json'), 'utf8'));
        // label not stored separately — derive from first entry name or keep generated
      } catch {}
      catEntries.push({ name: `<div class='subtitle-line enable-link'>${label}</div>`, path: `./${entry}/index.html`, _links: { html: `./${entry}/index.html` } });
    } catch {}
  }
  if (catEntries.length) {
    writeFileSync(join(ROOT, '_treeview.json'), JSON.stringify(catEntries, null, 2));
    console.log(`Root treeview: ${catEntries.length} categories`);
  }
}

// Step 2: find all rebuild targets
const latestDirs = findLatestDirs(ROOT);
console.log(`Found ${latestDirs.length} rebuild targets`);

const prevHashes = loadHashes();
const newHashes  = { ...prevHashes };
let built = 0, skipped = 0;

for (const dir of latestDirs) {
  const rel     = dir.replace(ROOT, '').replace(/^\//, '');
  const srcDir  = join(dir, 'source');
  const outHtml = join(dir, 'build', 'html', 'en');
  const outPdf  = join(dir, 'build', 'latex', 'en');

  if (!existsSync(srcDir)) continue;

  const srcHash = hashDir(srcDir);
  const outExists = existsSync(outHtml) && existsSync(outPdf);

  if (outExists && prevHashes[rel] === srcHash) {
    console.log(`⏭  ${rel} — unchanged (hash match), skipping`);
    skipped++;
    continue;
  }

  console.log(`\n=== ${rel} (hash changed or first build) ===`);
  try {
    execSync('bash rebuild.sh', { cwd: dir, stdio: 'inherit' });
    newHashes[rel] = srcHash;
    built++;
  } catch (e) {
    console.error(`✗ ${rel}: ${e.message}`);
    // Don't update hash so it retries next build
  }
}

saveHashes(newHashes);
console.log(`\nDone. Built: ${built}, Skipped: ${skipped}`);

// Write manifest of all deployed source MD files for brain API
const manifest = [];
for (const dir of latestDirs) {
  const srcDir = join(dir, 'source');
  if (!existsSync(srcDir)) continue;
  try {
    for (const f of readdirSync(srcDir)) {
      if (f.endsWith('.md') && f !== 'index.md' && f !== 'releasenotes.md') {
        // Store full relative path so brain API can serve it
        const relPath = join(dir, 'source', f).replace(ROOT, '').replace(/^\//, '');
        manifest.push(relPath);
      }
    }
  } catch {}
}
writeFileSync(join(ROOT, '_deployed_manifest.json'), JSON.stringify({
  deployed_files: manifest,
  categories: [...new Set(manifest.map(f => f.split('/')[0]))],
  built_at: new Date().toISOString(),
  built_count: built,
  skipped_count: skipped
}, null, 2));
console.log(`Manifest: ${manifest.length} source files`);
