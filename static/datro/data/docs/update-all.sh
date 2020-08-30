#!/bin/sh
#

unset CDPATH

#.................................................
#           Wave® - 2018 Copyright
#.................................................
#      __          __    ___   __   __ ___ ®
#    /\  \   ___ /\  \ /' _'\/\  \/  /'__`\
#    \ \  \ /   \ /  \/\ \_\ \ \  \ /\  __/
#     \ \____/\ \____/\ \_\ \_\ \__/\ \____\
#      \/___/  \/___/  \/_/\/_/\/_/  \/____/
#
#................................................
#    Wave Documentation  -  Wave Telecom Limited
#................................................
#             https://datro.xyz
#................................................

# STEP 1 - UNHASH THE DOCUMENT(S) YOU WISH TO BE UPDATED IN THIS LIST BELOW: 
# STEP 2 - SAVE THE CHANGES AND RUN THIS SCRIPT FILE: sudo sh update-all.sh
# THE SCRIPT WILL REBUILD THE PDF DOCUMENT AND REPUBLISH THE HTML VERSION
# STEP 3 - BE MINDFUL OF OTHER DEVELOPERS. PUT THE FILE BACK AS YOU FOUND IT!  

cd organisation/google-patent-purchase/
sh rebuild.sh
cd ../../

cd organisation/finances/
sh rebuild.sh
cd ../../

cd organisation/whitepaper/
sh rebuild.sh
cd ../../

cd organisation/privacy/
sh rebuild.sh
cd ../../

cd organisation/copyright/
sh rebuild.sh
cd ../../

cd organisation/terms/
sh  rebuild.sh
cd ../../

cd organisation/webmaster/
sh  rebuild.sh
cd ../../

cd organisation/memorandum-articles/
sh  rebuild.sh
cd ../../

cd products/4g/
sh  rebuild.sh
cd ../../

cd products/warranty/
sh  rebuild.sh
cd ../../

cd software/dev_guide/
sh  rebuild.sh
cd ../../

cd software/distributors/
sh  rebuild.sh 
cd ../../

cd software/wave_os/
sh  rebuild.sh 
cd ../../

cd tokens/wrt/
sh  rebuild.sh 
cd ../../

cd tokens/win/
sh  rebuild.sh 
cd ../../

cd tokens/wit/
sh  rebuild.sh 
cd ../../



