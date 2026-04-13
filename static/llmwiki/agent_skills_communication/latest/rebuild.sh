#!/usr/bin/env bash
# rebuild.sh for agent_skills_communication — matches library standardisation
# Builds MD sources via Sphinx+myst-parser → HTML (RTD theme + blue.sh) + PDF

set -e
cd "$(dirname "$0")"

echo "Building Agent Skills Communication..."

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
<script>window.open("./agent-skills-communication.pdf","_self");</script>
<script language="JavaScript">setTimeout("window.history.go(-1)",500);</script>
</html>
PEOF

echo "Done: agent_skills_communication"
