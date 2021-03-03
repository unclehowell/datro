#!/bin/sh

### BEGIN INIT INFO
# Provides:          build.sh
# Required-Start:    $remote_fs
# Required-Stop:
# Should-Start:
# Default-Start:     2 3 4 5
# Default-Stop:
# X-Interactive:     true
# Short-Description: build Hotspotβnβ
### END INIT INFO

sudo apt-get install git subversion git-svn -y &&

echo "Fetching the Hotspotβnβ Dashboard ..."
sleep 0.1 &&
printf "\n%s\n"  "Trying Main Method ..."
mkdir -p /tmp/main/ && git svn clone https://github.com/unclehowell/datro/trunk/static/gui/  \
         /tmp/main/ && sleep 2 && sudo cp -r /tmp/main/* /var/www/html >&- 2>&- &&

printf "\n%s\n"  "Trying Fallback Method ..."
mkdir -p /tmp/fallback/ && svn co https://github.com/unclehowell/datro/trunk/static/gui/  \
         /tmp/fallback/ && sleep 2 && sudo cp -r /tmp/fallback/* /var/www/html >&- 2>&- &&

printf "\n%s\n"  "Trying Fallback2 Method ..."
mkdir -p /tmp/fallback2/ && sudo /usr/bin/svn co https://github.com/unclehowell/datro/trunk/static/gui/  \
         /tmp/fallback2/ && sleep 2 && sudo cp -r /tmp/fallback2/* /var/www/html >&- 2>&- &

if [ ! -d "/var/www/html/" ]; then
    echo "For Latest Releases & Support visit github.com/unclehowell/datro/releases"
else
    sed -i '114,$d' /home/pi/.bashrc >&- 2>&-
    echo "Enter Hotspotβnβ or the IP Address below into your Web-Browser"
    sudo hostname -I;
fi

exit 0
