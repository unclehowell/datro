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
#           Version 0.1 - gui.8cc.online
#................................................


printf "\n\n${RED}DATRO${NC} - Fetching Latest Copy of - Master (Creditors) Register \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=560998820&single=true&output=csv'  --location -o creditors-master-register.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Fetching Creditor Account - UID: 201 (J-Rushton):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=1570540549&single=true&output=csv'  --location -o creditor-account-201.csv
cut -d, -f 1-5 creditor-account-201.csv > temp-creditor-account-201.csv
mv temp-creditor-account-201.csv creditor-account-201.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Fetching Creditor Account - UID: 202 (M-Glover):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=942020585&single=true&output=csv'  --location -o creditor-account-202.csv
cut -d, -f 1-5 creditor-account-202.csv > temp-creditor-account-202.csv
mv temp-creditor-account-202.csv creditor-account-202.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Fetching Creditor Account - UID: 203 (S-Murphy):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=543001718&single=true&output=csv'  --location -o creditor-account-203.csv
cut -d, -f 1-5 creditor-account-203.csv > temp-creditor-account-203.csv
mv temp-creditor-account-203.csv creditor-account-203.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Fetching Creditor Account - UID: 204 (Family-Gill):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=242007966&single=true&output=csv'  --location -o creditor-account-204.csv
cut -d, -f 1-5 creditor-account-204.csv > temp-creditor-account-204.csv
mv temp-creditor-account-204.csv creditor-account-204.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Fetching Creditor Account - UID: 205 (D-Khan):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=1778654691&single=true&output=csv'  --location -o creditor-account-205.csv
cut -d, -f 1-5 creditor-account-205.csv > temp-creditor-account-205.csv
mv temp-creditor-account-205.csv creditor-account-205.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Fetching Creditor Account - UID: 206 (M-Kennedy):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=1415158108&single=true&output=csv'  --location -o creditor-account-206.csv
cut -d, -f 1-5 creditor-account-206.csv > temp-creditor-account-206.csv
mv temp-creditor-account-206.csv creditor-account-206.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Fetching Creditor Account - UID: 207 (R-Davis):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=1028416432&single=true&output=csv'  --location -o creditor-account-207.csv
cut -d, -f 1-5 creditor-account-207.csv > temp-creditor-account-207.csv
mv temp-creditor-account-207.csv creditor-account-207.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Fetching Creditor Account - UID: 208 (F-Van-Rienen):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=1392622496&single=true&output=csv'  --location -o creditor-account-208.csv
cut -d, -f 1-5 creditor-account-208.csv > temp-creditor-account-208.csv
mv temp-creditor-account-208.csv creditor-account-208.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Fetching Creditor Account - UID: 209 (K-E-Amos):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=226838030&single=true&output=csv'  --location -o creditor-account-209.csv
cut -d, -f 1-5 creditor-account-209.csv > temp-creditor-account-209.csv
mv temp-creditor-account-209.csv creditor-account-209.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Fetching Creditor Account - UID: 210 (Anonymous-1):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=1382780885&single=true&output=csv'  --location -o creditor-account-210.csv
cut -d, -f 1-5 creditor-account-210.csv > temp-creditor-account-210.csv
mv temp-creditor-account-210.csv creditor-account-210.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Fetching Creditor Account - UID: 211 (E-Coldwell):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=371901771&single=true&output=csv'  --location -o creditor-account-211.csv
cut -d, -f 1-5 creditor-account-211.csv > temp-creditor-account-211.csv
mv temp-creditor-account-211.csv creditor-account-211.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Fetching Creditor Account - UID: 212 (P-Caines):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=1673734209&single=true&output=csv'  --location -o creditor-account-212.csv
cut -d, -f 1-5 creditor-account-212.csv > temp-creditor-account-212.csv
mv temp-creditor-account-212.csv creditor-account-212.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Fetching Creditor Account - UID: 213 (A-Cronin):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=1217248800&single=true&output=csv'  --location -o creditor-account-213.csv
cut -d, -f 1-5 creditor-account-213.csv > temp-creditor-account-213.csv
mv temp-creditor-account-213.csv creditor-account-213.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Fetching Creditor Account - UID: 214 (A-Buckler):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=1363503703&single=true&output=csv'  --location -o creditor-account-214.csv
cut -d, -f 1-5 creditor-account-214.csv > temp-creditor-account-214.csv
mv temp-creditor-account-214.csv creditor-account-214.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Fetching Creditor Account - UID: 215 (G-Smith):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPvPc3dndOPG0JzXX81tSorsaQAGt5Y8_LIbhh76Ri5HBAWVkFrshW98lPhtN8iizS73YmSzqyfnHw/pub?gid=1224901281&single=true&output=csv'  --location -o creditor-account-215.csv
cut -d, -f 1-5 creditor-account-215.csv > temp-creditor-account-215.csv
mv temp-creditor-account-215.csv creditor-account-215.csv
cd ../../../
