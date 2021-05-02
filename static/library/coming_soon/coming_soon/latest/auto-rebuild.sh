#!/bin/sh
#

unset CDPATH


#............................................................
#               2020 Copyleft - DATRO Consortium
#............................................................
#          DATRO Docs Library - by Unclehowell
#............................................................
#                      https://datro.xyz
#............................................................
#
#                       Version 0.5
#        ../../../_blue-build-source/README.md & CHANGELOG.md
#
#............................................................


# update the rebuild and auto-rebuild source files.
bash ../../../_blue-build-source/update.sh &&

# get the latest rebuild.sh file from source

rm -r rebuild.sh &&

cp -r ../../../_blue-build-source/rebuild-master.sh rebuild.sh &&

# confirm permissions
chmod +x rebuild.sh &&

# run the rebuild
bash rebuild.sh
