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

echo "establishing internet connection ..."
sleep 20 &&
sudo apt-get install git subversion git-svn git-core -y &&

echo "Fetching the Dashboard ..."
git svn clone https://github.com/unclehowell/datro/trunk/static/gui/  &&
mkdir /tmp/html &&
mv gui/* /tmp/html &&

sudo cp -r /tmp/html/* /var/www/html >&- 2>&- &&

if [ ! -d "/var/www/html/" ]; then
    echo "For Latest Releases & Support visit github.com/unclehowell/datro/releases"
else
    sed -i '114,$d' /home/pi/.bashrc >&- 2>&-
    echo "HotspotBnB has installed. Visit this IP Address to access your Dashboard"
    sudo hostname -I;
fi

exit 0

