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
#  github wiki .md > .rst  custom.sh  v0.0
#................................................
#                   gui.8cc.online
#................................................

# backup template files and delete potential debry from previous build
cd source
mkdir backup
mv *.py backup
mv releasenotes.rst backup
rm -r *.rst
rm -r *.csv
rm -r 3
rm -r index
rm -r *.txt
rm -r indexrst
rm -r tmp
mv backup/* ./
rm -r backup
cd ..


# generate new index.rst (top half at least)
cd source
touch index.rst
echo "Element\n============\n\n.. toctree::\n   :maxdepth: 2\n\n   releasenotes" >> index.rst
mkdir indexrst
mv index.rst indexrst
cd ..


# get latest .md files
cd source
mkdir tmp
# offline attempt
#cp -r /var/www/html/datro.wiki/*.md tmp
# online attempt
git clone https://github.com/vector-im/element-web.git &&
mv element-web/docs/*.md tmp
rm -r element-web

cd tmp


# remove emoji -causes  'make latexpdf' to stop 
grep -rl '🥳' ./ | xargs sed -i 's/🥳//g'

# change to rst using m2r so the formatting is resolved
m2r *.md
rm -r *.md

# change back to md (because what comes next is a bit of madness and its too late for me to figure it)
for f in *.rst; do 
	mv -- "$f" "${f%.rst}.md"
done

# beginneth the madness
for f in *.md; do mv "$f" "iiitem$f"; done

for f in *.md; do 
    mv -- "$f" "${f%.md}_foo.rst"
done

# housekeeping
mkdir ../index
touch ../index/index.txt
ls -1 >> ../index/index.txt
cp -r ../index/index.txt ./index2.txt

sed -i -e "s/_foo//g" ../index/index.txt

sed -i -e "s/^/iiitem/" index2.txt
sed -i -e "s/iiitemiiitem/iiitem/g" index2.txt
sed -i -e "s/_foo.rst//g" index2.txt
echo "\n" >> index2.txt

# append file name as file title 
while read -r iiitem; do
  file="${iiitem}_foo.rst"
  [[ ! -f "$file" ]] && continue # skip if file doesn't exist or if it is not a regular file
  printf '%s\n' 0a "$iiitem" . x | ex "$file"
done < index2.txt

## rm -r index2.txt

sleep 2 &&

cd tmp
for f in *_foo.rst; do 
    mv -- "$f" "${f%_foo.rst}.rst"
done

for i in *.rst
do
    mv "$i" "`echo $i | sed 's/iiitem//'`"
done

grep -rl 'iiitem' ./*.rst | xargs sed -i 's/iiitem//g'
sed -i '1 a \-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-' *.rst
grep -rl '\-|\-' ./ | xargs sed -i '1 s/\-|\-/ > /g'

# All files are now titled as sub-sub-sub-heading. 
# Next we perform what I call an "RST Russian Doll" 

# A. Generate blank sub-sub-heading rst files and title them accordingly, 


# then merge the corresponding sub-sub-sub-heading titles into them.
touch ../subsubsubheadings.txt
find . -maxdepth 1 -mindepth 1 -type f -name '*\-|-**\-|-**\-|-*' >> ../subsubsubheadings.txt

# B. Generate blank sub-heading rst files and title them accordingly,
# then merge the corresponding sub-sub-heading title into them. 

# C. Generate blank heading rst files and title them accordingly,
# then merge the corresponding sub-heading title into them.

echo "HEADERS, X" >> ../headers.csv
ls *.rst | cut -f1 -d- | sort -u | while read HEADERS
do
    echo $HEADERS, \"$(echo "$HEADERS"* | sed 's/ /,/g')\" >> ../headers.csv
done

# next 

cut -f1 -d ../headers.csv
grep -rl './img/' ./ | xargs sed -i 's|.\/img\/|.\/_static\/|g'
mv *.rst ../
sed -i -e 's/^/   /' ../index/index.txt
cd ..
cat index/index.txt >> indexrst/index.rst

 # generate bottom half of index.rst
 echo "\n\n\n**Document Publisher(s):**\n^^^^^^^^^^^^^^^^^^^^^^^^^\n\n\n\n=========================================\n**DATRO Consortium**\n=========================================\n" >> indexrst/index.rst

 # more housekeeping
grep -rl '.rst' ./indexrst | xargs sed -i 's/.rst//g'
grep -rl 'iiitem' ./indexrst | xargs sed -i 's/iiitem//g'
mv indexrst/index.rst ./
rm -r indexrst
rm -r tmp
rm -r index
rm -r headers.csv
cd ..

# That's all for now - still needs work BTW
