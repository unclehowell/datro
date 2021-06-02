#!/bin/bash

### rebuild sitemap.xml (ensures all filepaths to .html files are included, subject to .options file)
cd ../sitemap/
bash make-sitemap.sh
cd ../analytics

### get a list of urls from sitemap
cat ../../../sitemap.xml | grep -Eo "(http|https)://[a-zA-Z0-9./?=_%:-]*" | sort -u > urls.txt

### remove sitemaps.org url
sed -i 's+http://www.sitemaps.org/schemas/sitemap/0.9++g' urls.txt

### duplicate the file
cp -r urls.txt urls2.txt
cp -r urls.txt urls0.txt
cp -r urls.txt urls3.txt
cp -r urls.txt urlsx.txt

### change urls2.txt file extensions from .html to .htm
### now the beginning and end of urls is https and .html
### and the beginning and end of urls2 is hxtps and .htmx
### this makes it easier for the next step
sed -i 's+https+hxtps+g' urls2.txt
sed -i 's+\.html+\.htm+g' urls2.txt
sed -i 's+https+hxtps+g' urls3.txt

### clears bug where / becomes .htm/ in some places
#sed -i 's+\.html/+/+g' urls2.txt
#sed -i 's+\.htm /+/+g' ./urls2.txt # rem0ves /html/ from some filepaths

{ echo " > " ; } >>html.txt

cp -r html.txt htmlx.txt
 
paste -d + urls.txt html.txt urls2.txt > urllist.txt
paste -d + urlsx.txt htmlx.txt urls3.txt > urllistx.txt

rm -r htmlx.txt
rm -r urlsx.txt

### tidy a little
sed -i "s/+ > +/ > /g" urllist.txt
sed -i "s/++/ /g" urllist.txt
sed -i "s/.html hxtps/.html > hxtps/g" urllist.txt
sed -i "s/+ > +/ > /g" urllistx.txt
sed -i "s/++/ /g" urllistx.txt
sed -i "s/.html hxtps/.html > hxtps/g" urllistx.txt
sed -n '/^$/d' urllist.txt 
sed -n '/^$/d' urllistx.txt
 
### make urllist2.txt - f0r later
cp -r urllist.txt urllist2.txt
cp -r urllist.txt urllist0.txt

sed -i "s/.html > hxtps/.htm > hxtps/g" urllist.txt
sed -i "s/.html > hxtps/.htm > hxtps/g" urllistx.txt
### add to start of each line in urllist.txt - removes everything BETWEEN g00gle tag line and </head>
sed -i -e "s/^/sed '+googletagmanager.com+,+<\/head>+{\/\/!d}' /g" urllist.txt
sed -i -e "s/^/sed '+googletagmanager.com+,+<\/head>+{\/\/!d}' /g" urllistx.txt
### put backspace in c0mmand 0r else it w0nt run
sed -i 's/</<\\/g' urllist.txt
sed -i 's/</<\\/g' urllistx.txt

### make file paths make sense from current subdirectory befre running scrit
sed -i 's+https://datro.xyz+ ../../..+g' urllist.txt
sed -i 's+hxtps://datro.xyz+> ../../..+g' urllist.txt
sed -i "s/> >/>/g" urllist.txt
sed -i 's+https://datro.xyz+ ../../..+g' urllistx.txt
sed -i 's+hxtps://datro.xyz+> ../../..+g' urllistx.txt
sed -i "s/> >/>/g" urllistx.txt

### an0ther clean
sed -i '1 i\ ' urllist.txt
sed -i '1 i\ ' urllistx.txt

### tidy s0me m0re
sed -i 's/+/\//g' urllist.txt
sed -i "s/#/\\\/g" urllist.txt
sed -i '$ d' urllist.txt
sed -i 's/+/\//g' urllistx.txt
sed -i "s/#/\\\/g" urllistx.txt
# blank line at line 1 - rem0ve it
sed -i -e "1d" urllistx.txt

################################# make urllist2.txt ################################


# rem0ves the line c0ntaining the string
sed -i -e "s/^/sed -n '+googletagmanager.com+!p' /g" urllist2.txt

### make file paths make sense from current subdirectory befre running scrit
sed -i 's+https://datro.xyz+ ../../..+g' urllist2.txt
sed -i 's+hxtps://datro.xyz+> ../../..+g' urllist2.txt
sed -i "s/> >/>/g" urllist2.txt

### an0ther clean
sed -i '1 i\ ' urllist2.txt

### tidy s0me m0re
sed -i 's/+/\//g' urllist2.txt
sed -i "s/#/\\\/g" urllist2.txt
sed -i '$ d' urllist2.txt


# blank line at line 1 - rem0ve it
sed -i -e "1d" urllist2.txt


### h0usekeeping
rm -r urls.txt
rm -r html.txt
rm -r urls2.txt
rm -r urls3.txt

################# make urllistzero.txt ########################

sed -i 's+https+hztps+g' urls0.txt
sed -i 's+\.html+\.htmzz+g' urls0.txt
sed -i 's+hztps://datro.xyz+ ../../..+g' urls0.txt
sed -i "s/> >/ /g" urls0.txt

### make file paths make sense from current subdirectory befre running script
sed -i 's+https://datro.xyz+ ../../..+g' urllist0.txt
sed -i 's+hxtps://datro.xyz+> ../../..+g' urllist0.txt
sed -i "s/> >/>/g" urllist0.txt

paste -d + urls0.txt urllist0.txt > urllistzero.txt

### tidy u
sed -i 's/\.htmzz+/\.html/g' urllistzero.txt 
sed -i '$ d' urllistzero.txt

### add c0de t0 start 0f every line - rem0ves first line of analytics script e.g. the <script> tag
sed -i -e "s|^|awk \'\NR==FNR\{\if (\/googletagmanager.com\/) del\[\NR-1\]; next\}\ \!\\(\FNR in del\)\\'\ |g" urllistzero.txt

rm -r urls0.txt
rm -r urllist0.txt

############################################################

### merge lists - reveses 0rder in 0utc0me e.g. 1,0,2 = 3(2,0,1) 
paste -d $'\n' urllistzero.txt urllistx.txt urllist2.txt > urllist3.txt


## URLLISTZER0 = deletes line abve googletagmanager.com
## URLLISTX = delets betweeen string and </head> 
## URLLIST2 = deletes line itself
  
### h0usekeeping
rm -r urllist.txt
rm -r urllistx.txt
rm -r urllist2.txt
rm -r urllistzero.txt

### make it bash and set it t0 execute

sed -i '1 i\#!\/bin\/bash' urllist3.txt
mv urllist3.txt unrunit.sh
sudo chmod +x unrunit.sh

### final clean

sed -i '$ d'  unrunit.sh
sed -i '$ d'  unrunit.sh
sed -i '$ d'  unrunit.sh
echo "undo.sh has prepaired and will now execute - errors will be listed next (if there are any)"
sudo bash ./unrunit.sh
rm -r ./unrunit.sh

sleep 1
echo "next all traces of this script in each direcotry will be rem0ved"
find ../../../ -depth -name "*.htm" -exec sh -c 'mv "$1" "${1%.htm}.html"' _ {} \;
echo "This script will end with a log.txt 0f all urls still c0ntaining traces 0f analytics"
sleep 1
timeout 20s grep -r "googletagmanager.com" ../../ > grr \
& sleep 20; kill %1

sed -i '/\/monoreapo\/analytics/d' grr 

md5sum /etc/mtab > "$(date +"%Y_%m_%d_%I_%M_%p").log"
mv grr ./*.log
mv ./*.log ./.logs

echo "Finished (see .logs/)" 
exit 0
exit 1
