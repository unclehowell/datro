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
#            auto-rebuild.sh - v1.0
#................................................
#                  datro.xyz
#................................................


# update the rebuild and auto-rebuild source files.
bash ../../../_theme-docs/update.sh &&

# get the latest rebuild.sh file from source

rm -r rebuild.sh &&

cp -r ../../../_theme-docs/rebuild-master.sh rebuild.sh &&

# confirm permissions
chmod +x rebuild.sh &&

# run the rebuild
bash rebuild.sh
