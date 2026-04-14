#!/usr/bin/env node
// build.js — Cloudflare Pages build script
// Runs rebuild.sh for every section that has one

import { execSync } from 'child_process';
import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { processIntray } from './process-intray.js';

const ROOT = new URL('.', import.meta.url).pathname;

// Step 1: classify and move any files in _intray/
await processIntray();

// Step 2: find and run all rebuild.sh scripts

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
  console.log(`\n=== ${rel} ===`);
  try {
    execSync('bash rebuild.sh', { cwd: dir, stdio: 'inherit' });
  } catch (e) {
    console.error(`✗ ${rel}: ${e.message}`);
  }
}

console.log('\nDone.');
