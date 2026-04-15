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

// Render md content to a self-contained HTML doc with print-to-PDF button.
// Uses marked.js from CDN — no build step, no Sphinx, no LaTeX.
function makeDocHtml(depth, title, mdFiles, srcRelPath) {
  const p = '../'.repeat(depth);
  // mdFiles: array of filenames relative to source dir
  const fileLoaders = mdFiles.map(f =>
    `fetch('${srcRelPath}${f}').then(r=>r.text()).catch(()=>'')`
  ).join(',\n    ');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title} — LLMWiki</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="${p}_theme-explorer/favicons/favicon-32x32.png" rel="icon" sizes="32x32" type="image/png">
  <link rel="stylesheet" href="${p}_theme-explorer/style.css">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    body { max-width: 860px; margin: 2em auto; padding: 0 1.5em; font-family: sans-serif; color: #ccc; background: #223; }
    h1,h2,h3 { color: #55a5d9; }
    pre { background: #112; padding: 1em; border-radius: 4px; overflow-x: auto; }
    code { background: #112; padding: 0.1em 0.3em; border-radius: 3px; }
    a { color: #55a5d9; }
    #pdf-btn { position: fixed; top: 1em; right: 1em; background: #55a5d9; color: #fff; border: none; padding: 0.5em 1.2em; border-radius: 4px; cursor: pointer; font-size: 0.9em; z-index: 999; }
    @media print { #pdf-btn { display: none; } body { background: #fff; color: #000; } h1,h2,h3 { color: #000; } }
  </style>
</head>
<body>
  <button id="pdf-btn" onclick="window.print()">⬇ Download PDF</button>
  <div id="content"><p>Loading…</p></div>
  <script>
  (async () => {
    const parts = await Promise.all([
      ${fileLoaders}
    ]);
    document.getElementById('content').innerHTML = marked.parse(parts.join('\\n\\n---\\n\\n'));
    if (location.search.includes('print=1')) window.print();
  })();
  </script>
</body>
</html>`;
}

function makeReleasenotes() {
  const today = new Date().toISOString().slice(0,10);
  return `# Release Notes\n\n## v0.0.1 — ${today}\n\n- Initial release\n`;
}

function makeDocTreeview(docDir) {
  return [
    {"name":"<div><b class='greenish'>HTML</b> | <b class='redish'>PDF</b></div>","path":"javascript:void(0)","_links":{"html":"javascript:void(0)"}},
    {"name":"<div class='title-line title-disable'><div class='flag f-en'></div>English</div>","path":"javascript:void(0)","_links":{"html":"javascript:void(0)"}},
    {"name":"<div class='language-subtitle-line enable-link gish'>Latest (HTML + Print PDF)</div>","path":"./latest/index.html","_links":{"html":"./latest/index.html"}},
    {"name":"<div class='page-scroll-fix'></div>","path":"javascript:void(0)","_links":{"html":"javascript:void(0)"}}
  ];
}

// Build a map of filename → {catDir, docDir} for all already-placed source files
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
      if (hashes[f] === hash) {
        renameSync(join(INTRAY, f), join(OUTTRAY, f));
        console.log(`[intray] Unchanged, skipping: ${f}`);
        continue;
      }
      writeFileSync(srcPath, content);
      hashes[f] = hash;
      // Regenerate doc HTML with updated content
      const docDir = placed[f].docDir;
      const catDir = placed[f].catDir;
      const srcFiles = readdirSync(join(ROOT, catDir, docDir, 'latest', 'source')).filter(x => x.endsWith('.md') && x !== 'releasenotes.md');
      const srcRelPath = './source/';
      writeFileSync(join(ROOT, catDir, docDir, 'latest', 'index.html'), makeDocHtml(4, docDir, srcFiles, srcRelPath));
      renameSync(join(INTRAY, f), join(OUTTRAY, f));
      console.log(`[intray] Updated: ${f} → ${catDir}/${docDir}`);
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

      const catId = normalizeId(group.category);
      const subId = normalizeId(group.subcategory);
      const docId = normalizeId(group.document);

      const catDir = `${catId}_${subId}`;
      const docDir = `${subId}_${docId}`;

      const srcDir = join(ROOT, catDir, docDir, 'latest', 'source');
      mkdirSync(srcDir, { recursive: true });

      const movedFiles = [];
      for (const fname of group.files) {
        const item = batch.find(p => p.f === fname);
        if (!item) continue;
        const src = join(INTRAY, fname);
        if (!existsSync(src)) continue;
        writeFileSync(join(srcDir, fname), item.content);
        renameSync(src, join(OUTTRAY, fname));
        hashes[fname] = item.hash;
        movedFiles.push(fname);
      }

      if (!movedFiles.length) continue;

      const docLabel = group.documentLabel || docId;

      // Write release notes into source (not rendered in main doc)
      writeFileSync(join(srcDir, 'releasenotes.md'), makeReleasenotes());

      // Single index.html per doc — renders md client-side, has print-to-PDF button
      // source files are served as static assets at ./source/{filename}
      writeFileSync(
        join(ROOT, catDir, docDir, 'latest', 'index.html'),
        makeDocHtml(4, docLabel, movedFiles, './source/')
      );

      // Doc-level treeview (links to latest/index.html only — no separate PDF file)
      writeFileSync(join(ROOT, catDir, docDir, '_treeview.json'), JSON.stringify(makeDocTreeview(docDir), null, 2));
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
