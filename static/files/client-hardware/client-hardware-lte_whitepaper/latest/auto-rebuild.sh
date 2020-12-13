#!/bin/sh
#

unset CDPATH


#............................................................
#           HotspotBnB - 2020 Copyright
#............................................................
#    HotspotBnB Documentation - by  Wave Telecom Limited
#............................................................
#            docs.hotspotbnb.com - auto-update.sh
#............................................................
#
#                         version 0.4
#            view _blue-build-source/README.md changelog
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
