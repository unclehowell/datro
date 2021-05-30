#!/bin/bash

# rebuild sitemap.xml (ensures all filepaths to .html files are included, subject to .options file)
cd ../sitemap/
bash make-sitemap.sh
cd ../analytics

# get a list of urls from sitemap
cat ../../../sitemap.xml | grep -Eo "(http|https)://[a-zA-Z0-9./?=_%:-]*" | sort -u > urls.txt

# remove sitemaps.org url
sed -i 's+http://www.sitemaps.org/schemas/sitemap/0.9++g' urls.txt

# duplicate the file
cp -r urls.txt urls2.txt

# change urls2.txt file extensions from .html to .htm
# now the beginning and end of urls is https and .html
# and the beginning and end of urls2 is hxtps and .htmx
# this makes it easier for the next step
sed -i 's+https+hxtps+g' urls2.txt
sed -i 's+.html+.htm+g' urls2.txt 
sed -i 's+.html/+/+g' urls2.txt 
sed -i 's+.htm/+/+g' ./urls2.txt

{ echo " > " ; } >>html.txt

paste -d + urls.txt html.txt urls2.txt > urllist.txt

# tidy a little
sed -i "s/+ > +/ > /g" urllist.txt
sed -i "s/++/ /g" urllist.txt
sed -i "s/.html hxtps/.html > hxtps/g" urllist.txt

# append this script
### delete everything between these tw
######  <script async src="https://www.googletagmanager.com/gtag/js?id=G-6BTNPTMXBF"></script>
######  </head>
###### e.g. sed '/<tag>/,/<\/tag>/d' input.txt

#to start of each line in urllist.txt

#sed -i -e "s/^/sed '+<\/head>+e cat analytics.txt'/g" urllist.txt

sed -i -e "s/^/sed '+\script async src=\"https:\/\/www.googletag\+,+<\/head>+{\/\/!d}' /g" urllist.txt


##### 
#0UTUT
######
# sed '+<tag>+,+</tag>+d'sed '+</head>+e cat analytics.txt'

# 0ther meth0d
# sed -i -e 'sed s|||g'


#tidy s0me m0re
## sed -i 's/+/\//g' urllist.txt
## sed -i 's+^\(.\{7\}\)+\1#+' urllist.txt
## sed -i "s/#/\\\/g" urllist.txt


## sed -i '$ d' urllist.txt


#h0usekeeping
rm -r urls.txt
rm -r html.txt
rm -r urls2.txt

# make file paths make sense from current subdirectory befre running scrit
## sed -i 's+https://datro.xyz+ ../../..+g' urllist.txt
## sed -i 's+hxtps://datro.xyz+> ../../..+g' urllist.txt
## sed -i "s/> >/>/g" urllist.txt


## sed -i '1 i\ ' urllist.txt
## sed -i '1 i\#!\/bin\/bash' urllist.txt

## mv urllist.txt unrunit.sh
## sudo chmod +x unrunit.sh

## sudo bash ./unrunit.sh

## find ../../../ -depth -name "*.htm" -exec sh -c 'mv "$1" "${1%.htm}.html"' _ {} \;


## echo "Run this script again manually to eliminated traces of analytics:"
## grep -r "googletagmanager.com" ../../
