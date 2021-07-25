#!/usr/bin/env bash
#

#unset CDPATH


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
#           wiki   custom.sh  v0.0
#................................................
#                   datro.xyz
#................................................

# backup template files and delete wiki data
cd source
mkdir backup
mv *.py backup
mv releasenotes.rst backup
rm -r *.rst
mv backup/* ../
rm -r backup

# generate new index.rst
touch index.rst
echo {
DATRO Wiki
===========


.. toctree::
   :maxdepth: 2


   releasenotes


} >> index.rst
cd ..


# get latest .md files
cd source
mkdir tmp
git clone https://github.com/unclehowell/datro.wiki.git
mv datro.wiki/*.md tmp
rm -r datro.wiki
cd ..


# change source files from .md to .rst
cd source/tmp
for f in *.md; do 
    mv -- "$f" "${f%.md}.rst"
done
cd ../..

cd source/tmp
ls -1 >> index.txt
# remove .rst extensions in index.rst
grep -rl '.rst' index.txt | xargs sed -i 's/.rst//g'
# add spaces at beginning of all lines
sed -i -e 's/^/   /' index.txt
echo index.txt >> ../../index.rst
cd ../../
