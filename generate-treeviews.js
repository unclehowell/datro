#!/usr/bin/env node
// generate-treeviews.js
// Regenerates _treeview.json files for the two-level structure:
// {catId}_{subId}/{subId}_{docId}/latest/source/
// Root treeview shows categories; category treeview shows documents.

import { readdirSync, writeFileSync, statSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('.', import.meta.url).pathname;
const SKIP = new Set(['_theme-explorer', '_theme-docs', '_theme-vitepress', '_test', 'node_modules', 'raw', 'wiki', 'functions', 'static', '_vitepress-theme']);

function toLabel(id) {
  // Remove fcuk- prefixes, split on _ and -, capitalise each word
  return id.replace(/fcuk-/g, '').replace(/[_-]+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase()) || id;
}

// Collect all category dirs (contain doc subdirs with latest/source)
const catDirs = readdirSync(ROOT).filter(d => {
  if (d.startsWith('_') || d.startsWith('.') || SKIP.has(d)) return false;
  const full = join(ROOT, d);
  try { return statSync(full).isDirectory(); } catch { return false; }
});

const rootTv = [];

for (const catDir of catDirs) {
  const catPath = join(ROOT, catDir);
  // Find doc subdirs that have latest/source
  let docDirs;
  try { docDirs = readdirSync(catPath).filter(d => existsSync(join(catPath, d, 'latest', 'source'))); } catch { continue; }
  if (!docDirs.length) continue;

  const catTv = [];
  for (const docDir of docDirs) {
    const label = toLabel(docDir);
    const docName = `${catDir}-${docDir}`.replace(/_/g, '-');
    const tv = [
      {"name":"<div><b class='greenish'>HTML</b>|<b class='redish'>PDF</b></div>","path":"javascript:void(0)","_links":{"html":"javascript:void(0)"}},
      {"name":"<div class='title-line title-disable'><div class='flag f-en'></div>English</div>","path":"javascript:void(0)","_links":{"html":"javascript:void(0)"}},
      {"name":"<div class='language-subtitle-line enable-link gish'>Latest</div>","path":"./latest/build/html/en/index.html","_links":{"html":"./latest/build/html/en/index.html","pdf":`./latest/build/latex/en/${docName}.pdf`}},
      {"name":`<div class='language-subtitle-line enable-link rish'>v0.0.1</div>`,"path":`./latest/build/latex/en/${docName}.pdf`,"_links":{"pdf":`./latest/build/latex/en/${docName}.pdf`}},
      {"name":"<div class='page-scroll-fix'></div>","path":"javascript:void(0)","_links":{"html":"javascript:void(0)"}}
    ];
    writeFileSync(join(catPath, docDir, '_treeview.json'), JSON.stringify(tv, null, 2));
    catTv.push({ name: `<div class='subtitle-line enable-link'>${label}</div>`, path: `./${docDir}/index.html`, _links: { html: `./${docDir}/index.html` } });
    console.log(`✓ ${catDir}/${docDir}/_treeview.json`);
  }

  writeFileSync(join(catPath, '_treeview.json'), JSON.stringify(catTv, null, 2));
  console.log(`✓ ${catDir}/_treeview.json`);

  const catLabel = toLabel(catDir);
  rootTv.push({ name: `<div class='subtitle-line enable-link'>${catLabel}</div>`, path: `./${catDir}/index.html`, _links: { html: `./${catDir}/index.html` } });
}

writeFileSync(join(ROOT, '_treeview.json'), JSON.stringify(rootTv, null, 2));
console.log(`\n✓ _treeview.json (root) — ${rootTv.length} categories`);
