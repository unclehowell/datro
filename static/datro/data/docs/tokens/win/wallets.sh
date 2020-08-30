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
#             https://datro.xyz
#................................................


printf "\n\n${RED}Wave®${NC} - Getting Latest Copy of - WIN Master Register \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=560998820&single=true&output=csv' -o win-master-register.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 301 (Anonymous-2):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=1570540549&single=true&output=csv' -o win-wallet-301.csv
cut -d, -f 1-5 win-wallet-301.csv > temp-win-wallet-301.csv
mv temp-win-wallet-301.csv win-wallet-301.csv
cd ../../../


printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 302 (M-Holmes):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=738728882&single=true&output=csv' -o win-wallet-302.csv
cut -d, -f 1-5 win-wallet-302.csv > temp-win-wallet-302.csv
mv temp-win-wallet-302.csv win-wallet-302.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 303 (R-James):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=1684460803&single=true&output=csv' -o win-wallet-303.csv
cut -d, -f 1-5 win-wallet-303.csv > temp-win-wallet-303.csv
mv temp-win-wallet-303.csv win-wallet-303.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 304 (S-Barnes):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=497790755&single=true&output=csv' -o win-wallet-304.csv
cut -d, -f 1-5 win-wallet-304.csv > temp-win-wallet-304.csv
mv temp-win-wallet-304.csv win-wallet-304.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 305 (P-Beals):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=137797216&single=true&output=csv' -o win-wallet-305.csv
cut -d, -f 1-5 win-wallet-305.csv > temp-win-wallet-305.csv
mv temp-win-wallet-305.csv win-wallet-305.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 306 (J-Smith-Walker):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=1395858795&single=true&output=csv' -o win-wallet-306.csv
cut -d, -f 1-5 win-wallet-306.csv > temp-win-wallet-306.csv
mv temp-win-wallet-306.csv win-wallet-306.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 307 (C-A-Doick):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=236412873&single=true&output=csv' -o win-wallet-307.csv
cut -d, -f 1-5 win-wallet-307.csv > temp-win-wallet-307.csv
mv temp-win-wallet-307.csv win-wallet-307.csv
cd ../../../


printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 308 (C-Kell):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=883975226&single=true&output=csv' -o win-wallet-308.csv
cut -d, -f 1-5 win-wallet-308.csv > temp-win-wallet-308.csv
mv temp-win-wallet-308.csv win-wallet-308.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 309 (S-Purcell):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=233733604&single=true&output=csv' -o win-wallet-309.csv
cut -d, -f 1-5 win-wallet-309.csv > temp-win-wallet-309.csv
mv temp-win-wallet-309.csv win-wallet-309.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 310 (C-Chapman):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=752046705&single=true&output=csv' -o win-wallet-310.csv
cut -d, -f 1-5 win-wallet-310.csv > temp-win-wallet-310.csv
mv temp-win-wallet-310.csv win-wallet-310.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 311 (T-Marshall):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=1036029950&single=true&output=csv' -o win-wallet-311.csv
cut -d, -f 1-5 win-wallet-311.csv > temp-win-wallet-311.csv
mv temp-win-wallet-311.csv win-wallet-311.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 312 (C-Marshall):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=1515047443&single=true&output=csv' -o win-wallet-312.csv
cut -d, -f 1-5 win-wallet-312.csv > temp-win-wallet-312.csv
mv temp-win-wallet-312.csv win-wallet-312.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 313 (S-Hume):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=1125955103&single=true&output=csv' -o win-wallet-313.csv
cut -d, -f 1-5 win-wallet-313.csv > temp-win-wallet-313.csv
mv temp-win-wallet-313.csv win-wallet-313.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 314 (B-Pullen):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=535213243&single=true&output=csv' -o win-wallet-314.csv
cut -d, -f 1-5 win-wallet-314.csv > temp-win-wallet-314.csv
mv temp-win-wallet-314.csv win-wallet-314.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 315 (G-Caines):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=1161391574&single=true&output=csv' -o win-wallet-315.csv
cut -d, -f 1-5 win-wallet-315.csv > temp-win-wallet-315.csv
mv temp-win-wallet-315.csv win-wallet-315.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 316 (A-Powell):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=1587114698&single=true&output=csv' -o win-wallet-316.csv
cut -d, -f 1-5 win-wallet-316.csv > temp-win-wallet-316.csv
mv temp-win-wallet-316.csv win-wallet-316.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 317 (S-Chapman):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=1148174852&single=true&output=csv' -o win-wallet-317.csv
cut -d, -f 1-5 win-wallet-317.csv > temp-win-wallet-317.csv
mv temp-win-wallet-317.csv win-wallet-317.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 318 (M-Boyd):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=164337012&single=true&output=csv' -o win-wallet-318.csv
cut -d, -f 1-5 win-wallet-318.csv > temp-win-wallet-318.csv
mv temp-win-wallet-318.csv win-wallet-318.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 319 (M-Gerard):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=644566616&single=true&output=csv' -o win-wallet-319.csv
cut -d, -f 1-5 win-wallet-319.csv > temp-win-wallet-319.csv
mv temp-win-wallet-319.csv win-wallet-319.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 320 (J-Davis):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=189275084&single=true&output=csv' -o win-wallet-320.csv
cut -d, -f 1-5 win-wallet-320.csv > temp-win-wallet-320.csv
mv temp-win-wallet-320.csv win-wallet-320.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 321 (D-Marshall):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=1642505940&single=true&output=csv' -o win-wallet-321.csv
cut -d, -f 1-5 win-wallet-321.csv > temp-win-wallet-321.csv
mv temp-win-wallet-321.csv win-wallet-321.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 322 (A-Vashi):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=731161887&single=true&output=csv' -o win-wallet-322.csv
cut -d, -f 1-5 win-wallet-322.csv > temp-win-wallet-322.csv
mv temp-win-wallet-322.csv win-wallet-322.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 323 (H-Pitcairn):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=1395251508&single=true&output=csv' -o win-wallet-323.csv
cut -d, -f 1-5 win-wallet-323.csv > temp-win-wallet-323.csv
mv temp-win-wallet-323.csv win-wallet-323.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 324 (L-Allen):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=1288833212&single=true&output=csv' -o win-wallet-324.csv
cut -d, -f 1-5 win-wallet-324.csv > temp-win-wallet-324.csv
mv temp-win-wallet-324.csv win-wallet-324.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 325 (P-Caines):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=796447315&single=true&output=csv' -o win-wallet-325.csv
cut -d, -f 1-5 win-wallet-325.csv > temp-win-wallet-325.csv
mv temp-win-wallet-325.csv win-wallet-325.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 326 (J-Choudhury-Lucas):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=309200946&single=true&output=csv' -o win-wallet-326.csv
cut -d, -f 1-5 win-wallet-326.csv > temp-win-wallet-326.csv
mv temp-win-wallet-326.csv win-wallet-326.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 327 (Coldwell):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=1344846665&single=true&output=csv' -o win-wallet-327.csv
cut -d, -f 1-5 win-wallet-327.csv > temp-win-wallet-327.csv
mv temp-win-wallet-327.csv win-wallet-327.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 328 (J-Rushton):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=666061957&single=true&output=csv' -o win-wallet-328.csv
cut -d, -f 1-5 win-wallet-328.csv > temp-win-wallet-328.csv
mv temp-win-wallet-328.csv win-wallet-328.csv
cd ../../../


printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 329 (M-Glover):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=309605134&single=true&output=csv' -o win-wallet-329.csv
cut -d, -f 1-5 win-wallet-329.csv > temp-win-wallet-329.csv
mv temp-win-wallet-329.csv win-wallet-329.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 330 (S-Murphy):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=515663787&single=true&output=csv' -o win-wallet-330.csv
cut -d, -f 1-5 win-wallet-330.csv > temp-win-wallet-330.csv
mv temp-win-wallet-330.csv win-wallet-330.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 331 (F-Gill):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=422529074&single=true&output=csv' -o win-wallet-331.csv
cut -d, -f 1-5 win-wallet-331.csv > temp-win-wallet-331.csv
mv temp-win-wallet-331.csv win-wallet-331.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 332 (D-Khan):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=947146838&single=true&output=csv' -o win-wallet-332.csv
cut -d, -f 1-5 win-wallet-332.csv > temp-win-wallet-332.csv
mv temp-win-wallet-332.csv win-wallet-332.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 333 (M-Kennedy):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=1924358194&single=true&output=csv' -o win-wallet-333.csv
cut -d, -f 1-5 win-wallet-333.csv > temp-win-wallet-333.csv
mv temp-win-wallet-333.csv win-wallet-333.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 334 (R-Davis):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=1702304530&single=true&output=csv' -o win-wallet-334.csv
cut -d, -f 1-5 win-wallet-334.csv > temp-win-wallet-334.csv
mv temp-win-wallet-334.csv win-wallet-334.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 335 (F-VanRienen):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=384240121&single=true&output=csv' -o win-wallet-335.csv
cut -d, -f 1-5 win-wallet-335.csv > temp-win-wallet-335.csv
mv temp-win-wallet-335.csv win-wallet-335.csv
cd ../../../

printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 336 (K-E-Amos):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=874847923&single=true&output=csv' -o win-wallet-336.csv
cut -d, -f 1-5 win-wallet-336.csv > temp-win-wallet-336.csv
mv temp-win-wallet-336.csv win-wallet-336.csv
cd ../../../


printf "\n\n${RED}Wave®${NC} - Getting WIN Wallet - UID: 336 (Anonymous-1):  \n\n"
cd source/_static/win-coin
curl -f 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYIYq02QR1wFKGezAb57Air3CWksLzOcNZkxoCRXA6mmw5nKGs0TQRc3k40C6gxdpkaUrenvmnyiSx/pub?gid=1237622579&single=true&output=csv' -o win-wallet-337.csv
cut -d, -f 1-5 win-wallet-337.csv > temp-win-wallet-337.csv
mv temp-win-wallet-337.csv win-wallet-337.csv
cd ../../../

