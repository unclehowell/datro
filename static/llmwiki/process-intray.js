#!/usr/bin/env node
/**
 * process-intray.js
 * Classifies _intray/*.md files, creates two-level category/subcategory/document structure,
 * moves files to source dirs. Skips files already placed. Moves done files to _outtray/.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, renameSync, existsSync, statSync } from 'fs';
import { createHash } from 'crypto';
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

/**
 * Normalize an ID to be double-barrelled per Finance Cheque UK standard.
 * - Already has hyphen → keep as-is
 * - Single word → add fcuk- prefix
 * - Empty / "-" → fcuk-fcuk
 */
function normalizeId(id) {
  if (!id || id === '-') return 'fcuk-fcuk';
  const s = id.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!s) return 'fcuk-fcuk';
  if (s.includes('-')) return s;
  return `fcuk-${s}`;
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
  return `<!DOCTYPE html><html>\n${themeHead(depth)}\n<body><script>(async()=>{\nconst data=await(await fetch('${treeviewPath}')).json();\nlet h='<ul>';\n${backHref ? `h+='<a href="${backHref}" class="up-active"><<</a>';` : ''}\nh+=\`<p class="main-title"><span style="font-size:1.1em;font-weight:700;color:#55a5d9;">Finance Cheque UK</span><br><br>${title}</p>\`;\nfor(const f of data)h+=\`<li class="li"><a href="\${f.path}">\${f.name}</a></li>\`;\nh+='</ul>';document.body.innerHTML=h;\n})()</script><script src="${p}_theme-explorer/jquery.min.js"></script></body></html>`;
}

