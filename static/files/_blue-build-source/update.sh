#!/usr/bin/env bash
#

unset CDPATH

#.......................................................
#         2020 DATRO Copyleft DATRO Consortium
#.......................................................
#         DATRO Documentation - by unclehowell
#.......................................................
#                   https://datro.xyz
#.......................................................
#
#                     version 0.5
#   ../../../_blue-build-source/README.md & CHANGELOG.md
#
#........................................................


lasttime=$(awk 'date -u -d "0 $FinalDate seconds - $StartDate seconds" +"%H%M%S"' ../../../_blue-build-source/datetime.log 2> /dev/null)

timecalc=$(date -u -d "0 $FinalDate seconds - $StartDate seconds" +"%H%M%S") 2> /dev/null &

difference=$((timecalc - lasttime))

difference2=$(date -d@$difference -u +%M:%S) 2> /dev/null &

printf "\n\e[2;3;33m Source Files Update Requested ... \n\e[0m\n"

if [ $difference -ge 1800 ];

then

	printf "\n\e[2;3;33m Update in Progress \n\e[0m\n"

	curl https://raw.githubusercontent.com/unclehowell/datro/gh-pages/static/files/_blue-build-source/rebuild-master.sh > ../../../_blue-build-source/rebuild-master.sh
	curl https://raw.githubusercontent.com/unclehowell/datro/gh-pages/static/files/_blue-build-source/auto-rebuild-master.sh > ../../../_blue-build-source/auto-rebuild-master.sh
	curl https://raw.githubusercontent.com/unclehowell/datro/gh-pages/static/files//_blue-build-source/README.md > ../../../_blue-build-source/README.md

else

	printf "\n\e[2;3;33m Update skipped (updated a few moments ago) \n\e[0m\n"


fi

echo "$timecalc" > ../../../_blue-build-source/datetime.log

printf "\e[2;3;33m Finished! \n\e[0m\n"
