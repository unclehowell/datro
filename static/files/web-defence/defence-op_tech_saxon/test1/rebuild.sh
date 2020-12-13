#!/usr/bin/env bash
#

unset CDPATH


#.......................................................
#  HotspotBnB - 2020 Copyright - Wave Telecom Limited
#.......................................................
#       HotspotBnB Document Library - rebuild.sh
#.......................................................
#             https://docs.hotspotbnb.com
#.......................................................
#
#                     Version 0.3
#          view _blue-build-source/README.md changelog
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

sudo sh custom.sh &&
sudo rm -r build.log &
sudo touch build.log &
sudo chown 664 build.log &
sudo make clean 2>/dev/null | grep -v 'Permission denied' > build.log & 
printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m 2. Converting RST to HTML \n\e[0m\n"
for number in $(seq ${_20} ${_40})
do
	sleep 0.1
	ProgressBar ${number} ${_end}
done


sudo make html 2>/dev/null | grep -v 'Permission denied' > build.log
printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m 3. Converting RST to PDF \n\e[0m\n"

for number in $(seq ${_40} ${_60})
do
        sleep 0.1
        ProgressBar ${number} ${_end}
done

sudo make latexpdf 2>/dev/null | grep -v 'Permission denied' > build.log
cd build
cd latex
sudo find . -type f ! -iname "*.pdf" -delete &&
cd ../../

printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m 4. Changing HTML Theme from Default to HotspotBnB \n\e[0m\n"
for number in $(seq ${_60} ${_80})
do
       sleep 0.1
       ProgressBar ${number} ${_end}
done

cd build
cd html
sudo sed -i 's/ View page source/ /g' *.html
sudo sed -i 's/<div class="version">/<div class="version"> Document Version : /g' *.html
cd _static/css
sudo sed -i 's/#d9d9d9/grey/g' theme.css
sudo sed -i 's/#2980B9/#303c42/g' theme.css
sudo sed -i 's/#2980B9/#1a73e8/g' theme.css
sudo sed -i 's/#9B59B6/#a3a3a3/g' theme.css
sudo sed -i 's/body{/body{text-align:justify;/g' theme.css
sudo sed -i 's/.wy-nav-top{/.wy-nav-top{width:100vw!important;position:fixed!important;/g' theme.css
sudo sed -i 's/body{/body{scroll-padding-top: 70px!important;/g' theme.css
sudo sed -i 's/html{/html{scroll-padding-top: 70px!important;/g' theme.css
sudo sed -i 's/h3{font/h3{font-align:left;font/g' theme.css
sudo sed -i 's/.wy-table-responsive table td/.wy-table-responsive table td {white-space: normal !important;} .wy-table-responsive table td/g' theme.css
sudo sed -i 's/.wy-table-responsive {/.wy-table-responsive {overflow: visible !important;/g' theme.css
sudo sed -i 's/h2,/h2 {text-align:left!important;} h2,/g' theme.css
sudo sed -i 's/.rst-content img{/ @media all and (min-width: 680px) { .rst-content img {margin-left:24px!important;} } .rst-content img{ /g' theme.css
sudo sed -i 's/a:visited{color:#a3a3a3}/a:visited{color:#5F9EA0;}/g' theme.css
cd ../../../../

printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m 5. Grabbing the latest auto-rebuilder \n\e[0m\n"
for number in $(seq ${_80} ${_end})
do
    sleep 0.1
    ProgressBar ${number} ${_end}
done

# making sure the auto-rebuild.sh is the latest version, for the next auto-build
sudo rm -r auto-rebuild.sh

sudo cp -r ../../../_blue-build-source/auto-rebuild-master.sh auto-rebuild.sh

printf "\e[2;3;33m Finished! \n\e[0m\n"

