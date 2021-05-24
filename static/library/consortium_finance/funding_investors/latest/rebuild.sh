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
#       rebuild.sh  -theme-docs.08-rc1.6
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
sh custom.sh 2> /dev/null &&
touch build.log
make clean > build.log 2>&1
printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m Step 2 of 5. Converting ReStructuredText to HTML (make html) \n\e[0m\n"
for number in $(seq ${_20} ${_40})
do
	sleep 0.1
	ProgressBar ${number} ${_end}
done


make html > build.log 2>&1 &&
printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m Step 3 of 5. Converting ReStructeredText to PDF (make latexpdf) \n\e[0m\n"

for number in $(seq ${_40} ${_60})
do
        sleep 0.1
        ProgressBar ${number} ${_end}
done

make latexpdf --keep-going --silent > build.log 2>&1
sleep 10 &&
cd build
cd latex
find . -type f ! -iname "*.pdf" -delete &&
cd ../../

printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m Step 4 of 5. Setting HTML Theme (alternate color in rebuild.sh) \n\e[0m\n"
for number in $(seq ${_60} ${_80})
do
       sleep 0.1
       ProgressBar ${number} ${_end}
done


# Set color theme (default blue)
cp -r ../../../_theme-docs/blue.sh blue.sh 2> /dev/null && chmod +x ./blue.sh && bash ./blue.sh && rm -r ./blue.sh &
#cp -r ../../../_theme-docs/grey.sh grey.sh 2> /dev/null && chmod +x ./grey.sh && bash ./grey.sh && rm -r ./grey.sh &

sleep 0.5 &&

cd build/latex
touch index.html
{
echo '<html>'
echo '<body>'
echo '</body>'
echo '<script type="text/javascript">'
}>> index.html &&
ls -1 >> name.txt
sed 's/^/window.open(".\//' name.txt > namenew.txt
sed -i 's/pdf/pdf");/g' namenew.txt
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
cd ../../


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
