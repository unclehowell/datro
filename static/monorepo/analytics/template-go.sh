# test
cp -r ../../../index.html ./TARGETHTML.html

# insert analytics code
sed '/<\/head>/e cat analytics.txt' ./TARGETHTML.html > ./TARGETHTML.htm

# remove origion html files

# change all extensions from .htm back to .html 

find ./ -depth -name "*.htm" -exec sh -c 'mv "$1" "${1%.htm}.html"' _ {} \;
