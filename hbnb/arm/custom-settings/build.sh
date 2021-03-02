#!/bin/sh

### BEGIN INIT INFO
# Provides:          build.sh
# Required-Start:    $remote_fs
# Required-Stop:
# Should-Start:
# Default-Start:     2 3 4 5
# Default-Stop:
# X-Interactive:     true
# Short-Description: build hotspotbnb
### END INIT INFO

echo "checking internet connection ..."
sleep 15 &&
sudo apt-get install subversion -y &&

echo "Fetching the Dashboard ..."
sudo svn co https://github.com/unclehowell/datro/trunk/gh-pages/static/gui/  \
            /tmp/html

sudo cp -r /tmp/html/* /var/www/html >&- 2>&- &&

if [ ! -d "/var/www/html/" ]; then
    echo "For Latest Releases & Support visit github.com/unclehowell/datro/releases"
else
    sed -i '114,$d' /home/pi/.bashrc >&- 2>&-
    echo "HotspotBnB has installed. Visit this IP Address to access your Dashboard"
    sudo hostname -I;
fi

exit 0

