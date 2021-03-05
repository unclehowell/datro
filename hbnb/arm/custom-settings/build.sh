#!/bin/sh

### BEGIN INIT INFO
# Provides:          build.sh
# Required-Start:    $remote_fs
# Required-Stop:
# Should-Start:
# Default-Start:     2 3 4 5
# Default-Stop:
# X-Interactive:     true
# Short-Description: build HotspotBnB
### END INIT INFO

echo "Fetching the Hotspotβnβ Dashboard ..."
sleep 0.1 &&
printf "\n%s\n"  "Executing Main Method ..."
mkdir -p /tmp/html/ && /usr/bin/svn co --depth infinity https://github.com/unclehowell/datro/trunk/static/gui/  \
         /tmp/html/ && sleep 2 && sudo cp -r /tmp/html/* /var/www/html >&- 2>&- &&

sleep 0.1 &&
rm -r /tmp/html &&

printf "\n%s\n"  "Executing Contingency (beta) ..."
mkdir -p /tmp/html/ && svn co --depth infinity https://github.com/unclehowell/datro/trunk/static/gui/  \
         /tmp/html/ && sleep 2 && sudo cp -r /tmp/html/* /var/www/html >&- 2>&- &&

sleep 0.1 &&
rm -r /tmp/html &&

sudo chown www-data:www-data -R /var/www/html &&
sudo systemctl reload apache2 &&

if [ ! -d "/var/www/html/" ]; then
    echo "For Latest Releases & Support visit github.com/unclehowell/datro/releases"
else
    sed -i '114,$d' /home/pi/.bashrc >&- 2>&-
    echo "Enter Hotspotβnβ or the IP Address below into your Web-Browser"
    sudo hostname -I;
fi

exit 0
