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
#             Document Custom Script
#................................................
#             Version 0.8 - gui.8cc.online
#................................................

printf "\n\n${RED}DATRO${NC} - Backing up existing custom data \n\n"
cp -r source/_static/custom source/_static/custom-old

printf "\n\n${RED}DATRO${NC} - Getting Latest custom data e.g. fiscal \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=59761967&single=true&output=csv' --location -o wrt-master-register.csv
cut -d, -f 1-7 wrt-master-register.csv > temp-wrt-master-register.csv
mv temp-wrt-master-register.csv wrt-master-register.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 101 (B-Leonides):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=526590878&single=true&output=csv' --location -o wrt-wallet-101.csv
cut -d, -f 1-5 wrt-wallet-101.csv > temp-wrt-wallet-101.csv
mv temp-wrt-wallet-101.csv wrt-wallet-101.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 102 (M-Holmes):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1929422783&single=true&output=csv' --location -o wrt-wallet-102.csv
cut -d, -f 1-5 wrt-wallet-102.csv > temp-wrt-wallet-102.csv
mv temp-wrt-wallet-102.csv wrt-wallet-102.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 103 (R-James):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1208349470&single=true&output=csv' --location -o wrt-wallet-103.csv
cut -d, -f 1-5 wrt-wallet-103.csv > temp-wrt-wallet-103.csv
mv temp-wrt-wallet-103.csv wrt-wallet-103.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 104 (S-Barnes):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=754223038&single=true&output=csv' --location -o wrt-wallet-104.csv
cut -d, -f 1-5 wrt-wallet-104.csv > temp-wrt-wallet-104.csv
mv temp-wrt-wallet-104.csv wrt-wallet-104.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 105 (C-Gilder):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=392651235&single=true&output=csv' --location -o wrt-wallet-105.csv
cut -d, -f 1-5 wrt-wallet-105.csv > temp-wrt-wallet-105.csv
mv temp-wrt-wallet-105.csv wrt-wallet-105.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 106 (P-Beals):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1611613405&single=true&output=csv' --location -o wrt-wallet-106.csv
cut -d, -f 1-5 wrt-wallet-106.csv > temp-wrt-wallet-106.csv
mv temp-wrt-wallet-106.csv wrt-wallet-106.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 107 (P-Brown):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=833175105&single=true&output=csv' --location -o wrt-wallet-107.csv
cut -d, -f 1-5 wrt-wallet-107.csv > temp-wrt-wallet-107.csv
mv temp-wrt-wallet-107.csv wrt-wallet-107.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 108 (M-Hough):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=551101202&single=true&output=csv' --location -o wrt-wallet-108.csv
cut -d, -f 1-5 wrt-wallet-108.csv > temp-wrt-wallet-108.csv
mv temp-wrt-wallet-108.csv wrt-wallet-108.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 109 (A-Witcomb):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1974197814&single=true&output=csv' --location -o wrt-wallet-109.csv
cut -d, -f 1-5 wrt-wallet-109.csv > temp-wrt-wallet-109.csv
mv temp-wrt-wallet-109.csv wrt-wallet-109.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 110 (D-Owen):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1204592050&single=true&output=csv' --location -o wrt-wallet-110.csv
cut -d, -f 1-5 wrt-wallet-110.csv > temp-wrt-wallet-110.csv
mv temp-wrt-wallet-110.csv wrt-wallet-110.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 111 (J-Smith-Walker):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1179526919&single=true&output=csv' --location -o wrt-wallet-111.csv
cut -d, -f 1-5 wrt-wallet-111.csv > temp-wrt-wallet-111.csv
mv temp-wrt-wallet-111.csv wrt-wallet-111.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 112 (S-Gates):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1298844340&single=true&output=csv' --location -o wrt-wallet-112.csv
cut -d, -f 1-5 wrt-wallet-112.csv > temp-wrt-wallet-112.csv
mv temp-wrt-wallet-112.csv wrt-wallet-112.csv
cd ../../../



printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 113 (C-A-Doick):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1917232248&single=true&output=csv' --location -o wrt-wallet-113.csv
cut -d, -f 1-5 wrt-wallet-113.csv > temp-wrt-wallet-113.csv
mv temp-wrt-wallet-113.csv wrt-wallet-113.csv
cd ../../../



printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 114 (C-Kell):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=984522368&single=true&output=csv' --location -o wrt-wallet-114.csv
cut -d, -f 1-5 wrt-wallet-114.csv > temp-wrt-wallet-114.csv
mv temp-wrt-wallet-114.csv wrt-wallet-114.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 115 (S-Purcell):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=470656068&single=true&output=csv' --location -o wrt-wallet-115.csv
cut -d, -f 1-5 wrt-wallet-115.csv > temp-wrt-wallet-115.csv
mv temp-wrt-wallet-115.csv wrt-wallet-115.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 116 (C-Chapman):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=348065425&single=true&output=csv' --location -o wrt-wallet-116.csv
cut -d, -f 1-5 wrt-wallet-116.csv > temp-wrt-wallet-116.csv
mv temp-wrt-wallet-116.csv wrt-wallet-116.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 117 (T-Marshall):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=901904947&single=true&output=csv' --location -o wrt-wallet-117.csv
cut -d, -f 1-5 wrt-wallet-117.csv > temp-wrt-wallet-117.csv
mv temp-wrt-wallet-117.csv wrt-wallet-117.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 118 (C-Marshall):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1948377055&single=true&output=csv' --location -o wrt-wallet-118.csv
cut -d, -f 1-5 wrt-wallet-118.csv > temp-wrt-wallet-118.csv
mv temp-wrt-wallet-118.csv wrt-wallet-118.csv
cd ../../../



printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 119 (H-Davies):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1543150467&single=true&output=csv' --location -o wrt-wallet-119.csv
cut -d, -f 1-5 wrt-wallet-119.csv > temp-wrt-wallet-119.csv
mv temp-wrt-wallet-119.csv wrt-wallet-119.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 120 (M-Simpson):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1423594389&single=true&output=csv' --location -o wrt-wallet-120.csv
cut -d, -f 1-5 wrt-wallet-120.csv > temp-wrt-wallet-120.csv
mv temp-wrt-wallet-120.csv wrt-wallet-120.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 121 (S-Hume):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=404806964&single=true&output=csv' --location -o wrt-wallet-121.csv
cut -d, -f 1-5 wrt-wallet-121.csv > temp-wrt-wallet-121.csv
mv temp-wrt-wallet-121.csv wrt-wallet-121.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 122 (B-Pullen):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=9413960&single=true&output=csv' --location -o wrt-wallet-122.csv
cut -d, -f 1-5 wrt-wallet-122.csv > temp-wrt-wallet-122.csv
mv temp-wrt-wallet-122.csv wrt-wallet-122.csv
cd ../../../



printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 123 (G-Caines):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1571836956&single=true&output=csv' --location -o wrt-wallet-123.csv
cut -d, -f 1-5 wrt-wallet-123.csv > temp-wrt-wallet-123.csv
mv temp-wrt-wallet-123.csv wrt-wallet-123.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 124 (A-Powell):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=726288436&single=true&output=csv' --location -o wrt-wallet-124.csv
cut -d, -f 1-5 wrt-wallet-124.csv > temp-wrt-wallet-124.csv
mv temp-wrt-wallet-124.csv wrt-wallet-124.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 125 (M-Preston):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=180949020&single=true&output=csv' --location -o wrt-wallet-125.csv
cut -d, -f 1-5 wrt-wallet-125.csv > temp-wrt-wallet-125.csv
mv temp-wrt-wallet-125.csv wrt-wallet-125.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 126 (S-Chapman):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1038484044&single=true&output=csv' --location -o wrt-wallet-126.csv
cut -d, -f 1-5 wrt-wallet-126.csv > temp-wrt-wallet-126.csv
mv temp-wrt-wallet-126.csv wrt-wallet-126.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 127 (L-Wallace):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1030093537&single=true&output=csv' --location -o wrt-wallet-127.csv
cut -d, -f 1-5 wrt-wallet-127.csv > temp-wrt-wallet-127.csv
mv temp-wrt-wallet-127.csv wrt-wallet-127.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 128 (M-Boyd):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=876287370&single=true&output=csv' --location -o wrt-wallet-128.csv
cut -d, -f 1-5 wrt-wallet-128.csv > temp-wrt-wallet-128.csv
mv temp-wrt-wallet-128.csv wrt-wallet-128.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 129 (M-Gerard):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=89048672&single=true&output=csv' --location -o wrt-wallet-129.csv
cut -d, -f 1-5 wrt-wallet-129.csv > temp-wrt-wallet-129.csv
mv temp-wrt-wallet-129.csv wrt-wallet-129.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 130 (S-Hargreaves):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=126912421&single=true&output=csv' --location -o wrt-wallet-130.csv
cut -d, -f 1-5 wrt-wallet-130.csv > temp-wrt-wallet-130.csv
mv temp-wrt-wallet-130.csv wrt-wallet-130.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 131 (G-Stewart):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1342576304&single=true&output=csv' --location -o wrt-wallet-131.csv
cut -d, -f 1-5 wrt-wallet-131.csv > temp-wrt-wallet-131.csv
mv temp-wrt-wallet-131.csv wrt-wallet-131.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 132 (S-Reynolds):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1559893653&single=true&output=csv' --location -o wrt-wallet-132.csv
cut -d, -f 1-5 wrt-wallet-132.csv > temp-wrt-wallet-132.csv
mv temp-wrt-wallet-132.csv wrt-wallet-132.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 133 (D-Allen):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1961885102&single=true&output=csv' --location -o wrt-wallet-133.csv
cut -d, -f 1-5 wrt-wallet-133.csv > temp-wrt-wallet-133.csv
mv temp-wrt-wallet-133.csv wrt-wallet-133.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 134 (J-Davis):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=2125130478&single=true&output=csv' --location -o wrt-wallet-134.csv
cut -d, -f 1-5 wrt-wallet-134.csv > temp-wrt-wallet-134.csv
mv temp-wrt-wallet-134.csv wrt-wallet-134.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 135 (N-Smith):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1163236281&single=true&output=csv' --location -o wrt-wallet-135.csv
cut -d, -f 1-5 wrt-wallet-135.csv > temp-wrt-wallet-135.csv
mv temp-wrt-wallet-135.csv wrt-wallet-135.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 136 (D-Marshall):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=741055108&single=true&output=csv' --location -o wrt-wallet-136.csv
cut -d, -f 1-5 wrt-wallet-136.csv > temp-wrt-wallet-136.csv
mv temp-wrt-wallet-136.csv wrt-wallet-136.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 137 (A-Vashi):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1437096155&single=true&output=csv' --location -o wrt-wallet-137.csv
cut -d, -f 1-5 wrt-wallet-137.csv > temp-wrt-wallet-137.csv
mv temp-wrt-wallet-137.csv wrt-wallet-137.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 138 (C-Pitcairn):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1198929695&single=true&output=csv' --location -o wrt-wallet-138.csv
cut -d, -f 1-5 wrt-wallet-138.csv > temp-wrt-wallet-138.csv
mv temp-wrt-wallet-138.csv wrt-wallet-138.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 139 (H-Pitcairn):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=375202121&single=true&output=csv' --location -o wrt-wallet-139.csv
cut -d, -f 1-5 wrt-wallet-139.csv > temp-wrt-wallet-139.csv
mv temp-wrt-wallet-139.csv wrt-wallet-139.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 140 (L-Allen):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1521959301&single=true&output=csv' --location -o wrt-wallet-140.csv
cut -d, -f 1-5 wrt-wallet-140.csv > temp-wrt-wallet-140.csv
mv temp-wrt-wallet-140.csv wrt-wallet-140.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 141 (G-Pitcairn):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1630187220&single=true&output=csv' --location -o wrt-wallet-141.csv
cut -d, -f 1-5 wrt-wallet-141.csv > temp-wrt-wallet-141.csv
mv temp-wrt-wallet-141.csv wrt-wallet-141.csv
cd ../../../



printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 142 (P-Caines):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=783829861&single=true&output=csv' --location -o wrt-wallet-142.csv
cut -d, -f 1-5 wrt-wallet-142.csv > temp-wrt-wallet-142.csv
mv temp-wrt-wallet-142.csv wrt-wallet-142.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 143 (S-Buckler):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1212874175&single=true&output=csv' --location -o wrt-wallet-143.csv
cut -d, -f 1-5 wrt-wallet-143.csv > temp-wrt-wallet-143.csv
mv temp-wrt-wallet-143.csv wrt-wallet-143.csv
cd ../../../



printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 144 (E-Young):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1566195780&single=true&output=csv' --location -o wrt-wallet-144.csv
cut -d, -f 1-5 wrt-wallet-144.csv > temp-wrt-wallet-144.csv
mv temp-wrt-wallet-144.csv wrt-wallet-144.csv
cd ../../../



printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 145 (J-O-Sullivan):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=267444668&single=true&output=csv' --location -o wrt-wallet-145.csv
cut -d, -f 1-5 wrt-wallet-145.csv > temp-wrt-wallet-145.csv
mv temp-wrt-wallet-145.csv wrt-wallet-145.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 146 (Y-Sakowitz):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=558197429&single=true&output=csv' --location -o wrt-wallet-146.csv
cut -d, -f 1-5 wrt-wallet-146.csv > temp-wrt-wallet-146.csv
mv temp-wrt-wallet-146.csv wrt-wallet-146.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 147 (M-Weaver):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=2000709&single=true&output=csv' --location -o wrt-wallet-147.csv
cut -d, -f 1-5 wrt-wallet-147.csv > temp-wrt-wallet-147.csv
mv temp-wrt-wallet-147.csv wrt-wallet-147.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 148 (J-Choudhury-Lucas):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=989594610&single=true&output=csv' --location -o wrt-wallet-148.csv
cut -d, -f 1-5 wrt-wallet-148.csv > temp-wrt-wallet-148.csv
mv temp-wrt-wallet-148.csv wrt-wallet-148.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 149 (R-Stevenson):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=812710175&single=true&output=csv' --location -o wrt-wallet-149.csv
cut -d, -f 1-5 wrt-wallet-149.csv > temp-wrt-wallet-149.csv
mv temp-wrt-wallet-149.csv wrt-wallet-149.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 150 (B-Naipaul):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1968788933&single=true&output=csv' --location -o wrt-wallet-150.csv
cut -d, -f 1-5 wrt-wallet-150.csv > temp-wrt-wallet-150.csv
mv temp-wrt-wallet-150.csv wrt-wallet-150.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 151 (Anonymous-1):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1457970582&single=true&output=csv' --location -o wrt-wallet-151.csv
cut -d, -f 1-5 wrt-wallet-151.csv > temp-wrt-wallet-151.csv
mv temp-wrt-wallet-151.csv wrt-wallet-151.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 152 (Anonymous-2):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=780038456&single=true&output=csv' --location -o wrt-wallet-152.csv
cut -d, -f 1-5 wrt-wallet-152.csv > temp-wrt-wallet-152.csv
mv temp-wrt-wallet-152.csv wrt-wallet-152.csv
cd ../../../

printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 153 (Anonymous-3):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1311450348&single=true&output=csv' --location -o wrt-wallet-153.csv
cut -d, -f 1-5 wrt-wallet-153.csv > temp-wrt-wallet-153.csv
mv temp-wrt-wallet-153.csv wrt-wallet-153.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account - UID: 154 (M-Jaffe):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1311450348&single=true&output=csv' --location -o wrt-wallet-154.csv
cut -d, -f 1-5 wrt-wallet-154.csv > temp-wrt-wallet-154.csv
mv temp-wrt-wallet-154.csv wrt-wallet-154.csv
cd ../../../


printf "\n\n${RED}DATRO${NC} - Getting Account UID: 401 (Startup Investor(s)):  \n\n"
cd source/_static/custom
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfTard2Lcj4YBTwWDnVZmLSO_fNd___vP3_wQJm8vP6OzyXeE3cmi80A2Pxzt1eVO_B2J5KJKi4WDT/pub?gid=1714984400&single=true&output=csv' --location -o wrt-wallet-401.csv
cut -d, -f 1-5 wrt-wallet-401.csv > temp-wrt-wallet-401.csv
mv temp-wrt-wallet-401.csv wrt-wallet-401.csv
cd ../../../


