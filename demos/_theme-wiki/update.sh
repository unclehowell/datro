#!/usr/bin/env bash
#

unset CDPATH

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
#         _theme-wiki update.sh script
#................................................
#            Version 0.0 - datro.xyz
#................................................

lasttime=$(awk 'date -u -d "0 $FinalDate seconds - $StartDate seconds" +"%H%M%S"' ../../../_theme-wiki/datetime.log 2> /dev/null)

timecalc=$(date -u -d "0 $FinalDate seconds - $StartDate seconds" +"%H%M%S") 2> /dev/null &

difference=$((timecalc - lasttime))

difference2=$(date -d@$difference -u +%M:%S) 2> /dev/null &

printf "\n\e[2;3;33m Source Files Update Requested ... \n\e[0m\n"

if [ $difference -ge 1800 ];

then

	printf "\n\e[2;3;33m Update in Progress \n\e[0m\n"

	curl https://raw.githubusercontent.com/unclehowell/datro/gh-pages/static/library/_theme-wiki/rebuild-master.sh > ../../../_theme-wiki/rebuild-master.sh
	curl https://raw.githubusercontent.com/unclehowell/datro/gh-pages/static/library/_theme-wiki/README.md > ../../../_theme-wiki/README.md
        curl https://raw.githubusercontent.com/unclehowell/datro/gh-pages/static/library/_theme-wiki/blue.sh > ../../../_theme-wiki/blue.sh
        curl https://raw.githubusercontent.com/unclehowell/datro/gh-pages/static/library/_theme-wiki/grey.sh > ../../../_theme-wiki/grey.sh

else

	printf "\n\e[2;3;33m Update skipped (updated a few moments ago) \n\e[0m\n"


fi

echo "$timecalc" > ../../../_theme-wiki/datetime.log

printf "\e[2;3;33m Finished! \n\e[0m\n"
