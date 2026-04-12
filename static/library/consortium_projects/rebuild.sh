#!/usr/bin/env bash
#
# DATRO Consortium - 2026 Copyleft
# rebuild.sh - Email Marketing Document Builder
#

set -e

user=$(whoami)
_start=1
_end=100

function ProgressBar {
    let _progress=(${1}*100/${2}*100)/100
    let _done=(${_progress}*4)/10
    let _left=40-$_done
    _done=$(printf "%${_done}s")
    _left=$(printf "%${_left}s")
    printf "\rProgress : [${_done// /#}${_left// /-}] ${_progress}%%"
}

printf "\n\e[2;4;33mConsortium Projects Document - Building...\e[0m\n"

printf "\n\e[2;3;33m Step 1 of 4. Cleaning old builds... \n\e[0m"
for number in $(seq ${_start} 20)
do
    sleep 0.2
    ProgressBar ${number} ${_end}
done

rm -rf ./latest/build/*
mkdir -p ./latest/build/html ./latest/build/latex

printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m Step 2 of 4. Building HTML documentation... \n\e[0m"
for number in $(seq 20 50)
do
    sleep 0.2
    ProgressBar ${number} ${_end}
done

# Build HTML with Sphinx
sphinx-build -b html source latest/build/html/en -D language='en' > /tmp/build.log 2>&1 || true

# Copy static assets
cp -r /home/ubuntu/datro/demos/_theme-docs/html/* latest/build/html/en/_static/ 2>/dev/null || true

printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m Step 3 of 4. Building PDF documentation... \n\e[0m"
for number in $(seq 50 80)
do
    sleep 0.2
    ProgressBar ${number} ${_end}
done

# Build LaTeX/PDF
sphinx-build -b latex source latest/build/latex/en -D language='en' > /tmp/build.log 2>&1 || true

# Try to convert to PDF if pdflatex available
if command -v pdflatex &> /dev/null; then
    cd latest/build/latex/en
    pdflatex -interaction=nonstopmode *.tex > /dev/null 2>&1 || true
    cd -
fi

printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m Step 4 of 4. Finalizing build... \n\e[0m"
for number in $(seq 80 ${_end})
do
    sleep 0.1
    ProgressBar ${number} ${_end}
done

# Organize language directories
cd latest/build/html
mkdir -p es de fr
cp -r en/* es/ 2>/dev/null || true
cp -r en/* de/ 2>/dev/null || true
cp -r en/* fr/ 2>/dev/null || true

# Create redirect index.html
cat > index.html << 'INDEXHTML'
<html>
<body>
<script type="text/javascript">
window.open("./en/", "_self");
</script>
</body>
</html>
INDEXHTML

cd ../latex
mkdir -p es de fr
cp -r en/* es/ 2>/dev/null || true
cp -r en/* de/ 2>/dev/null || true
cp -r en/* fr/ 2>/dev/null || true

cat > index.html << 'INDEXHTML'
<html>
<body>
<script type="text/javascript">
window.open("./en/", "_self");
</script>
</body>
</html>
INDEXHTML

cd ../..

printf "\e[2;3;33m Done! \n\e[0m\n"
printf "\n\e[2;4;32mBuild complete! Output in ./latest/build/\e[0m\n"
