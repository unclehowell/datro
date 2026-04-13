#!/usr/bin/env node
// setup-sphinx.js — generates conf.py and rebuild.sh for each llmwiki section
// Uses Sphinx + myst-parser (MD→HTML/PDF) with same RTD theme + blue.sh as library

import { readdirSync, writeFileSync, statSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('.', import.meta.url).pathname;
const SKIP = new Set(['_theme-explorer','_theme-docs','_theme-vitepress','_test','node_modules','raw','wiki','consortium_legal']);

const sections = readdirSync(ROOT).filter(d => {
  if (d.startsWith('_') || d.startsWith('.') || SKIP.has(d)) return false;
  return statSync(join(ROOT,d)).isDirectory() && existsSync(join(ROOT,d,'latest','source'));
});

for (const section of sections) {
  const src = join(ROOT, section, 'latest', 'source');
  const latestDir = join(ROOT, section, 'latest');
  const title = section.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  const docName = section.replace(/_/g,'-');

  // conf.py — same as library but with myst-parser for MD
  writeFileSync(join(src, 'conf.py'), `
project = u'DATRO LLMWiki - ${title}'
copyright = u'2024, DATRO Consortium'
author = u'The Team @ DATRO Consortium'

version = u'0.0.1'
release = u'0.0.1'

extensions = [
    'sphinx.ext.autosectionlabel',
    'myst_parser',
]

source_suffix = {
    '.rst': 'restructuredtext',
    '.md': 'markdown',
}

master_doc = 'index'

language = "en"
locale_dirs = ['locales']
gettext_auto_build = True
gettext_compact = "docs"

exclude_patterns = ['_build', '.vitepress']

pygments_style = None

html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']

htmlhelp_basename = '${docName}'

latex_elements = {
    'papersize': 'a4paper',
    'pointsize': '10pt',
}

latex_documents = [
    (master_doc, '${docName}.tex', u'${title}', u'DATRO Consortium', 'manual'),
]

myst_enable_extensions = ["colon_fence", "deflist"]
`);

  // index.md — if missing, generate one
  if (!existsSync(join(src, 'index.md'))) {
    const mdFiles = [];
    function walk(d) {
      for (const f of readdirSync(d).sort()) {
        const full = join(d, f);
        if (statSync(full).isDirectory() && !f.startsWith('.') && !f.startsWith('_')) walk(full);
        else if (f.endsWith('.md') && f !== 'index.md') mdFiles.push(full.replace(src+'/', '').replace(/\.md$/, ''));
      }
    }
    walk(src);
    writeFileSync(join(src, 'index.md'), `# ${title}\n\n\`\`\`{toctree}\n:maxdepth: 2\n\n${mdFiles.join('\n')}\n\`\`\`\n`);
  }

  // rebuild.sh — same structure as library's rebuild-master.sh
  writeFileSync(join(latestDir, 'rebuild.sh'), `#!/usr/bin/env bash
# rebuild.sh for ${section} — matches library standardisation
# Builds MD sources via Sphinx+myst-parser → HTML (RTD theme + blue.sh) + PDF

set -e
cd "$(dirname "$0")"

echo "Building ${title}..."

# Clean
make -C . clean 2>/dev/null || true
rm -rf build/html build/latex

# HTML (English)
sphinx-build -b html source build/html/en
sphinx-build -b html source build/html/es -D language='es' 2>/dev/null || true
sphinx-build -b html source build/html/de -D language='de' 2>/dev/null || true
sphinx-build -b html source build/html/fr -D language='fr' 2>/dev/null || true

# HTML redirect index
cat > build/html/index.html << 'EOF'
<html><body></body>
<script>window.open("./en/","_self");</script>
<script language="JavaScript">setTimeout("window.history.go(-1)",500);</script>
</html>
EOF

# Apply DATRO blue theme (same as library)
cp ../../_theme-docs/blue.sh ./theme.sh
sed 's|build/html/|build/html/en/|g' ./theme.sh > ./en.sh && bash ./en.sh && rm ./en.sh
sed 's|build/html/|build/html/es/|g' ./theme.sh > ./es.sh && bash ./es.sh && rm ./es.sh 2>/dev/null || true
sed 's|build/html/|build/html/de/|g' ./theme.sh > ./de.sh && bash ./de.sh && rm ./de.sh 2>/dev/null || true
sed 's|build/html/|build/html/fr/|g' ./theme.sh > ./fr.sh && bash ./fr.sh && rm ./fr.sh 2>/dev/null || true
rm ./theme.sh

# PDF
sphinx-build -b latex source build/latex/en -D language='en'
make -C build/latex/en all-pdf 2>/dev/null || (cd build/latex/en && pdflatex -interaction=nonstopmode *.tex 2>/dev/null || true)
mkdir -p build/latex/en
mv build/latex/en/*.pdf build/latex/en/ 2>/dev/null || true

# PDF redirect index
cat > build/latex/en/index.html << 'PEOF'
<html><body></body>
<script>window.open("./${docName}.pdf","_self");</script>
<script language="JavaScript">setTimeout("window.history.go(-1)",500);</script>
</html>
PEOF

echo "Done: ${section}"
`);

  // Makefile — same as library
  writeFileSync(join(latestDir, 'Makefile'), `SPHINXOPTS    ?=
SPHINXBUILD   ?= sphinx-build
SOURCEDIR     = source
BUILDDIR      = build

help:
\t@\$(SPHINXBUILD) -M help "\$(SOURCEDIR)" "\$(BUILDDIR)" \$(SPHINXOPTS) \$(O)

.PHONY: help Makefile

%: Makefile
\t@\$(SPHINXBUILD) -M \$@ "\$(SOURCEDIR)" "\$(BUILDDIR)" \$(SPHINXOPTS) \$(O)
`);

  console.log(`✓ ${section}`);
}

console.log(`\nDone. Run rebuild.sh in any section/latest/ to build.`);
