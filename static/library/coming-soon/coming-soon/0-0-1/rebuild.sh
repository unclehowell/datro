#!/usr/bin/env bash
#

unset CDPATH


#.......................................................
#           2020 Copyleft - DATRO Consortium
#.......................................................
#       DATRO Document Library by Unclehowell
#.......................................................
#                   https://datro.xyz/
#.......................................................
#
#                      Version 0.5
#  ../../../ _blue-build-source/README.md & CHANGELOG.md
#.......................................................


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

printf "\n\e[2;4;33m${PWD#${PWD%/*/*/*}/}\e[0m\n"

printf "\n\e[2;3;33m 1. Running custom script (if exists) and clearing old builds & logs \n\e[0m\n"
for number in $(seq ${_start} ${_20})
do
        sleep 0.1
        ProgressBar ${number} ${_end}
done

# custom e.g. pull in cryptocurrency data etc
sh custom.sh 2> /dev/null &&
touch build.log
make clean > build.log 2>&1
printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m 2. Converting RST to HTML \n\e[0m\n"
for number in $(seq ${_20} ${_40})
do
	sleep 0.1
	ProgressBar ${number} ${_end}
done


make html > build.log 2>&1
printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m 3. Converting RST to PDF \n\e[0m\n"

for number in $(seq ${_40} ${_60})
do
        sleep 0.1
        ProgressBar ${number} ${_end}
done

make latexpdf > build.log 2>&1

cd build
cd latex
find . -type f ! -iname "*.pdf" -delete &&
cd ../../

printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m 4. Changing HTML Theme from Default to DATRO \n\e[0m\n"
for number in $(seq ${_60} ${_80})
do
       sleep 0.1
       ProgressBar ${number} ${_end}
done

cd build
cd html
sed -i 's/ View page source/ /g' *.html
sed -i 's/<div class="version">/<div class="version"> Document Version : /g' *.html
sed -i 's/<div role="contentinfo"/<div role="contentinfo" style="visibility:hidden!important;opacity:0!important;"/g' *.html
cd _static/css
sed -i 's/#d9d9d9/initial/g' theme.css
sed -i 's/#2980B9/#303c42/g' theme.css
sed -i 's/#2980B9/#1a73e8/g' theme.css
sed -i 's/#9B59B6/#a3a3a3/g' theme.css
sed -i 's/body{/body{text-align:justify;/g' theme.css
sed -i 's/.wy-nav-top{/.wy-nav-top{width:100vw!important;position:fixed!important;/g' theme.css
sed -i 's/body{/body{scroll-padding-top: 70px!important;/g' theme.css
sed -i 's/html{/html{scroll-padding-top: 70px!important;/g' theme.css
sed -i 's/h3{font/h3{font-align:left;font/g' theme.css
sed -i 's/.wy-table-responsive table td/.wy-table-responsive table td {white-space: normal !important;} .wy-table-responsive table td/g' theme.css
sed -i 's/.wy-table-responsive {/.wy-table-responsive {overflow: visible !important;/g' theme.css
sed -i 's/h2,/h2 {text-align:left!important;} h2,/g' theme.css
sed -i 's/.rst-content img{/ @media all and (min-width: 680px) { .rst-content img {margin-left:24px!important;} } .rst-content img{ /g' theme.css
sed -i 's/a:visited{color:#a3a3a3}/a:visited{color:#5F9EA0;}/g' theme.css
cd ../../../../
printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m 5. Grabbing the latest auto-rebuilder \n\e[0m\n"
for number in $(seq ${_80} ${_end})
do
    sleep 0.1
    ProgressBar ${number} ${_end}
done

# making sure the auto-rebuild.sh is the latest version, for the next auto-build
rm -r auto-rebuild.sh &

bash ../../../_blue-build-source/update.sh &&

cp -r ../../../_blue-build-source/auto-rebuild-master.sh auto-rebuild.sh &&

printf "\e[2;3;33m Finished! \n\e[0m\n"
