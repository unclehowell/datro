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
# Document auto-rebuild.sh Script (grey theme)
#................................................
#            Version 0.8 - datro.xyz
#................................................

# update the rebuild and auto-rebuild source files.
bash ../../../_theme-grey/update.sh &&

# get the latest rebuild.sh file from source

rm -r rebuild.sh &&

cp -r ../../../_theme-grey/rebuild-master.sh rebuild.sh &&

# confirm permissions
chmod +x rebuild.sh &&

# run the rebuild
bash rebuild.sh
