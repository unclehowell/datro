#!/bin/sh
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
#    Document custom.sh script  (creditors)
#................................................
#           Version 0.1 - datro.xyz
#................................................


printf "\n\n${RED}DATRO${NC} - Fetching Master Record (Tech House II) Register \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=560998820&single=true&output=csv'  --location -o master-register.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Fetching Statement - UID: 901 (Lease Agreement):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=1570540549&single=true&output=csv'  --location -o lease-901.csv
cut -d, -f 1-5 tech-lease.csv > temp-lease-901.csv
mv temp-lease-901.csv lease-901.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Fetching Statement - UID: 902 (Electric):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=942020585&single=true&output=csv'  --location -o tech-house-902.csv
cut -d, -f 1-5 tech-house-902.csv > temp-tech-house-902.csv
mv temp-tech-house-902.csv tech-house-902.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Fetching Statement - UID: 903 (Gas):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=543001718&single=true&output=csv'  --location -o tech-house-903.csv
cut -d, -f 1-5 tech-house-903.csv > temp-tech-house-903.csv
mv temp-tech-house-903.csv tech-house-903.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Fetching Statement - UID: 904 (Technology):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=242007966&single=true&output=csv'  --location -o tech-house-904.csv
cut -d, -f 1-5 tech-house-904.csv > temp-tech-house-904.csv
mv temp-tech-house-904.csv tech-house-904.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Fetching Statement - UID: 906 (Kitchen):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=1224901281&single=true&output=csv'  --location -o tech-house-905.csv
cut -d, -f 1-5 tech-house-915.csv > temp-tech-house-915.csv
mv temp-tech-house-915.csv tech-house-915.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Fetching Statement - UID: 907 (Upkeep):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=1224901281&single=true&output=csv'  --location -o tech-house-906.csv
cut -d, -f 1-5 tech-house-915.csv > temp-tech-house-915.csv
mv temp-tech-house-915.csv tech-house-915.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Fetching Statement - UID: 907 (Repairs):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=1224901281&single=true&output=csv'  --location -o tech-house-907.csv
cut -d, -f 1-5 tech-house-915.csv > temp-tech-house-915.csv
mv temp-tech-house-915.csv tech-house-915.csv
cd ../../../

