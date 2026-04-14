#!/usr/bin/env node
/**
 * process-intray.js
 * Classifies _intray/*.md files, creates category/document folder structure,
 * moves files to source dirs. Skips files already placed. Moves done files to _outtray/.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, renameSync, existsSync, createHash } from 'fs';
import { join } from 'path';

const ROOT = new URL('.', import.meta.url).pathname;
const INTRAY  = join(ROOT, '_intray');
const OUTTRAY = join(ROOT, '_outtray');

const PROVIDERS = [
  { url: 'https://api.groq.com/openai/v1/chat/completions', key: process.env.GROQ_API_KEY, model: 'llama-3.1-8b-instant' },
  { url: 'https://openrouter.ai/api/v1/chat/completions', key: process.env.OPENROUTER_API_KEY, model: 'google/gemini-2.0-flash-001' },
  { url: 'https://api.openai.com/v1/chat/completions', key: process.env.OPENAI_API_KEY, model: 'gpt-4o-mini' },
];

async function llm(prompt) {
  for (const p of PROVIDERS) {
    if (!p.key) continue;
    try {
      const resp = await fetch(p.url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${p.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: p.model, messages: [{ role: 'user', content: prompt }], max_tokens: 2000, temperature: 0.1 })
      });
      const d = await resp.json();
      const text = d.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch (e) { console.log(`[intray] ${p.url} failed: ${e.message}`); }
  }
  throw new Error('All LLM providers failed');
}

function md5(str) {
  return createHash('md5').update(str).digest('hex');
}

function themeHead(depth) {
  const p = '../'.repeat(depth);
  return `  <head>
  <meta charset="UTF-8">
  <title>LLMWiki — Agent Hive Mind</title>
  <meta content="width=device-width, initial-scale=1" name="viewport">
  <link href="${p}_theme-explorer/favicons/favicon-32x32.png" rel="icon" sizes="32x32" type="image/png">
  <link rel="stylesheet" href="${p}_theme-explorer/style.css">
  <link rel="stylesheet" href="${p}_theme-explorer/glyphicon.css">
  </head>`;
}

function makeIndexHtml(depth, title, backHref, treeviewPath) {
  const p = '../'.repeat(depth);
  return `<!DOCTYPE html><html>\n${themeHead(depth)}\n<body><script>(async()=>{
const data=await(await fetch('${treeviewPath}')).json();
let h='<ul>';
${backHref ? `h+='<a href="${backHref}" class="up-active"><<</a>';` : ''}
h+=\`<p class="main-title"><span style="font-size:1.1em;font-weight:700;color:#55a5d9;">Finance Cheque UK</span><br><br>${title}</p>\`;
for(const f of data)h+=\`<li class="li"><a href="\${f.path}">\${f.name}</a></li>\`;
h+='</ul>';document.body.innerHTML=h;
})()</script><script src="${p}_theme-explorer/jquery.min.js"></script></body></html>`;
}

function makeConf(title, docName) {
  return `project = u'LLMWiki - ${title}'
copyright = u'Finance Cheque UK'
author = u'The Team @ DATRO Consortium'
version = u'0.0.1'
release = u'0.0.1'
extensions = ['sphinx.ext.autosectionlabel', 'myst_parser']
source_suffix = {'.rst': 'restructuredtext', '.md': 'markdown'}
master_doc = 'index'
language = "en"
locale_dirs = ['locales']
gettext_auto_build = True
gettext_compact = "docs"
exclude_patterns = ['_build']
html_theme = 'sphinx_rtd_theme'
htmlhelp_basename = '${docName}'
latex_elements = {'papersize': 'a4paper', 'pointsize': '10pt'}
latex_documents = [(master_doc, '${docName}.tex', u'${title}', u'Finance Cheque UK', 'manual')]
myst_enable_extensions = ["colon_fence", "deflist"]
suppress_warnings = ["autosectionlabel.*"]
`;
}

function makeRebuildSh(docName, depth) {
  const rel = '../'.repeat(depth);
  return `#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
LLMWIKI_ROOT="$(cd ${rel} && pwd)"
rm -rf build/html build/latex
sphinx-build -b html source build/html/en
echo '<html><body></body><script>window.open("./en/","_self");</script></html>' > build/html/index.html
bash "$LLMWIKI_ROOT/_theme-docs/llmwiki-blue.sh"
sphinx-build -b latex source build/latex/en -D language='en'
(cd build/latex/en && pdflatex -interaction=nonstopmode *.tex 2>/dev/null && pdflatex -interaction=nonstopmode *.tex 2>/dev/null) || true
PDF="build/latex/en/${docName}.pdf"
[ -f "$PDF" ] && echo "PDF OK: $PDF ($(wc -c < "$PDF") bytes)" || echo "WARNING: PDF missing"
echo '<html><body></body><script>window.open("./${docName}.pdf","_self");</script></html>' > build/latex/en/index.html
echo "Done: ${docName}"
`;
}

function makeReleasenotes() {
  const today = new Date().toISOString().slice(0,10);
  return `# Release Notes\n\n## This Release (Version 0.0.1)\n\n- **${today}** - Initial release\n\n## Older Versions\n\n\`\`\`{csv-table}\n:file: _static/olderversions.csv\n:widths: 20, 20, 20, 40\n:header-rows: 1\n\`\`\`\n`;
}

function makeDocTreeview(docName) {
  return [
    {"name":"<div><b class='greenish'>HTML</b>|<b class='redish'>PDF</b></div>","path":"javascript:void(0)","_links":{"html":"javascript:void(0)"}},
    {"name":"<div class='title-line title-disable'><div class='flag f-en'></div>English</div>","path":"javascript:void(0)","_links":{"html":"javascript:void(0)"}},
    {"name":"<div class='language-subtitle-line enable-link gish'>Latest</div>","path":"./latest/build/html/en/index.html","_links":{"html":"./latest/build/html/en/index.html"}},
    {"name":"<div class='language-subtitle-line enable-link rish'>v0.0.1</div>","path":`./latest/build/latex/en/${docName}.pdf`,"_links":{"pdf":`./latest/build/latex/en/${docName}.pdf`}},
    {"name":"<div class='page-scroll-fix'></div>","path":"javascript:void(0)","_links":{"html":"javascript:void(0)"}}
  ];
}

// Build a map of filename → {category, document} for all already-placed source files
function getAlreadyPlaced() {
  const placed = {};
  try {
    for (const cat of readdirSync(ROOT)) {
      if (cat.startsWith('_') || cat === 'node_modules' || cat === 'wiki' || cat === 'raw' || cat === 'functions') continue;
      const catDir = join(ROOT, cat);
      try {
        for (const doc of readdirSync(catDir)) {
          const srcDir = join(catDir, doc, 'latest', 'source');
          if (!existsSync(srcDir)) continue;
          for (const f of readdirSync(srcDir)) {
            if (f.endsWith('.md')) placed[f] = { category: cat, document: doc };
          }
        }
      } catch {}
    }
  } catch {}
  return placed;
}

// Load hash registry (persisted in repo to survive fresh CF clones)
function loadHashes() {
  const p = join(ROOT, '_source_hashes.json');
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return {}; }
}
function saveHashes(h) {
  writeFileSync(join(ROOT, '_source_hashes.json'), JSON.stringify(h, null, 2));
}

export async function processIntray() {
  if (!existsSync(INTRAY)) { console.log('[intray] No _intray, skipping'); return; }
  mkdirSync(OUTTRAY, { recursive: true });

  const allFiles = readdirSync(INTRAY).filter(f => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md' && f !== 'CHANGELOG.md' && f !== 'DESCRIPTION.md' && f !== 'SKILL.md');
  if (!allFiles.length) { console.log('[intray] Empty'); return; }

  const placed  = getAlreadyPlaced();
  const hashes  = loadHashes();
  const toPlace = [];

  for (const f of allFiles) {
    const content = readFileSync(join(INTRAY, f), 'utf8');
    const hash = md5(content);

    if (placed[f]) {
      // File already has a path — check if content changed
      const srcPath = join(ROOT, placed[f].category, placed[f].document, 'latest', 'source', f);
      const existingHash = hashes[f];
      if (existingHash === hash) {
        // Same content — move to outtray, skip
        renameSync(join(INTRAY, f), join(OUTTRAY, f));
        console.log(`[intray] Unchanged, skipping: ${f}`);
        continue;
      }
      // Content changed — update in place, mark for rebuild
      writeFileSync(srcPath, content);
      hashes[f] = hash;
      renameSync(join(INTRAY, f), join(OUTTRAY, f));
      console.log(`[intray] Updated in place: ${f} → ${placed[f].category}/${placed[f].document}`);
      continue;
    }

    // New file — needs classification
    toPlace.push({ f, content, hash, preview: content.slice(0, 300) });
  }

  if (!toPlace.length) {
    saveHashes(hashes);
    console.log('[intray] No new files to classify');
    return;
  }

  console.log(`[intray] ${toPlace.length} new files to classify...`);

  // Classify in batches of 20 to avoid token limits
  const BATCH = 20;
  const categoryMap = {};

  for (let i = 0; i < toPlace.length; i += BATCH) {
    const batch = toPlace.slice(i, i + BATCH);
    const prompt = `Organise these markdown files for an AI agent knowledge base (LLMWiki).

NAMING: categoryID_subcategoryID / subcategoryID_documentID
- e.g. memory_longterm / longterm_honcho
- The subcategory word bridges both sides
- lowercase + underscores only

FILES:
${batch.map(p => `FILE: ${p.f}\nPREVIEW: ${p.preview}`).join('\n---\n')}

Return ONLY valid JSON:
{"groups":[{"category":"memory_longterm","categoryLabel":"Memory: Long Term","document":"longterm_honcho","documentLabel":"Long Term Honcho","files":["file1.md"]}]}

Group related files. Each group = one document (HTML+PDF).`;

    let groups;
    try {
      const response = await llm(prompt);
      const m = response.match(/\{[\s\S]*\}/);
      groups = JSON.parse(m[0]).groups;
    } catch (e) {
      console.error(`[intray] LLM failed: ${e.message} — using fallback`);
      groups = batch.map(p => ({
        category: 'skills_general', categoryLabel: 'Skills: General',
        document: `general_${p.f.replace('.md','').replace(/[^a-z0-9]/gi,'_').toLowerCase().slice(0,30)}`,
        documentLabel: p.f.replace('.md','').replace(/_/g,' '),
        files: [p.f]
      }));
    }

    for (const group of groups) {
      const { category, categoryLabel, document, documentLabel, files: gFiles } = group;
      const docName = `${category}-${document}`.replace(/_/g,'-');
      const srcDir   = join(ROOT, category, document, 'latest', 'source');
      const staticDir = join(srcDir, '_static');

      mkdirSync(srcDir, { recursive: true });
      mkdirSync(staticDir, { recursive: true });
      mkdirSync(join(ROOT, category, document, 'latest', 'build', 'html', 'en'), { recursive: true });
      mkdirSync(join(ROOT, category, document, 'latest', 'build', 'latex', 'en'), { recursive: true });

      const movedFiles = [];
      for (const fname of gFiles) {
        const item = batch.find(p => p.f === fname);
        if (!item) continue;
        const src = join(INTRAY, fname);
        if (!existsSync(src)) continue;
        // Write content to source dir
        writeFileSync(join(srcDir, fname), item.content);
        // Move from intray to outtray
        renameSync(src, join(OUTTRAY, fname));
        hashes[fname] = item.hash;
        movedFiles.push(fname.replace('.md',''));
      }

      if (!movedFiles.length) continue;

      // index.md
      writeFileSync(join(srcDir, 'index.md'), `# ${documentLabel}\n\n\`\`\`{toctree}\n:maxdepth: 2\n\n${movedFiles.join('\n')}\n\`\`\`\n`);
      // releasenotes.md
      writeFileSync(join(srcDir, 'releasenotes.md'), makeReleasenotes());
      writeFileSync(join(staticDir, 'olderversions.csv'), '**Archive Date**, **Version**, **Description**, **Download Link**\nyyyy-mm-dd, 0.0.0, draft, no older versions yet');
      writeFileSync(join(staticDir, 'issues.csv'), '**Date**, **Version**, **Subject**, **Description**\n');
      // conf.py
      writeFileSync(join(srcDir, 'conf.py'), makeConf(documentLabel, docName));
      // rebuild.sh
      writeFileSync(join(ROOT, category, document, 'latest', 'rebuild.sh'), makeRebuildSh(docName, 3));
      // _treeview.json + index.html for document
      writeFileSync(join(ROOT, category, document, '_treeview.json'), JSON.stringify(makeDocTreeview(docName), null, 2));
      writeFileSync(join(ROOT, category, document, 'index.html'), makeIndexHtml(2, documentLabel, '../index.html', '_treeview.json'));

      if (!categoryMap[category]) categoryMap[category] = { label: categoryLabel, docs: [] };
      categoryMap[category].docs.push({ document, documentLabel });
      console.log(`[intray] Created ${category}/${document} (${movedFiles.length} files)`);
    }
  }

  // Category + root indexes
  for (const [cat, { label, docs }] of Object.entries(categoryMap)) {
    const tv = docs.map(d => ({ name: `<div class='subtitle-line enable-link'>${d.documentLabel}</div>`, path: `./${d.document}/index.html`, _links: { html: `./${d.document}/index.html` } }));
    writeFileSync(join(ROOT, cat, '_treeview.json'), JSON.stringify(tv, null, 2));
    writeFileSync(join(ROOT, cat, 'index.html'), makeIndexHtml(1, label, '../index.html', '_treeview.json'));
  }

  // Merge into root _treeview.json (preserve existing categories)
  let rootTv = [];
  try { rootTv = JSON.parse(readFileSync(join(ROOT, '_treeview.json'), 'utf8')); } catch {}
  for (const [cat, { label }] of Object.entries(categoryMap)) {
    if (!rootTv.find(e => e.path.includes(`/${cat}/`))) {
      rootTv.push({ name: `<div class='subtitle-line enable-link'>${label}</div>`, path: `./${cat}/index.html`, _links: { html: `./${cat}/index.html` } });
    }
  }
  writeFileSync(join(ROOT, '_treeview.json'), JSON.stringify(rootTv, null, 2));

  saveHashes(hashes);
  console.log(`[intray] Done. ${toPlace.length} files classified.`);
}

export async function checkWayback(category) {
  try {
    const resp = await fetch(`https://wayback.financecheque.uk/api/list?api_key=wayback-readonly-key-unclehowell-2026`);
    const data = await resp.json();
    return (data.deployed_files || []).filter(f => f.includes(category.replace(/_/g,'-')));
  } catch { return []; }
}
