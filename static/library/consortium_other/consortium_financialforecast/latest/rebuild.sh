#!/usr/bin/env bash

unset CDPATH

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

printf "\n\e[2;3;33m Step 1 of 4. Clearing old builds \n\e[0m\n"
for number in $(seq ${_start} ${_20})
do
	sleep 0.1
	ProgressBar ${number} ${_end}
done

touch build.log
make clean > build.log 2>&1
printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m Step 2 of 4. Converting RST to HTML \n\e[0m\n"
for number in $(seq ${_20} ${_40})
do
	sleep 0.1
	ProgressBar ${number} ${_end}
done

make html > build.log 2>&1
printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m Step 3 of 4. Converting RST to PDF \n\e[0m\n"
for number in $(seq ${_40} ${_60})
do
	sleep 0.1
	ProgressBar ${number} ${_end}
done

make latexpdf --keep-going --silent > build.log 2>&1
sleep 10
cd build/latex
find . -type f ! -iname "*.pdf" -delete
cd ../../

printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;33m Step 4 of 4. Applying DATRO Blue Theme \n\e[0m\n"
for number in $(seq ${_60} ${_80})
do
	sleep 0.1
	ProgressBar ${number} ${_end}
done

sed -i 's/<\/head>/<style>html{overflow-y:scroll;} ::-webkit-scrollbar{width:0px;background:transparent;}<\/style><\/head>/g' build/html/*.html
sed -i 's/<div class="version">/<div class="version"> Document Version : /g' build/html/*.html
sed -i 's/#33368C/darkslateblue/g' build/html/_static/css/theme.css
sed -i 's/color:initial}/color:lightgrey;}/g' build/html/_static/css/theme.css
sed -i 's/#9b59b6/#29808A/g' build/html/_static/css/theme.css
sed -i 's/#4d4d4d/grey/g' build/html/_static/css/theme.css
sed -i 's/#4e4a4a/#333569/g' build/html/_static/css/theme.css
sed -i 's/#c9c9c9/#333653/g' build/html/_static/css/theme.css
sed -i 's/#d6d6d6/#333666/g' build/html/_static/css/theme.css
sed -i 's/#f3f6f6/#333666/g' build/html/_static/css/theme.css
sed -i 's/rgb(243, 246, 246)/#333666/g' build/html/_static/css/theme.css
sed -i 's/#e5ebeb/#333666/g' build/html/_static/css/theme.css
sed -i 's/#343131/#33365D/g' build/html/_static/css/theme.css
sed -i 's/#fcfcfc/-webkit-gradient(radial,50% 50%,450,50% 55%,60,from(#333650),to(#333666))/g' build/html/_static/css/theme.css
sed -i 's/#404040/lightgrey/g' build/html/_static/css/theme.css
sed -i 's/#edf0f2/-webkit-gradient(radial,50% 50%,450,50% 55%,60,from(#333650),to(#333666))/g' build/html/_static/css/theme.css
sed -i 's/rgba(0,0,0,.05)/#33365D/g' build/html/_static/css/theme.css
sed -i 's/#d9d9d9/initial/g' build/html/_static/css/theme.css
sed -i 's/#9B59B6/#a3a3a3/g' build/html/_static/css/theme.css
sed -i 's/body{/body{text-align:justify;/g' build/html/_static/css/theme.css
sed -i 's/.wy-nav-top{/.wy-nav-top{width:100vw!important;position:fixed!important;/g' build/html/_static/css/theme.css
sed -i 's/body{/body{scroll-padding-top: 70px!important;/g' build/html/_static/css/theme.css
sed -i 's/html{/html{scroll-padding-top: 70px!important;/g' build/html/_static/css/theme.css

printf "\e[2;3;33m Done! \n\e[0m"

printf "\n\e[2;3;32mBuild complete!\e[0m\n"

printf "\nProgress : [########################################] 100%%\n"