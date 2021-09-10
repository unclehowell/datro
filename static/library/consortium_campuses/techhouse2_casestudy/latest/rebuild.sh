#!/usr/bin/env bash
#

#unset CDPATH


#.................................................
#         DATRO Consortium - 2021 Copyleft
#.................................................
#
#   ██████╗  █████╗ ████████╗██████╗  ██████╗
#   ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔═══██╗
#   ██║  ██║███████║   ██║   ██████╔╝██║   ██║
#   ██║  ██║██╔══██║   ██║   ██╔══██╗██║   ██║
#   ██████╔╝██║  ██║   ██║   ██║  ██║╚██████╔╝
#   ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝
#................................................
#       rebuild.sh  _theme-docs.08-rc2.1
#................................................
#                   datro.xyz
#................................................


function ProgressBar {
	let _progress=(${1}*100/${2}*100)/100
	let _done=(${_progress}*4)/10
	let _left=40-$_done
	_done=$(printf "%${_done}s")
	_left=$(printf "%${_left}s")
	printf "\rProgress : [${_done// /#}${_left// /-}] ${_progress}%%"
}

_start=1
_20=20
_40=40
_60=60
_80=80
_end=100

printf "\n\e[2;4;33m${PWD#${PWD%/*/*/*}/} ... is rebuilding!\e[0m\n"

printf "\n\e[2;3;33m Step 1 of 5. Cleared old builds. Run custom script ? (enable/disable in rebuild.sh) \n\e[0m\n"
for number in $(seq ${_start} ${_20})
do
        sleep 0.1
        ProgressBar ${number} ${_end}
done

# custom e.g. pull in latest custom data e.g. fiscal
#sh custom.sh 2> /dev/null &&
touch build.log
make clean > build.log 2>&1

printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m Step 2 of 5. Converting ReStructuredText to HTML (make html) \n\e[0m\n"
for number in $(seq ${_20} ${_40})
do
	sleep 0.1
	ProgressBar ${number} ${_end}
done


make gettext > build.log 2>&1 &&
# copy .po into source/locales/{language-code}/LC_MESSAGES/
sleep 2 &&
sphinx-intl update -p build/gettext -l es -l de -l fr  > build.log 2>&1 &&
sleep 2 &&
make html > build.log 2>&1 &&
sleep 2 &&

cd build &&
mkdir en &&
cd html &&
mv * ../en &&
cd ..
mv en html &&
cd ..
sleep 2 &&
sphinx-build -b html source build/html/es -D language='es' > build.log 2>&1 &&
sleep 2 &&
sphinx-build -b html source build/html/de -D language='de' > build.log 2>&1 &&
sleep 2 &&
sphinx-build -b html source build/html/fr -D language='fr' > build.log 2>&1 &&
sleep 2 &&


cd build
cd html
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
cd ..
cd ..
sleep 5 &&

printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m Step 3 of 5. Converting ReStructeredText to PDF (make latexpdf) \n\e[0m\n"

for number in $(seq ${_40} ${_60})
do
        sleep 0.1
        ProgressBar ${number} ${_end}
done

cd build
mkdir -p pdfs/{en,es,de,fr}
printf "\n\e[2;3;33m making pdf (en) \n\e[0m\n"
cd ..

make  -e SPHINXOPTS="-D language='en'" latexpdf  --keep-going --silent > build.log 2>&1 &&
ls -1 build/latex/

sleep 2 && cd build && mv latex/*.pdf pdfs/en && cd latex && find . -type f ! -iname "*.pdf" -delete &&

ls -la ../pdfs/en
cd ..
cd ..

make  -e SPHINXOPTS="-D language='es'" latexpdf  --keep-going --silent > build.log 2>&1 &&
cd build/latex && find . -type f ! -iname "*.pdf" -delete && mv *.pdf ../pdfs/es && cd .. && cd .. &&
make  -e SPHINXOPTS="-D language='de'" latexpdf  --keep-going --silent > build.log 2>&1 &&
cd build/latex && find . -type f ! -iname "*.pdf" -delete && mv *.pdf ../pdfs/de && cd .. && cd .. &&
make  -e SPHINXOPTS="-D language='fr'" latexpdf  --keep-going --silent > build.log 2>&1 &&
cd build/latex && find . -type f ! -iname "*.pdf" -delete && mv *.pdf ../pdfs/fr && cd .. && cd .. &&


mv build/pdfs/{en,es,de,fr} build/latex
rm -r build/pdfs

printf "\n\e[2;3;33m check we're back in ./ (CTL+C if not) \n\e[0m\n"
pwd


printf "\n\e[2;3;33m Making redirect from language directories to pdf's \n\e[0m\n"

cd build
cd latex
cd en
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

printf "\e[2;3;33m Copy index.html redirect into language directories \n\e[0m"
cp -r index.html ../es &&
cp -r index.html ../de &&
cp -r index.html ../fr &&
cd ..
printf "\e[2;3;33m Double check we're in ./build/latex/ (CTL+C if not) \n\e[0m"
pwd
sleep 2 &&

# now we redirect to /en
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
cd ..
cd ..
printf "\e[2;3;33m Make sure we're back at ./ (CTL+C if not) \n\e[0m"
pwd

sleep 2 &&
printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m Step 4 of 5. Setting HTML Theme (alternate color in rebuild.sh) \n\e[0m\n"
for number in $(seq ${_60} ${_80})
do
       sleep 0.1
       ProgressBar ${number} ${_end}
done

sleep 2 &&

# Select a color theme (default blue)
#cp -r ../../../_theme-docs/grey.sh grey.sh 2> /dev/null && mv ./grey.sh ./theme.sh &&
cp -r ../../../_theme-docs/blue.sh blue.sh 2> /dev/null && mv ./blue.sh ./theme.sh &&

sudo chmod +x ./theme.sh &&
sed 's|build\/html\/|build\/html\/en\/|g' ./theme.sh > ./en.sh && chmod +x ./en.sh && bash ./en.sh && rm -r ./en.sh && sleep 2 &&
printf "\n\e[2;3;33m en theme done \n\e[0m\n"
sed 's|build\/html\/|build\/html\/es\/|g' ./theme.sh > ./es.sh && chmod +x ./es.sh && bash ./es.sh && rm -r ./es.sh && sleep 2 &&
printf "\n\e[2;3;33m es theme done \n\e[0m\n"
sed 's|build\/html\/|build\/html\/de\/|g' ./theme.sh > ./de.sh && chmod +x ./de.sh && bash ./de.sh && rm -r ./de.sh && sleep 2 &&
sed 's|build\/html\/|build\/html\/fr\/|g' ./theme.sh > ./fr.sh && chmod +x ./fr.sh && bash ./fr.sh && rm -r ./fr.sh && sleep 2 &&
rm -r ./theme.sh

sleep 2 &&


printf "\e[2;3;33m redirect build/html to build/html/en (default language) \n\e[0m"

cd build
cd html
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
cd ..
cd ..
sleep 2 &&


printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m Step 5 of 5. Grabbing the latest auto-rebuilder \n\e[0m\n"
for number in $(seq ${_80} ${_end})
do
    sleep 0.1
    ProgressBar ${number} ${_end}
done

# making sure the auto-rebuild.sh is the latest version, for the next auto-build
rm -r auto-rebuild.sh 2> /dev/null &

bash ../../../_theme-docs/update.sh 2> /dev/null &

cp -r ../../../_theme-docs/auto-rebuild-master.sh auto-rebuild.sh 2> /dev/null &

sleep 1 &&

cd ../
printf "\e[2;3;33m http://localhost/datro-gh-pages/static/library/${PWD#${PWD%/*/*}/} \n\e[0m\n"
cd latest

#change NAME to PDF name before running
#pdftk build/latex/NAME.pdf cat 1-10 11 13 15 17 19 20 21  output build/latex/NAME-tmp.pdf &&
#mv build/latex/NAME-tmp.pdf build/latex/NAME.pdf
#
# going wild here to make absultely sure the script escapes - it can hang for all sorts of reasons
sleep 0.1 &&
exit 1 &
sleep 0.1 &&
exit 0 &
sleep 0.1 &&
exit
sleep 0.1 &&
exit 0
sleep 0.1 &&
exit 1
sleep 0.1 &&
end
