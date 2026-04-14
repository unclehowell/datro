#!/usr/bin/env node
// generate-treeviews.js
// Generates _treeview.json files for each section in llmwiki
// matching the library.datro.xyz pattern:
// section/_treeview.json → links to latest/build/html/en/index.html + latest/build/latex/en/*.pdf

import { readdirSync, writeFileSync, statSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('.', import.meta.url).pathname;
const SKIP = new Set(['_theme-explorer', '_theme-docs', '_test', 'node_modules', 'raw', 'wiki']);

const sections = readdirSync(ROOT).filter(d => {
  if (d.startsWith('_') || d.startsWith('.') || SKIP.has(d)) return false;
  const full = join(ROOT, d);
  return statSync(full).isDirectory() && existsSync(join(full, 'latest', 'source'));
});

for (const section of sections) {
  const sectionDir = join(ROOT, section);
  const docName = section.replace(/_/g, '-'); // e.g. agent_soul → agent-soul

  // Collect all .md files to list as sub-documents
  const srcDir = join(sectionDir, 'latest', 'source');
  const mdFiles = [];
  function walk(dir, prefix = '') {
    for (const f of readdirSync(dir).sort()) {
      const full = join(dir, f);
      if (statSync(full).isDirectory() && !f.startsWith('.') && !f.startsWith('_')) {
        walk(full, prefix ? `${prefix}/${f}` : f);
      } else if (f.endsWith('.md') && f !== 'CHANGELOG.md') {
        mdFiles.push(prefix ? `${prefix}/${f}` : f);
      }
    }
  }
  walk(srcDir);

  // Build treeview matching library pattern
  const treeview = [
    {
      name: "<div><b class='greenish' title='Green = HTML'>HTML</b>|<b class='redish' title='Red = PDF'>PDF</b></div>",
      path: "javascript:void(0)",
      _links: { html: "javascript:void(0)" }
    },
    {
      name: "<div class='title-line title-disable'><div class='flag f-gb'></div>English</div>",
      path: "javascript:void(0)",
      _links: { html: "javascript:void(0)" }
    },
    {
      name: "<div class='language-subtitle-line enable-link gish'>Latest</div>",
      path: `./latest/build/html/en/index.html`,
      _links: {
        html: `./latest/build/html/en/index.html`,
        pdf: `./latest/build/latex/en/${docName}.pdf`
      }
    },
    {
      name: "<div class='page-scroll-fix'></div>",
      path: "javascript:void(0)",
      _links: { html: "javascript:void(0)" }
    }
  ];

  writeFileSync(join(sectionDir, '_treeview.json'), JSON.stringify(treeview, null, 2));
  console.log(`✓ ${section}/_treeview.json (${mdFiles.length} md files)`);
}

console.log(`\nDone. ${sections.length} sections updated.`);
