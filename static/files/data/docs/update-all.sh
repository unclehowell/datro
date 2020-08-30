#!/bin/sh
#

unset CDPATH




# STEP 1 - UNHASH THE DOCUMENT(S) YOU WISH TO BE UPDATED IN THIS LIST BELOW:
# STEP 2 - SAVE THE CHANGES AND RUN THIS SCRIPT FILE: sudo sh update-all.sh
# STEP 3 - PUT THE HASH(S) BACK WHEN DONE. SO THE FILE IS AS YOU FOUND IT!


cd client-app/          && sh update-all.sh && cd ../

cd client-os/           && sh update-all.sh && cd ../ # app-store and default apps will be part of os

cd client-hardware/     && sh update-all.sh && cd ../


cd service-www/         && sh update-all.sh && cd ../ # status will merge with www (listing & leasing)

cd service-accounts/    && sh update-all.sh && cd ../

cd service-ads/         && sh update-all.sh && cd ../

cd service-mine/        && sh update-all.sh && cd ../

cd service-exchange/    && sh update-all.sh && cd ../

cd service-algo/        && sh update-all.sh && cd ../


cd web-store/           && sh update-all.sh && cd ../ # app-store will merge with store

cd web-docscms/         && sh update-all.sh && cd ../ # removing the dash between docs and cms

cd web-foundation/      && sh update-all.sh && cd ../

cd web-defence/         && sh update-all.sh && cd ../
