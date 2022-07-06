#!/bin/sh
#
unset CDPATH

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
#             Document Custom Script
#................................................
#             Version 0.9 - datro.xyz
#................................................

printf "\n\n${RED}DATRO${NC} - Backing up existing custom data \n\n"
rm -r source/_static/custom-old
mkdir source/_static/custom-old
cd source/_static/custom/
cp *.csv ../custom-old
cd ../../../
rm -r source/_static/custom
mkdir source/_static/custom


printf "\n\n${RED}DATRO${NC} - Getting Summary \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQO6i6p7ea7rVR0e7kmaldu4h8kW4rq0DG0KK39-IVfiLw9-wbp2iD60qm_Eo3s70t5hxGeBNL5U2KJ/pubhtml?gid=819698973&single=true' --location -o highlight-summary.csv 
cut -d, -f 2-8 highlight-summary.csv > t-highlight-summary.csv
mv t-highlight-summary.csv highlight-summary.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Week 08 Plan \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQO6i6p7ea7rVR0e7kmaldu4h8kW4rq0DG0KK39-IVfiLw9-wbp2iD60qm_Eo3s70t5hxGeBNL5U2KJ/pub?gid=606604785&single=true&output=csv' --location -o 2022-w08-plan.csv
cut -d, -f 5 2022-w08-plan.csv > temp-2022-w08-plan.csv
mv temp-2022-w08-plan.csv 2022-w08-plan.csv
cd ../../../

