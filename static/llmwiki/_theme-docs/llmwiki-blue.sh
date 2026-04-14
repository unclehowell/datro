#!/usr/bin/env bash
# llmwiki-blue.sh — extends _theme-docs/blue.sh with llmwiki-specific fixes
# Run from latest/ directory, same as blue.sh

THEME_DOCS="$(dirname "$0")/../../../_theme-docs"

# Apply base blue theme first
cp "$THEME_DOCS/blue.sh" ./theme.sh
sed 's|build/html/|build/html/en/|g' ./theme.sh > ./en.sh && bash ./en.sh && rm ./en.sh
rm ./theme.sh

# Fix 1: Sidebar stays expanded — disable toctree collapse in RTD JS
find build/html/en/_static -name "theme.js" | xargs -I{} sed -i \
  's/wy-menu-vertical.*toctree.*click/\/\/ sidebar-collapse-disabled/g' {} 2>/dev/null || true
# Inject CSS to keep all toctree items expanded
find build/html/en -name "*.html" | xargs -I{} sed -i \
  's|</head>|<style>.wy-menu-vertical li.toctree-l1>a+ul,.wy-menu-vertical li.toctree-l2>a+ul{display:block!important;}</style></head>|g' {}

# Fix 2: Dark code blocks (extend blue.sh's existing dark code fix)
find build/html/en/_static -name "theme.css" | xargs -I{} sed -i \
  's/div\[class\^="highlight"\]{background:#fff/div[class^="highlight"]{background:#1e1e3a/g' {} 2>/dev/null || true
find build/html/en/_static -name "theme.css" | xargs -I{} sed -i \
  's/.highlight{background:#eeffcc/.highlight{background:#1e1e3a;color:#e8e8f0/g' {} 2>/dev/null || true

# Fix 3: Fix text overlap on landing page — proper line-height for toctree
find build/html/en/_static -name "theme.css" | xargs -I{} sed -i \
  's/.wy-plain-list-disc,article ul{display:list-item;line-height:3px;/.wy-plain-list-disc,article ul{display:list-item;line-height:1.6em;/g' {}

# Fix 6: Replace GB flag reference with English flag text in footer
find build/html/en -name "*.html" | xargs -I{} sed -i \
  's/flag f-gb/flag f-en/g' {} 2>/dev/null || true
