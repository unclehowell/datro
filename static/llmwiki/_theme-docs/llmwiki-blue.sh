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

# Fix 2: Dark code blocks
find build/html/en/_static -name "theme.css" -exec sed -i \
  's/background:#fff;border:1px solid #e1e4e5/background:#1e1e3a;border:1px solid #333666/g' {} \;
find build/html/en/_static -name "theme.css" -exec sed -i \
  's/color:darkgrey/color:#e8e8f0/g' {} \;

# Fix 3: Fix line-height overlap on landing page
find build/html/en/_static -name "theme.css" -exec sed -i \
  's/line-height:3px/line-height:1.6em/g' {} \;
