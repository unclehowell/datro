#!/bin/sh
#
unset CDPATH

#.................................................
#           Wave® - 2018 Copyright
#.................................................
#      __          __    ___   __   __ ___ ®
#    /\  \   ___ /\  \ /' _'\/\  \/  /'__`\
#    \ \  \ /   \ /  \/\ \_\ \ \  \ /\  __/
#     \ \____/\ \____/\ \_\ \_\ \__/\ \____\
#      \/___/  \/___/  \/_/\/_/\/_/  \/____/
#
#................................................
#    Wave Documentation  -  Wave Telecom Limited
#................................................
#             https://wave.hotspotbnb.com
#................................................

  
printf "\n\n${RED}Wave®${NC} - Getting Latest Copy of - WIT Master Register \n\n"
cd source/_static/wit-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=560998820&single=true&output=csv' -o wit-master-register.csv
cd ../../../


printf "\n\n${RED}Wave®${NC} - Getting WIT Wallet - UID: 201 (J-Rushton):  \n\n"
cd source/_static/wit-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=1570540549&single=true&output=csv' -o wit-wallet-201.csv
cut -d, -f 1-5 wit-wallet-201.csv > temp-wit-wallet-201.csv
mv temp-wit-wallet-201.csv wit-wallet-201.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIT Wallet - UID: 202 (M-Glover):  \n\n"
cd source/_static/wit-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=942020585&single=true&output=csv' -o wit-wallet-202.csv
cut -d, -f 1-5 wit-wallet-202.csv > temp-wit-wallet-202.csv
mv temp-wit-wallet-202.csv wit-wallet-202.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIT Wallet - UID: 203 (S-Murphy):  \n\n"
cd source/_static/wit-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=543001718&single=true&output=csv' -o wit-wallet-203.csv
cut -d, -f 1-5 wit-wallet-203.csv > temp-wit-wallet-203.csv
mv temp-wit-wallet-203.csv wit-wallet-203.csv
cd ../../../


printf "\n\n${RED}Wave®${NC} - Getting WIT Wallet - UID: 204 (Family-Gill):  \n\n"
cd source/_static/wit-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=242007966&single=true&output=csv' -o wit-wallet-204.csv
cut -d, -f 1-5 wit-wallet-204.csv > temp-wit-wallet-204.csv
mv temp-wit-wallet-204.csv wit-wallet-204.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIT Wallet - UID: 205 (D-Khan):  \n\n"
cd source/_static/wit-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=1778654691&single=true&output=csv' -o wit-wallet-205.csv
cut -d, -f 1-5 wit-wallet-205.csv > temp-wit-wallet-205.csv
mv temp-wit-wallet-205.csv wit-wallet-205.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIT Wallet - UID: 206 (M-Kennedy):  \n\n"
cd source/_static/wit-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=1415158108&single=true&output=csv' -o wit-wallet-206.csv
cut -d, -f 1-5 wit-wallet-206.csv > temp-wit-wallet-206.csv
mv temp-wit-wallet-206.csv wit-wallet-206.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIT Wallet - UID: 207 (R-Davis):  \n\n"
cd source/_static/wit-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=1028416432&single=true&output=csv' -o wit-wallet-207.csv
cut -d, -f 1-5 wit-wallet-207.csv > temp-wit-wallet-207.csv
mv temp-wit-wallet-207.csv wit-wallet-207.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIT Wallet - UID: 208 (F-Van-Rienen):  \n\n"
cd source/_static/wit-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=1392622496&single=true&output=csv' -o wit-wallet-208.csv
cut -d, -f 1-5 wit-wallet-208.csv > temp-wit-wallet-208.csv
mv temp-wit-wallet-208.csv wit-wallet-208.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIT Wallet - UID: 209 (K-E-Amos):  \n\n"
cd source/_static/wit-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=226838030&single=true&output=csv' -o wit-wallet-209.csv
cut -d, -f 1-5 wit-wallet-209.csv > temp-wit-wallet-209.csv
mv temp-wit-wallet-209.csv wit-wallet-209.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIT Wallet - UID: 210 (Anonymous-1):  \n\n"
cd source/_static/wit-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=1382780885&single=true&output=csv' -o wit-wallet-210.csv
cut -d, -f 1-5 wit-wallet-210.csv > temp-wit-wallet-210.csv
mv temp-wit-wallet-210.csv wit-wallet-210.csv
cd ../../../