function makeConf(title, docName) {
  return `project = u'LLMWiki - ${title}'
copyright = u'2012-2026 Finance Cheque UK'
author = u'Finance Cheque UK'
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
latex_elements = {'papersize': 'a4paper', 'pointsize': '10pt', 'preamble': r'\\usepackage[utf8]{inputenc}\\usepackage[T1]{fontenc}'}
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

# HTML build
rm -rf build/html build/latex
sphinx-build -b html source build/html/en -q
echo '<html><body></body><script>window.open("./en/","_self");</script></html>' > build/html/index.html

# Apply theme
bash "$LLMWIKI_ROOT/_theme-docs/llmwiki-blue.sh"

# PDF build via LaTeX
mkdir -p build/latex/en
sphinx-build -b latex source build/latex/en -q
if [ -f "build/latex/en/${docName}.tex" ]; then
  cd build/latex/en
  pdflatex -interaction=nonstopmode ${docName}.tex > /dev/null 2>&1 || true
  pdflatex -interaction=nonstopmode ${docName}.tex > /dev/null 2>&1 || true
  cd -
fi

PDF="build/latex/en/${docName}.pdf"
if [ -f "$PDF" ] && [ "$(wc -c < "$PDF")" -gt 1000 ]; then
  echo "PDF OK: $PDF ($(wc -c < "$PDF") bytes)"
else
  echo "WARNING: PDF missing or too small: $PDF"
fi
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
    {"name":`<div class='language-subtitle-line enable-link rish'>v0.0.1</div>`,"path":`./latest/build/latex/en/${docName}.pdf`,"_links":{"pdf":`./latest/build/latex/en/${docName}.pdf`}},
    {"name":"<div class='page-scroll-fix'></div>","path":"javascript:void(0)","_links":{"html":"javascript:void(0)"}}
  ];
}

// Build a map of filename → {catDir, docDir} for all already-placed source files
// Two-level structure: catDir/docDir/latest/source/
function getAlreadyPlaced() {
  const placed = {};
  try {
    for (const cat of readdirSync(ROOT)) {
      if (cat.startsWith('_') || cat === 'node_modules' || cat === 'wiki' || cat === 'raw' || cat === 'functions') continue;
      const catPath = join(ROOT, cat);
      try { if (!statSync(catPath).isDirectory()) continue; } catch { continue; }
      try {
        for (const doc of readdirSync(catPath)) {
          const srcDir = join(catPath, doc, 'latest', 'source');
          if (!existsSync(srcDir)) continue;
          for (const f of readdirSync(srcDir)) {
            if (f.endsWith('.md')) placed[f] = { catDir: cat, docDir: doc };
          }
        }
      } catch {}
    }
  } catch {}
  return placed;
}

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
      const srcPath = join(ROOT, placed[f].catDir, placed[f].docDir, 'latest', 'source', f);
      const existingHash = hashes[f];
      if (existingHash === hash) {
        renameSync(join(INTRAY, f), join(OUTTRAY, f));
        console.log(`[intray] Unchanged, skipping: ${f}`);
        continue;
      }
      writeFileSync(srcPath, content);
      hashes[f] = hash;
      renameSync(join(INTRAY, f), join(OUTTRAY, f));
      console.log(`[intray] Updated in place: ${f} → ${placed[f].catDir}/${placed[f].docDir}`);
      continue;
    }

    toPlace.push({ f, content, hash, preview: content.slice(0, 300) });
  }

  if (!toPlace.length) {
    saveHashes(hashes);
    console.log('[intray] No new files to classify');
    return;
  }

  console.log(`[intray] ${toPlace.length} new files to classify...`);

  const BATCH = 20;
  // categoryMap: { catDir: { label, docs: { docDir: { label } } } }
  const categoryMap = {};

  for (let i = 0; i < toPlace.length; i += BATCH) {
    const batch = toPlace.slice(i, i + BATCH);
    const prompt = `Organise these markdown files for an AI agent knowledge base (LLMWiki).

Return ONLY valid JSON:
{"groups":[{"category":"agent","categoryLabel":"Agent","subcategory":"soul","subcategoryLabel":"Soul","document":"soul","documentLabel":"Soul & Identity","files":["file1.md"]}]}

Rules:
- category, subcategory, document: lowercase single words or hyphenated (e.g. "agent", "memory", "long-term")
- Do NOT add "fcuk-" prefix — the code handles normalisation
- Group related files into one document

FILES:
${batch.map(p => `FILE: ${p.f}\nPREVIEW: ${p.preview}`).join('\n---\n')}`;

    let groups;
    try {
      const response = await llm(prompt);
      const m = response.match(/\{[\s\S]*\}/);
      groups = JSON.parse(m[0]).groups;
    } catch (e) {
      console.error(`[intray] LLM failed: ${e.message} — using fallback`);
      groups = batch.map(p => ({
        category: 'skills', categoryLabel: 'Skills',
        subcategory: 'general', subcategoryLabel: 'General',
        document: p.f.replace('.md','').replace(/[^a-z0-9-]/gi,'-').toLowerCase().slice(0,30),
        documentLabel: p.f.replace('.md','').replace(/-/g,' '),
        files: [p.f]
      }));
    }

    for (const group of groups) {
      if (!group.category || !group.subcategory || !group.document || !group.files?.length) {
        console.warn('[intray] skipping malformed group:', JSON.stringify(group));
        continue;
      }

      // Apply normalizeId to all three levels
      const catId = normalizeId(group.category);
      const subId = normalizeId(group.subcategory);
      const docId = normalizeId(group.document);

      // Two-level directory: {catId}_{subId}/{subId}_{docId}/latest/source/
      const catDir = `${catId}_${subId}`;
      const docDir = `${subId}_${docId}`;
      const docName = `${catId}-${subId}-${docId}`;

      const srcDir    = join(ROOT, catDir, docDir, 'latest', 'source');
      const staticDir = join(srcDir, '_static');

      mkdirSync(srcDir, { recursive: true });
      mkdirSync(staticDir, { recursive: true });
      mkdirSync(join(ROOT, catDir, docDir, 'latest', 'build', 'html', 'en'), { recursive: true });
      mkdirSync(join(ROOT, catDir, docDir, 'latest', 'build', 'latex', 'en'), { recursive: true });

      const movedFiles = [];
      for (const fname of group.files) {
        const item = batch.find(p => p.f === fname);
        if (!item) continue;
        const src = join(INTRAY, fname);
        if (!existsSync(src)) continue;
        writeFileSync(join(srcDir, fname), item.content);
        renameSync(src, join(OUTTRAY, fname));
        hashes[fname] = item.hash;
        movedFiles.push(fname.replace('.md',''));
      }

      if (!movedFiles.length) continue;

      const docLabel = group.documentLabel || docId;
      writeFileSync(join(srcDir, 'index.md'), `# ${docLabel}\n\n\`\`\`{toctree}\n:maxdepth: 2\n\n${movedFiles.join('\n')}\n\`\`\`\n`);
      writeFileSync(join(srcDir, 'releasenotes.md'), makeReleasenotes());
      writeFileSync(join(staticDir, 'olderversions.csv'), '**Archive Date**, **Version**, **Description**, **Download Link**\nyyyy-mm-dd, 0.0.0, draft, no older versions yet');
      writeFileSync(join(staticDir, 'issues.csv'), '**Date**, **Version**, **Subject**, **Description**\n');
      writeFileSync(join(srcDir, 'conf.py'), makeConf(docLabel, docName));
      writeFileSync(join(ROOT, catDir, docDir, 'latest', 'rebuild.sh'), makeRebuildSh(docName, 4));
      writeFileSync(join(ROOT, catDir, docDir, '_treeview.json'), JSON.stringify(makeDocTreeview(docName), null, 2));
      writeFileSync(join(ROOT, catDir, docDir, 'index.html'), makeIndexHtml(2, docLabel, '../index.html', '_treeview.json'));

      if (!categoryMap[catDir]) categoryMap[catDir] = { label: group.categoryLabel || catId, docs: {} };
      categoryMap[catDir].docs[docDir] = { label: docLabel };
      console.log(`[intray] Created ${catDir}/${docDir} (${movedFiles.length} files)`);
    }
  }

  // Write category-level index.html and _treeview.json
  for (const [catDir, { label, docs }] of Object.entries(categoryMap)) {
    const tv = Object.entries(docs).map(([docDir, { label: dl }]) => ({
      name: `<div class='subtitle-line enable-link'>${dl}</div>`,
      path: `./${docDir}/index.html`,
      _links: { html: `./${docDir}/index.html` }
    }));
    writeFileSync(join(ROOT, catDir, '_treeview.json'), JSON.stringify(tv, null, 2));
    writeFileSync(join(ROOT, catDir, 'index.html'), makeIndexHtml(1, label, '../index.html', '_treeview.json'));
  }

  // Merge into root _treeview.json
  let rootTv = [];
  try { rootTv = JSON.parse(readFileSync(join(ROOT, '_treeview.json'), 'utf8')); } catch {}
  for (const [catDir, { label }] of Object.entries(categoryMap)) {
    if (!rootTv.find(e => e.path && e.path.includes(`/${catDir}/`))) {
      rootTv.push({ name: `<div class='subtitle-line enable-link'>${label}</div>`, path: `./${catDir}/index.html`, _links: { html: `./${catDir}/index.html` } });
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
