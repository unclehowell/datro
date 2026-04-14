#!/usr/bin/env node
/**
 * process-intray.js
 * 
 * Reads all MD files from _intray/, calls Groq LLM to:
 * 1. Group related files together
 * 2. Name each group as category_subcategory/subcategory_document
 *    following datro/static/library/standardisation.md convention
 * 3. Create the folder structure and move files
 * 4. Generate conf.py, rebuild.sh, index.md, releasenotes.md,
 *    _treeview.json, index.html for each document
 * 5. Update root _treeview.json and index.html
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from 'fs';
import { join, basename } from 'path';

const ROOT = new URL('.', import.meta.url).pathname;
const INTRAY = join(ROOT, '_intray');

const PROVIDERS = [
  { url: 'https://api.groq.com/openai/v1/chat/completions', key: process.env.GROQ_API_KEY, model: 'llama-3.1-8b-instant' },
  { url: 'https://ollama.com/api/chat', key: process.env.OLLAMA_API_KEY, model: 'gpt-oss:120b', ollama: true },
  { url: 'https://openrouter.ai/api/v1/chat/completions', key: process.env.OPENROUTER_API_KEY, model: 'google/gemini-2.0-flash-001' },
  { url: 'https://api.openai.com/v1/chat/completions', key: process.env.OPENAI_API_KEY, model: 'gpt-4o-mini' },
];

async function groq(prompt) {
  for (const p of PROVIDERS) {
    if (!p.key) continue;
    try {
      const body = p.ollama
        ? { model: p.model, messages: [{ role: 'user', content: prompt }], stream: false }
        : { model: p.model, messages: [{ role: 'user', content: prompt }], max_tokens: 2000, temperature: 0.1 };
      const resp = await fetch(p.url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${p.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const d = await resp.json();
      // Ollama returns message.content directly, OpenAI returns choices[0].message.content
      const text = (p.ollama ? d.message?.content : d.choices?.[0]?.message?.content)?.trim();
      if (text) { console.log(`[intray] Used provider: ${p.url}`); return text; }
    } catch (e) { console.log(`[intray] Provider ${p.url} failed: ${e.message}`); }
  }
  throw new Error('All LLM providers failed');
}

function themeHead(depth) {
  const p = '../'.repeat(depth);
  return `  <head>
  <meta charset="UTF-8">
  <meta content="LLMWiki — Agent Hive Mind" name="description">
  <meta content="DATRO Consortium" name="author">
  <title>LLMWiki — Agent Hive Mind</title>
  <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, shrink-to-fit=no" name="viewport">
        <link href="${p}_theme-explorer/favicons/favicon-32x32.png" rel="icon" sizes="32x32" type="image/png">
        <link rel="stylesheet" href="${p}_theme-explorer/style.css">
        <link rel="stylesheet" href="${p}_theme-explorer/glyphicon.css">
<style>html{overflow-y:scroll;overflow-x:hidden;}::-webkit-scrollbar{width:0px;background:transparent;}</style>
  </head>`;
}

function makeIndexHtml(depth, title, backHref, treeviewPath) {
  const p = '../'.repeat(depth);
  return `<!DOCTYPE html>
<html>
${themeHead(depth)}
  <body>
    <script>
      (async () => {
        const response = await fetch('${treeviewPath}');
        const data = await response.json();
        let htmlString = '<ul>';
        ${backHref ? `htmlString += \`<a href="${backHref}" class="up-active"><<</a>\`;` : ''}
        htmlString += \`<p class="main-title"><span style="font-size:1.1em;font-weight:700;color:#55a5d9;">Finance Cheque UK</span><br><br>${title}</p>\`;
        for (let file of data) {
          htmlString += \`<li class="li"><a href="\${file.path}">\${file.name}</a></li>\`;
        }
        htmlString += '</ul>';
        document.getElementsByTagName('body')[0].innerHTML = htmlString;
      })()
    </script>
  </body>
<script src="${p}_theme-explorer/jquery.min.js"></script>
</html>`;
}

function makeConf(title, docName) {
  return `
project = u'LLMWiki - ${title}'
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
latex_elements = {'papersize': 'a4paper', 'pointsize': '10pt', 'extraclassoptions': 'openany', 'preamble': r'\\usepackage{etoolbox}\\patchcmd{\\chapter}{\\cleardoublepage}{\\clearpage}{}{}'}
latex_documents = [(master_doc, '${docName}.tex', u'${title}', u'Finance Cheque UK', 'manual')]
myst_enable_extensions = ["colon_fence", "deflist"]
suppress_warnings = ["autosectionlabel.*"]
`;
}

function makeRebuildSh(docName, depth) {
  const themeDocsPath = '../'.repeat(depth) + '_theme-docs';
  return `#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
LLMWIKI_ROOT="$(cd ${'../'.repeat(depth)} && pwd)"
rm -rf build/html build/latex
sphinx-build -b html source build/html/en
cat > build/html/index.html << 'EOF'
<html><body></body><script>window.open("./en/","_self");</script></html>
EOF
bash "$LLMWIKI_ROOT/_theme-docs/llmwiki-blue.sh"
sphinx-build -b latex source build/latex/en -D language='en'
# Try latexmk first, fall back to pdflatex
if command -v latexmk &>/dev/null; then
  make -C build/latex/en all-pdf LATEXMKOPTS="-interaction=nonstopmode -halt-on-error" 2>/dev/null || true
fi
# Always try pdflatex as fallback
(cd build/latex/en && pdflatex -interaction=nonstopmode -halt-on-error *.tex 2>/dev/null && pdflatex -interaction=nonstopmode *.tex 2>/dev/null) || true
# Verify PDF was created and has content
PDF="build/latex/en/${docName}.pdf"
if [ -f "$PDF" ] && [ $(wc -c < "$PDF") -gt 1000 ]; then
  echo "PDF OK: $PDF ($(wc -c < "$PDF") bytes)"
else
  echo "WARNING: PDF may be empty or missing: $PDF"
fi
cat > build/latex/en/index.html << EOF2
<html><body></body><script>window.open("./${docName}.pdf","_self");</script></html>
EOF2
echo "Done: ${docName}"
`;
}

function makeReleasenotes(waybackLinks = []) {
  const today = new Date().toISOString().slice(0,10);
  const olderRows = waybackLinks.length
    ? waybackLinks.map(l => `${l.date}, ${l.version}, archived, \`${l.url}\``).join('\n')
    : 'yyyy-mm-dd, 0.0.0, draft, no older versions yet';
  return `# Release Notes and Notices

This section provides information about what is new or changed, including urgent issues, documentation updates, maintenance and new releases.

## This Release (Version 0.0.1)

- **${today}** - Initial release

## Older Versions

\`\`\`{csv-table} Table 1.0 — Older Versions of this Document
:file: _static/olderversions.csv
:widths: 20, 20, 20, 40
:header-rows: 1
\`\`\`

### Version 0.0.1

Initial release.

## Known and Corrected Issues

\`\`\`{csv-table} Table 1.1 — Known Issues
:file: _static/issues.csv
:widths: 20, 10, 15, 55
:header-rows: 1
\`\`\`
`;
}

function makeDocTreeview(docName) {
  return [
    {"name":"<div><b class='greenish' title='Green = HTML'>HTML</b>|<b class='redish' title='Red = PDF'>PDF</b></div>","path":"javascript:void(0)","_links":{"html":"javascript:void(0)"}},
    {"name":"<div class='title-line title-disable'><div class='flag f-en'></div>English</div>","path":"javascript:void(0)","_links":{"html":"javascript:void(0)"}},
    {"name":"<div class='language-subtitle-line enable-link gish'>Latest</div>","path":"./latest/build/html/en/index.html","_links":{"html":"./latest/build/html/en/index.html"}},
    {"name":"<div class='language-subtitle-line enable-link rish'>v0.0.1</div>","path":`./latest/build/latex/en/${docName}.pdf`,"_links":{"pdf":`./latest/build/latex/en/${docName}.pdf`}},
    {"name":"<div class='title-line title-disable'><div class='flag f-es'></div>Español</div>","path":"javascript:void(0)","_links":{"html":"javascript:void(0)"}},
    {"name":"<div class='language-subtitle-line subtitle-disable gish'>Reciente</div>","path":"javascript:void(0)","_links":{"html":"javascript:void(0)"}},
    {"name":"<div class='language-subtitle-line subtitle-disable rish'>x-x-x</div>","path":"javascript:void(0)","_links":{"html":"javascript:void(0)"}},
    {"name":"<div class='page-scroll-fix'></div>","path":"javascript:void(0)","_links":{"html":"javascript:void(0)"}}
  ];
}

export async function processIntray() {
  if (!existsSync(INTRAY)) { console.log('[intray] No _intray, skipping'); return; }

  const allFiles = readdirSync(INTRAY).filter(f => f.endsWith('.md') && f !== 'README.md');
  if (!allFiles.length) { console.log('[intray] Empty'); return; }

  // Step 1: Ask brain API which files are already deployed
  let alreadyDeployed = new Set();
  try {
    const resp = await fetch(`https://brain.financecheque.uk/api/list?api_key=${process.env.BRAIN_API_KEY || 'llmwiki-agent-key-unclehowell-2026'}`);
    const data = await resp.json();
    // brain API returns deployed file paths — extract basenames
    if (data.deployed_files) {
      for (const f of data.deployed_files) alreadyDeployed.add(f.split('/').pop());
    }
    console.log(`[intray] Brain reports ${alreadyDeployed.size} already-deployed files`);
  } catch (e) {
    console.log(`[intray] Could not reach brain API: ${e.message}`);
  }

  // Step 2: Remove already-deployed files from intray (no LLM work needed)
  const files = [];
  for (const f of allFiles) {
    if (alreadyDeployed.has(f)) {
      // File already in brain — remove from intray, no rebuild needed
      try { renameSync(join(INTRAY, f), join(INTRAY, `_done_${f}`)); } catch {}
      console.log(`[intray] Already deployed, skipping: ${f}`);
    } else {
      files.push(f);
    }
  }

  if (!files.length) { console.log('[intray] All files already deployed, nothing to do'); return; }
  console.log(`[intray] ${files.length} new/changed files to classify...`);

  // Read previews of all files
  const previews = files.map(f => ({
    file: f,
    preview: readFileSync(join(INTRAY, f), 'utf8').slice(0, 300)
  }));

  // Ask LLM to group and name them
  const prompt = `You are organising markdown files for an AI agent knowledge base called LLMWiki.

NAMING CONVENTION (from library/standardisation.md):
- Top level: categoryID_subcategoryID  (e.g. memory_longterm, skills_devops, soul_identity)
- Document level: subcategoryID_documentID  (e.g. longterm_honcho, devops_github, identity_soul)
- The second word of the category MUST match the first word of the document folder name
- Use only lowercase letters and underscores
- No "agent" prefix

FILES TO CLASSIFY:
${previews.map(p => `FILE: ${p.file}\nPREVIEW: ${p.preview}\n`).join('\n---\n')}

Return ONLY valid JSON in this exact format:
{
  "groups": [
    {
      "category": "memory_longterm",
      "categoryLabel": "Memory: Long Term",
      "document": "longterm_honcho",
      "documentLabel": "Long Term Honcho",
      "files": ["filename1.md", "filename2.md"]
    }
  ]
}

Group related files together. Each group becomes one document with HTML+PDF output.`;

  let groups;
  try {
    const response = await groq(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    groups = JSON.parse(jsonMatch[0]).groups;
    console.log(`[intray] LLM created ${groups.length} document groups`);
  } catch (e) {
    console.error(`[intray] LLM classification failed: ${e.message}`);
    // Fallback: one group per file
    groups = previews.map(p => ({
      category: 'skills_general',
      categoryLabel: 'Skills: General',
      document: `general_${p.file.replace('.md','').replace(/[^a-z0-9]/g,'_').toLowerCase()}`,
      documentLabel: p.file.replace('.md','').replace(/_/g,' '),
      files: [p.file]
    }));
  }

  // Build folder structure
  const categoryMap = {};

  for (const group of groups) {
    const { category, categoryLabel, document, documentLabel, files: groupFiles } = group;
    const docName = `${category}-${document}`.replace(/_/g,'-');
    const srcDir = join(ROOT, category, document, 'latest', 'source');
    const staticDir = join(srcDir, '_static');

    mkdirSync(srcDir, { recursive: true });
    mkdirSync(staticDir, { recursive: true });
    mkdirSync(join(ROOT, category, document, 'latest', 'build', 'html', 'en'), { recursive: true });
    mkdirSync(join(ROOT, category, document, 'latest', 'build', 'latex', 'en'), { recursive: true });

    // Move MD files
    const movedFiles = [];
    for (const f of groupFiles) {
      const src = join(INTRAY, f);
      if (!existsSync(src)) continue;
      renameSync(src, join(srcDir, f));
      movedFiles.push(f.replace('.md',''));
    }

    // index.md
    const toc = movedFiles.map(f => f).join('\n');
    writeFileSync(join(srcDir, 'index.md'), `# ${documentLabel}\n\n\`\`\`{toctree}\n:maxdepth: 2\n\n${toc}\n\`\`\`\n`);

    // releasenotes.md — check wayback for older versions
    let waybackLinks = [];
    try {
      const wbResp = await fetch(`https://wayback.financecheque.uk/api/list?api_key=wayback-readonly-key-unclehowell-2026`);
      const wbData = await wbResp.json();
      if (wbData.deployed_files) {
        const docPattern = docName.replace(/_/g, '-');
        waybackLinks = wbData.deployed_files
          .filter(f => f.includes(docPattern))
          .map(f => {
            const match = f.match(/(\d{4}-\d{2}-\d{2})_.*_v([\d.-]+)\.pdf/);
            return match ? { date: match[1], version: match[2], url: `https://wayback.financecheque.uk/wayback/${f}` } : null;
          }).filter(Boolean);
      }
    } catch {}

    writeFileSync(join(srcDir, 'releasenotes.md'), makeReleasenotes(waybackLinks));
    const olderRows = waybackLinks.length
      ? waybackLinks.map(l => `${l.date}, ${l.version}, archived, \`${l.url}\``).join('\n')
      : '**Archive Date**, **Version**, **Description**, **Download Link**\nyyyy-mm-dd, 0.0.0, draft, no older versions yet';
    writeFileSync(join(staticDir, 'olderversions.csv'), waybackLinks.length
      ? `**Archive Date**, **Version**, **Description**, **Download Link**\n${waybackLinks.map(l => `${l.date}, ${l.version}, archived, ${l.url}`).join('\n')}`
      : '**Archive Date**, **Version**, **Description**, **Download Link**\nyyyy-mm-dd, 0.0.0, draft, no older versions yet');

    writeFileSync(join(staticDir, 'issues.csv'), '**Date**, **Version**, **Subject**, **Description**\n');

    // conf.py
    writeFileSync(join(srcDir, 'conf.py'), makeConf(documentLabel, docName));

    // rebuild.sh (depth from category/document/latest/ to root = 3)
    const rebuildSh = makeRebuildSh(docName, 3);
    const rebuildPath = join(ROOT, category, document, 'latest', 'rebuild.sh');
    writeFileSync(rebuildPath, rebuildSh);

    // _treeview.json for document
    writeFileSync(join(ROOT, category, document, '_treeview.json'), JSON.stringify(makeDocTreeview(docName), null, 2));

    // index.html for document (depth 2)
    writeFileSync(join(ROOT, category, document, 'index.html'),
      makeIndexHtml(2, documentLabel, '../index.html', '_treeview.json'));

    // Track for category index
    if (!categoryMap[category]) categoryMap[category] = { label: categoryLabel, docs: [] };
    categoryMap[category].docs.push({ document, documentLabel });

    console.log(`[intray] Created ${category}/${document} with ${movedFiles.length} files`);
  }

  // Category index.html + _treeview.json
  for (const [cat, { label, docs }] of Object.entries(categoryMap)) {
    const catTv = docs.map(d => ({
      name: `<div class='subtitle-line enable-link'>${d.documentLabel}</div>`,
      path: `./${d.document}/index.html`,
      _links: { html: `./${d.document}/index.html` }
    }));
    writeFileSync(join(ROOT, cat, '_treeview.json'), JSON.stringify(catTv, null, 2));
    writeFileSync(join(ROOT, cat, 'index.html'),
      makeIndexHtml(1, label, '../index.html', '_treeview.json'));
  }

  // Root _treeview.json + index.html
  const rootTv = Object.entries(categoryMap).map(([cat, { label }]) => ({
    name: `<div class='subtitle-line enable-link'>${label}</div>`,
    path: `./${cat}/index.html`,
    _links: { html: `./${cat}/index.html` }
  }));
  writeFileSync(join(ROOT, '_treeview.json'), JSON.stringify(rootTv, null, 2));
  writeFileSync(join(ROOT, 'index.html'), makeIndexHtml(0, 'Agent Hive Mind', null, './_treeview.json'));

  console.log(`[intray] Done. ${groups.length} documents across ${Object.keys(categoryMap).length} categories.`);
}

export async function checkWayback(category) {
  try {
    const resp = await fetch(`https://wayback.financecheque.xyz/wayback/`, { headers: { 'X-API-Key': 'wayback-readonly-key-unclehowell-2026' } });
    const text = await resp.text();
    const matches = [...text.matchAll(new RegExp(`(${category}[^"'<>]+\\.pdf)`, 'gi'))];
    return matches.map(m => m[1]);
  } catch { return []; }
}
