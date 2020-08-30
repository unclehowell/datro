#!/bin/sh
#

unset CDPATH


#.................................................
#           LaS - 2018 Copyright
#.................................................
#      __          __    ___   __   __ ___ 
#    /\  \   ___ /\  \ /' _'\/\  \/  /'__`\
#    \ \  \ /   \ /  \/\ \_\ \ \  \ /\  __/
#     \ \____/\ \____/\ \_\ \_\ \__/\ \____\
#      \/___/  \/___/  \/_/\/_/\/_/  \/____/
#
#................................................
#    LaS Documentation  -  Wave Telecom Limited
#................................................
#             https://makeitLaS.com
#................................................


printf "\n\n${RED}LaS${NC} - Rebuilding Docs for projects/loyversandscrcpy\n\n"
make clean
make html
printf "\n\n${RED}LaS${NC} - Rebuilding PDF for prjects/loyverseandscrcpy ...\n\n"
make latexpdf
printf "\n\n${RED}LaS${NC} - Remove 'View Page Source' from html ...\n\n"
cd build
cd html
sed -i 's/ View page source/ /g' *.html
sed -i 's/<div class="version">/<div class="version"> Document Version : /g' *.html
printf "\n\n${RED}LaS${NC} - Modifying RTD Theme to match Wave Website Theme ...\n\n"
cd _static/css
sed -i 's/#2980B9/#333366/g' theme.css
sed -i 's/#343131/#333366/g' theme.css
sed -i 's/rgba(0,0,0,0.05)/#333366/g' theme.css
cd ../../../../


