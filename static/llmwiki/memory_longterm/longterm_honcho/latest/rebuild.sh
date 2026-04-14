#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
rm -rf build/html build/latex

# Build HTML
sphinx-build -b html source build/html/en

cat > build/html/index.html << 'EOF'
<html><body></body><script>window.open("./en/","_self");</script></html>
EOF

# Apply DATRO llmwiki blue theme
bash ../../../_theme-docs/llmwiki-blue.sh

# Build PDF
sphinx-build -b latex source build/latex/en -D language='en'
make -C build/latex/en all-pdf 2>/dev/null || (cd build/latex/en && pdflatex -interaction=nonstopmode *.tex 2>/dev/null || true)

# Remove blank pages from PDF
gs -dBATCH -dNOPAUSE -q -sDEVICE=pdfwrite -dFIXEDMEDIA \
   -sOutputFile=build/latex/en/memory-longterm_longterm-honcho-clean.pdf \
   build/latex/en/memory-longterm_longterm-honcho.pdf 2>/dev/null && \
   mv build/latex/en/memory-longterm_longterm-honcho-clean.pdf \
      build/latex/en/memory-longterm_longterm-honcho.pdf 2>/dev/null || true

cat > build/latex/en/index.html << 'EOF'
<html><body></body><script>window.open("./memory-longterm_longterm-honcho.pdf","_self");</script></html>
EOF

echo "Done: memory_longterm/longterm_honcho"
