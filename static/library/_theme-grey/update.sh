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
#     Document update.sh Script (grey theme)
#................................................
#            Version 0.8 - datro.xyz
#................................................

lasttime=$(awk 'date -u -d "0 $FinalDate seconds - $StartDate seconds" +"%H%M%S"' ../../../_theme-grey/datetime.log 2> /dev/null)

timecalc=$(date -u -d "0 $FinalDate seconds - $StartDate seconds" +"%H%M%S") 2> /dev/null &

difference=$((timecalc - lasttime))

difference2=$(date -d@$difference -u +%M:%S) 2> /dev/null &

printf "\n\e[2;3;33m Source Files Update Requested ... \n\e[0m\n"

if [ $difference -ge 1800 ];

then

	printf "\n\e[2;3;33m Update in Progress \n\e[0m\n"

	curl https://raw.githubusercontent.com/unclehowell/datro/gh-pages/static/library/_theme-grey/rebuild-master.sh > ../../../_theme-grey/rebuild-master.sh
	curl https://raw.githubusercontent.com/unclehowell/datro/gh-pages/static/library/_theme-grey/auto-rebuild-master.sh > ../../../_theme-grey/auto-rebuild-master.sh
	curl https://raw.githubusercontent.com/unclehowell/datro/gh-pages/static/library//_theme-grey/README.md > ../../../_theme-grey/README.md

else

	printf "\n\e[2;3;33m Update skipped (updated a few moments ago) \n\e[0m\n"


fi

echo "$timecalc" > ../../../_theme-grey/datetime.log

printf "\e[2;3;33m Finished! \n\e[0m\n"
