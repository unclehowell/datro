#!/usr/bin/env bash
#

#unset CDPATH


#.................................................
#         DATRO Consortium - 2022 Copyleft
#.................................................
#
#   ██████╗  █████╗ ████████╗██████╗  ██████╗
#   ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔═══██╗
#   ██║  ██║███████║   ██║   ██████╔╝██║   ██║
#   ██║  ██║██╔══██║   ██║   ██╔══██╗██║   ██║
#   ██████╔╝██║  ██║   ██║   ██║  ██║╚██████╔╝
#   ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝
#................................................
#       rebuild.sh  _theme-docs.08-rc2.7
#................................................
#                   datro.xyz
#................................................


# Function to display progress bar
function ProgressBar {
	local _progress=$(( (${1}*100/${2}*100)/100 ))
	local _done=$(( ($_progress*4)/10 ))
	local _left=$(( 40-$_done ))
	_done=$(printf "%${_done}s")
	_left=$(printf "%${_left}s")
	printf "Progress : [${_done// /#}${_left// /-}] ${_progress}%%"
}

# Define progress stages
_start=1
_20=20
_40=40
_60=60
_80=80
_end=100

# Initial status message
printf "
\e[2;4;33m${PWD#${PWD%/*/*/*}/} ... is rebuilding!\e[0m
"

# Step 1: Cleanup
printf "
\e[2;3;33m Step 1 of 5. Clearing old builds... 
\e[0m
"
for number in $(seq ${_start} ${_20})
do
        sleep 0.1
        ProgressBar ${number} ${_end}
done

sleep 1
# custom e.g. pull in latest custom data e.g. fiscal
#sh custom.sh 2> /dev/null &&
touch /tmp/build.log 2> /dev/null &&
make clean > /tmp/build.log 2>&1

# error check for Step 1
if [[ ! ${PWD#${PWD%/*/*/*}/*/*/} =~ ^(latest)$ ]]; then
echo "  ... ABORT 1: Directory structure mismatch."
cat /tmp/build.log
exit 1
fi
printf "\e[2;3;33m Done! 
\e[0m"

# Step 2: Converting documents to HTML (Sphinx)
printf "
\e[2;3;33m Step 2 of 5. Converting documents to HTML (make html) 
\e[0m
"
for number in $(seq ${_20} ${_40})
do
	sleep 0.1
	ProgressBar ${number} ${_end}
done

make gettext > /tmp/build.log 2>&1 &&
# copy .po into source/locales/{language-code}/LC_MESSAGES/
sphinx-intl update -p build/gettext -l es -l de -l fr  > /tmp/build.log 2>&1 &&
# The following chown command might fail if $user is not defined or if running as root.
# It's commented out for broader compatibility. Ensure file permissions are suitable.
# chown -R $user:$user ./
make html > /tmp/build.log 2>&1 &&
sleep 2 &&

# Organize HTML output for different languages
cd build &&
mkdir en &&
cd html &&
mv * ../en &&
cd .. &&
mv en html &&
cd .. &&

# Build HTML for other languages
sphinx-build -b html source build/html/es -D language='es' > /tmp/build.log 2>&1 &&
sphinx-build -b html source build/html/de -D language='de' > /tmp/build.log 2>&1 &&
sphinx-build -b html source build/html/fr -D language='fr' > /tmp/build.log 2>&1 &&
sleep 2 &&

# error check for Step 2 HTML generation
if [[ ! ${PWD#${PWD%/*/*/*}/*/*/} =~ ^(latest)$ ]]; then
echo "  ... ABORT 2: Directory structure mismatch after HTML build."
cat /tmp/build.log
exit 1
fi

# Create a root index.html to redirect to English
cd build/html
touch index.html
{
echo '<html>'
echo '<body>'
echo '</body>'
echo '<script type="text/javascript">'
echo 'window.open("./en/", "_self");'
echo '</script>'
echo '<script language="JavaScript" type="text/javascript">'
echo 'setTimeout("window.history.go(-1)",500);'
echo '</script>'
echo '</html>'
}>> index.html
cd ../.. &&

# error check for Step 2 index.html redirection
if [[ ! ${PWD#${PWD%/*/*/*}/*/*/} =~ ^(latest)$ ]]; then
echo "  ... ABORT 3: Directory structure mismatch after index.html setup."
cat /tmp/build.log
exit 1
fi
printf "\e[2;3;33m Done! 
\e[0m"

# Step 3: Converting documents to PDF (Sphinx LaTeX)
printf "
\e[2;3;33m Step 3 of 5. Converting documents to PDF (make latexpdf) 
\e[0m
"
for number in $(seq ${_40} ${_60})
do
        sleep 0.1
        ProgressBar ${number} ${_end}
done

cd build
mkdir -p pdfs/{en,es,de,fr}
cd ..

# Build PDF for English
make -e SPHINXOPTS="-D language='en'" latexpdf --keep-going --silent > /tmp/build.log 2>&1 &&
sleep 2 && cd build && mv latex/*.pdf pdfs/en && cd latex && find . -type f ! -iname "*.pdf" -delete && cd .. && cd .. &&

# error check for Step 3 English PDF
if [[ ! ${PWD#${PWD%/*/*/*}/*/*/} =~ ^(latest)$ ]]; then
echo "  ... ABORT 4: Directory structure mismatch after English PDF build."
cat /tmp/build.log
exit 1
fi

# Build PDF for other languages
make -e SPHINXOPTS="-D language='es'" latexpdf --keep-going --silent > /tmp/build.log 2>&1 &&
cd build/latex && find . -type f ! -iname "*.pdf" -delete && mv *.pdf ../pdfs/es && cd .. && cd .. &&
make -e SPHINXOPTS="-D language='de'" latexpdf --keep-going --silent > /tmp/build.log 2>&1 &&
cd build/latex && find . -type f ! -iname "*.pdf" -delete && mv *.pdf ../pdfs/de && cd .. && cd .. &&
make -e SPHINXOPTS="-D language='fr'" latexpdf --keep-going --silent > /tmp/build.log 2>&1 &&
cd build/latex && find . -type f ! -iname "*.pdf" -delete && mv *.pdf ../pdfs/fr && cd .. && cd .. &&

# Consolidate PDFs and clean up
mv build/pdfs/{en,es,de,fr} build/latex
rm -r build/pdfs

# error check for Step 3 other language PDFs
if [[ ! ${PWD#${PWD%/*/*/*}/*/*/} =~ ^(latest)$ ]]; then
echo "  ... ABORT 5: Directory structure mismatch after other language PDF builds."
cat /tmp/build.log
exit 1
fi

# Setup index.html for PDF links
cd build/latex/en
touch index.html
{
echo '<html>'
echo '<body>'
echo '</body>'
echo '<script type="text/javascript">'
}>> index.html &&
ls -1 >> name.txt
sed 's/^/window.open(".\//' name.txt > namenew.txt
sed -i 's/pdf/pdf", "_self");/g' namenew.txt
rm -r name.txt
cat  namenew.txt >> index.html
rm -r namenew.txt &&
sed -i 's/window.open(".\/index.html//' index.html
sed -i 's/window.open(".\/name.txt//' index.html
sed -i '/^$/d' index.html
{
echo '</script>'
echo '<script language="JavaScript" type="text/javascript">'
echo 'setTimeout("window.history.go(-1)",500);'
echo '</script>'
echo '</html>'
}>> index.html

cp -r index.html ../es &&
cp -r index.html ../de &&
cp -r index.html ../fr &&
cd ../.. &&

# Setup root index.html to redirect to English PDFs
touch build/index.html
{
echo '<html>'
echo '<body>'
echo '</body>'
echo '<script type="text/javascript">'
echo 'window.open("./en/", "_self");'
echo '</script>'
echo '<script language="JavaScript" type="text/javascript">'
echo 'setTimeout("window.history.go(-1)",500);'
echo '</script>'
echo '</html>'
}>> build/index.html
cd .. &&

# error check for Step 3 PDF index setup
if [[ ! ${PWD#${PWD%/*/*/*}/*/*/} =~ ^(latest)$ ]]; then
echo "  ... ABORT 6: Directory structure mismatch after PDF index setup."
cat /tmp/build.log
exit 1
fi
printf "\e[2;3;33m Done! 
\e[0m"

# Step 4: Setting HTML Theme
printf "
\e[2;3;33m Step 4 of 5. Applying HTML Theme 
\e[0m
"
for number in $(seq ${_60} ${_80})
do
       sleep 0.1
       ProgressBar ${number} ${_end}
done

# error check for Step 4 preparation
if [[ ! ${PWD#${PWD%/*/*/*}/*/*/} =~ ^(latest)$ ]]; then
echo "  ... ABORT 7: Directory structure mismatch before theme application."
cat /tmp/build.log
exit 1
fi

# Apply theme (defaulting to blue if available, otherwise fails)
# Ensure the theme scripts are correctly referenced from the parent directory
THEME_SCRIPT_PATH="../../../_theme-docs"
if [[ -f "${THEME_SCRIPT_PATH}/blue.sh" ]]; then
    cp -r "${THEME_SCRIPT_PATH}/blue.sh" ./theme.sh
elif [[ -f "${THEME_SCRIPT_PATH}/grey.sh" ]]; then
    cp -r "${THEME_SCRIPT_PATH}/grey.sh" ./theme.sh
else
    echo "  ... ERROR 7.1: No theme script (blue.sh or grey.sh) found in ${THEME_SCRIPT_PATH}."
    exit 1
fi

chmod +x ./theme.sh &&

# Apply theme to each language's HTML output
sed "s|build\/html\/|build\/html\/en\/|g" ./theme.sh > ./en.sh && chmod +x ./en.sh && bash ./en.sh && rm -r ./en.sh && sleep 1 &&
sed "s|build\/html\/|build\/html\/es\/|g" ./theme.sh > ./es.sh && chmod +x ./es.sh && bash ./es.sh && rm -r ./es.sh && sleep 1 &&
sed "s|build\/html\/|build\/html\/de\/|g" ./theme.sh > ./de.sh && chmod +x ./de.sh && bash ./de.sh && rm -r ./de.sh && sleep 1 &&
sed "s|build\/html\/|build\/html\/fr\/|g" ./theme.sh > ./fr.sh && chmod +x ./fr.sh && bash ./fr.sh && rm -r ./fr.sh && sleep 1 &&
rm -r ./theme.sh

# error check for Step 4 theme application
if [[ ! ${PWD#${PWD%/*/*/*}/*/*/} =~ ^(latest)$ ]]; then
echo "  ... ABORT 8: Directory structure mismatch after theme application."
cat /tmp/build.log
exit 1
fi

cd build/html &&
touch index.html &&
{
echo '<html>'
echo '<body>'
echo '</body>'
echo '<script type="text/javascript">'
echo 'window.open("./en/", "_self");'
echo '</script>'
echo '<script language="JavaScript" type="text/javascript">'
echo 'setTimeout("window.history.go(-1)",500);'
echo '</script>'
echo '</html>'
}>> index.html &&
cd ../.. &&

# error check for Step 4 final index setup
if [[ ! ${PWD#${PWD%/*/*/*}/*/*/} =~ ^(latest)$ ]]; then
echo "  ... ABORT 9: Directory structure mismatch after final index setup."
cat /tmp/build.log
exit 1
fi
printf "\e[2;3;33m Done! 
\e[0m"

# Step 5: Grabbing the latest auto-rebuilder
printf "
\e[2;3;33m Step 5 of 5. Updating auto-rebuilder scripts 
\e[0m
"
sleep 0.1 &&
printf "
\e[2;3;33m ----------------------------------------------------- 
\e[0m
"

# Clean up old auto-rebuild scripts if they exist
rm -r auto-rebuild.sh 2> /dev/null &

# Fetch latest update scripts (assuming they are in _theme-docs)
bash ../../../_theme-docs/update.sh 2> /dev/null &

# Copy the master auto-rebuild script
cp -r ../../../_theme-docs/auto-rebuild-master.sh auto-rebuild.sh 2> /dev/null &

sleep 5 &&

for number in $(seq ${_80} ${_end})
do
    sleep 0.1
    ProgressBar ${number} ${_end}
done

printf "\e[2;3;33m Done! 
\e[0m"

cd .. # Exit 'latest' directory

printf "
\e[2;3;33m ----------------------------------------------------- 
\e[0m
"
printf "\e[2;3;33m Build complete. 
\e[0m
"
printf "\e[2;3;33m Preview Link (adjust to suite your local machine): 
\e[0m
"
printf "\e[2;3;33m http://localhost/${PWD#${PWD%/*/*/*/*/*/*}/} 
\e[0m
"
cd latest # Return to 'latest' directory for subsequent commands if needed

# End of script
exit 0
