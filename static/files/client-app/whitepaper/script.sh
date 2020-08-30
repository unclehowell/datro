#!/bin/sh
#

cp -r /build/html/_sources/* ../../../ &&

for i in *.txt
do
   mv -- "$i" "${i%.txt}"
done
