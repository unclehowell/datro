#!/bin/bash

# rebuild sitemap.xml (ensures all filepaths to .html files are included, subject to .options file)
bash ../sitemap/make-sitemap.sh &

# get a list of urls from sitemap
cat ../../../sitemap.xml | grep -Eo "(http|https)://[a-zA-Z0-9./?=_%:-]*" | sort -u > urls.txt

# remove one unwanted
sed -i 's+http://www.sitemaps.org/schemas/sitemap/0.9++g' urls.txt

# make file paths make sense from current subdirectory
sed -i 's+https://datro.xyz/+../../../+g' urls.txt

# duplicate the file
cp -r urls.txt urls2.txt

# change urls2.txt file extensions from .html to .htm
sed -i 's+.html+.htm+g' urls2.txt
sed -i 's+https+xhttps+g' urls2.txt

# now the beginning and end urls is https and .html
# and the beginning and end of urls2 is xhttps and .htm
# this makes it easier for the next step

# merge the two urls and remove origonals
paste -d + urls.txt urls2.txt > urlfile.txt
rm -r urls.txt urls2.txt

# append code (first half of code to inject analytics) before each url

sed "sed 's+<\head>+e cat analytics.txt'+"


# append code (second half of code to inject analytics) after each url

# append code after urls

# turn url into script

# run script
