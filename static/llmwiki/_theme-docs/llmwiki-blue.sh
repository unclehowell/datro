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
.rst-content table.docutils thead,.rst-content table.docutils th{background:#1e1e3a!important;color:#e8e8f0!important;border-color:#444466!important;}
.rst-content table.docutils td{border-color:#444466;}
.rst-content table.docutils caption{font-weight:700;font-size:100%;color:#55a5d9;text-align:left;margin-bottom:6px;}
" >> {}'

# Directly fix the 3em margin blue.sh sets on list items — sed replace in the file
find build/html/en/_static -name "theme.css" -exec sed -i \
  's/margin-bottom:3em;/margin-bottom:0.3em;/g' {} \;
find build/html/en/_static -name "theme.css" -exec sed -i \
  's/line-height:3px;/line-height:1.5em;/g' {} \;

# Strip <p> wrappers inside <li> directly in HTML (root cause of blank line spacing)
find build/html/en -name "*.html" -exec sed -i \
  's|<li><p>|<li>|g; s|</p></li>|</li>|g' {} \;

# Collapse excessive vertical spacing — remove empty paragraphs and reduce margins
find build/html/en/_static -name "theme.css" | xargs -I{} sh -c 'echo "
.rst-content p:empty{display:none!important;}
.rst-content section>p+p{margin-top:0!important;}
.rst-content h1,.rst-content h2,.rst-content h3{margin-top:12px!important;margin-bottom:6px!important;}
.rst-content .toctree-wrapper ul li{margin-top:2px!important;margin-bottom:2px!important;line-height:1.4em!important;}
.rst-content .toctree-wrapper{margin-bottom:12px!important;}
" >> {}'

# Fix footer — replace YYYY placeholder and strip duplicate copyright text
find build/html/en -name "*.html" -exec sed -i \
  's|href="https://datro.xyz"|href="https://financecheque.uk"|g' {} \;
find build/html/en -name "*.html" -exec sed -i \
  's|>datro.xyz<|>financecheque.uk<|g' {} \;
find build/html/en -name "*.html" -exec sed -i \
  's|DATRO Consortium</strong></b>|Finance Cheque UK</strong></b>|g' {} \;
find build/html/en -name "*.html" -exec sed -i \
  's|Finance Cheque UK</strong></b>nance Cheque UK\.|Finance Cheque UK</strong></b>|g' {} \;
find build/html/en -name "*.html" -exec sed -i \
  's|Finance Cheque UK</strong></b> Finance Cheque UK\.|Finance Cheque UK</strong></b>|g' {} \;

# Fix 3: Fix line-height overlap on landing page
find build/html/en/_static -name "theme.css" -exec sed -i \
  's/line-height:3px/line-height:1.6em/g' {} \;
