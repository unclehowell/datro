#!/usr/bin/env bash
# llmwiki-blue.sh — must be called from the latest/ directory of a document
# Applies blue.sh base theme then llmwiki-specific fixes

set -e

# Find _theme-docs relative to this script's actual location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Apply base blue theme
cp "$SCRIPT_DIR/blue.sh" ./theme.sh
sed 's|build/html/|build/html/en/|g' ./theme.sh > ./en.sh && bash ./en.sh && rm ./en.sh
rm ./theme.sh

# Fix 1: Sidebar stays expanded
find build/html/en -name "*.html" -exec sed -i \
  's|</head>|<style>.wy-menu-vertical li.toctree-l1>a+ul,.wy-menu-vertical li.toctree-l2>a+ul{display:block!important;}</style></head>|g' {} \;

# Fix 2: Dark code blocks — inject overrides at end of CSS (highest specificity)
find build/html/en/_static -name "theme.css" | xargs -I{} sh -c 'echo "
div[class^=\"highlight\"],pre.literal-block{background:#1e1e3a!important;border-color:#333666!important;}
div[class^=\"highlight\"] pre,pre.literal-block{color:#e8e8f0!important;background:#1e1e3a!important;}
.highlight{background:#1e1e3a!important;}
.highlight .hll{background:#2a2a4a!important;}
code,tt,.rst-content code,.rst-content tt{background:#1e1e3a!important;color:#e8e8f0!important;border-color:#333666!important;}
" >> {}'

# Fix 3: Fix line-height overlap on landing page
find build/html/en/_static -name "theme.css" -exec sed -i \
  's/line-height:3px/line-height:1.6em/g' {} \;
