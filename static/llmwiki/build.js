#!/usr/bin/env node
// build.js — runs rebuild.sh for each llmwiki section (Cloudflare Pages build command)
// Equivalent to library's rebuild.sh pipeline: Sphinx+myst-parser → HTML (RTD+blue.sh) + PDF

import { execSync } from 'child_process';
import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('.', import.meta.url).pathname;
const SKIP = new Set(['_theme-explorer','_theme-docs','_theme-vitepress','_test','node_modules','raw','wiki','consortium_legal']);

const sections = readdirSync(ROOT).filter(d => {
  if (d.startsWith('_') || d.startsWith('.') || SKIP.has(d)) return false;
  const rebuild = join(ROOT, d, 'latest', 'rebuild.sh');
  return statSync(join(ROOT,d)).isDirectory() && existsSync(rebuild);
});

console.log(`Building ${sections.length} sections...`);

for (const section of sections) {
  const latestDir = join(ROOT, section, 'latest');
  console.log(`\n=== ${section} ===`);
  try {
    execSync(`bash rebuild.sh`, { cwd: latestDir, stdio: 'inherit' });
  } catch(e) {
    console.error(`✗ ${section} failed: ${e.message}`);
  }
}

console.log('\nDone.');
