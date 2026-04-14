#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
rm -rf build/html build/latex

sphinx-build -b html source build/html/en
cat > build/html/index.html << 'EOF'
<html><body></body><script>window.open("./en/","_self");</script></html>
EOF

cp ../../../_theme-docs/blue.sh ./theme.sh
sed 's|build/html/|build/html/en/|g' ./theme.sh > ./en.sh && bash ./en.sh && rm ./en.sh
rm ./theme.sh

sphinx-build -b latex source build/latex/en -D language='en'
make -C build/latex/en all-pdf 2>/dev/null || (cd build/latex/en && pdflatex -interaction=nonstopmode *.tex 2>/dev/null || true)

cat > build/latex/en/index.html << 'EOF'
<html><body></body><script>window.open("./agent-memory-longterm-honcho.pdf","_self");</script></html>
EOF
echo "Done: agent_memory/longterm_honcho"
