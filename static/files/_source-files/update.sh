#!/usr/bin/env bash
#

unset CDPATH

#.......................................................
#                2020 Copyright unclehowell
#.......................................................
#    HotspotBnB Documentation - by Wave Telecom Limited
#.......................................................
#            docs.hotspotbnb.com - update.sh
#.......................................................
#
#                        version 0.4
#          view _source-files/README.md changelog
#
#........................................................


# CHANGELOG
# version 0.2 - disabled the progress bar - doesn't work out the box, has dependancies
lasttime=$(awk 'date -u -d "0 $FinalDate seconds - $StartDate seconds" +"%H%M%S"' ../../../_source-files/datetime.log 2> /dev/null)

timecalc=$(date -u -d "0 $FinalDate seconds - $StartDate seconds" +"%H%M%S") 2> /dev/null &

difference=$((timecalc - lasttime))

difference2=$(date -d@$difference -u +%M:%S) 2> /dev/null &

printf "\n\e[2;3;33m Source Files Update Requested ... \n\e[0m\n"

if [ $difference -ge 1800 ];

then

	printf "\n\e[2;3;33m Update in Progress \n\e[0m\n"

	curl https://raw.githubusercontent.com/unclehowell/gh-docs.hotspotbnb.com/master/docs/_source-files/rebuild-master.sh > ../../../_source-files/rebuild-master.sh
	curl https://raw.githubusercontent.com/unclehowell/gh-docs.hotspotbnb.com/master/docs/_source-files/auto-rebuild-master.sh > ../../../_source-files/auto-rebuild-master.sh
	curl https://raw.githubusercontent.com/unclehowell/gh-docs.hotspotbnb.com/master/docs/_source-files/README.md > ../../../_source-files/README.md

else

	printf "\n\e[2;3;33m Update skipped (updated a few moments ago) \n\e[0m\n"


fi

echo "$timecalc" > ../../../_source-files/datetime.log

printf "\e[2;3;33m Finished! \n\e[0m\n"
