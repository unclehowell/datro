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


printf "\n\n${RED}Wave®${NC} - Rebuilding Docs for organisation/memorandum-articles\n\n"
cp -r ../../shared-resources/wave-logo.png source/images/wave-logo.png
cp -r ../../shared-resources/ccu.png source/images/ccu.png
cp -r ../../shared-resources/scottishbay.png source/images/scottishbay.png
cp -r ../../shared-resources/uarsociety1.png source/images/uarsociety1.png
make clean
make html
printf "\n\n${RED}Wave®${NC} - Rebuilding PDF for organisation/memorandum-articles ...\n\n"
make latexpdf
printf "\n\n${RED}Wave®${NC} - Remove 'View Page Source' from html ...\n\n"
cd build
cd html
sed -i 's/ View page source/ /g' *.html
sed -i 's/<div class="version">/<div class="version"> Document Version : /g' *.html
printf "\n\n${RED}Wave®${NC} - Modifying RTD Theme to match Wave® ...\n\n"
cd _static/css
sed -i 's/#2980B9/#333366/g' theme.css
sed -i 's/#343131/#333366/g' theme.css
sed -i 's/rgba(0,0,0,0.05)/#333366/g' theme.css
cd ../../../../


