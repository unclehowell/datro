#!/usr/bin/env bash
set -e
cd "."
LLMWIKI_ROOT="/"

rm -rf build/html build/latex
sphinx-build -b html source build/html/en -q
echo '<html><body></body><script>window.open("./en/","_self");</script></html>' > build/html/index.html

bash "$LLMWIKI_ROOT/_theme-docs/llmwiki-blue.sh"

mkdir -p build/latex/en
sphinx-build -b latex source build/latex/en -q
if [ -f "build/latex/en/fcuk-agent-fcuk-soul-fcuk-soul.tex" ]; then
  cd build/latex/en
  pdflatex -interaction=nonstopmode fcuk-agent-fcuk-soul-fcuk-soul.tex > /dev/null 2>&1 || true
  pdflatex -interaction=nonstopmode fcuk-agent-fcuk-soul-fcuk-soul.tex > /dev/null 2>&1 || true
  cd -
fi

PDF="build/latex/en/fcuk-agent-fcuk-soul-fcuk-soul.pdf"
if [ -f "$PDF" ] && [ "$(wc -c < "$PDF")" -gt 1000 ]; then
  echo "PDF OK: $PDF ($(wc -c < "$PDF") bytes)"
else
  echo "WARNING: PDF missing or too small: $PDF"
fi
echo '<html><body></body><script>window.open("./fcuk-agent-fcuk-soul-fcuk-soul.pdf","_self");</script></html>' > build/latex/en/index.html
echo 'Done: fcuk-agent-fcuk-soul-fcuk-soul'
