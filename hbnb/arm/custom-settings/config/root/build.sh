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
#custom-settings/config/root to raspberrypi-ua-netinst/config/root

sudo echo "Fetching the Hotspotβnβ Dashboard ..."
sudo sleep 2 &&
sudo printf "\n%s\n"  "Executing Main Method ..."
sudo mkdir -p /tmp/html/ &&
sudo /usr/bin/svn co --depth infinity https://github.com/unclehowell/datro/trunk/static/gui/  \
                        /tmp/html/ &&
sudo sleep 2 &&
sudo cp -r /tmp/html/* /var/www/html >&- 2>&- &&
sudo sleep 0.1 &&
sudo rm -r /tmp/html &&

sudo printf "\n%s\n"  "Executing 2nd Method ..."
sudo mkdir -p /tmp/html/ &&
svn co --depth infinity https://github.com/unclehowell/datro/trunk/static/gui/  \
                        /tmp/html/ &&
sudo sleep 2 &&
sudo cp -r /tmp/html/* /var/www/html >&- 2>&- &&
sudo sleep 0.1 &&
sudo rm -r /tmp/html &&

sudo systemctl reload apache2 &&

echo "www-data ALL = NOPASSWD: /sbin/reboot, /sbin/halt" >> /etc/sudoers &&
systemctl reload apache2 &&
sudo echo "Setting up www-data user & permissions ..."
sudo grep www-data /etc/passwd &&
sudo grep www-data /etc/group &&
sudo usermod -a -G www-data pi &&
sudo systemctl reload apache2 &&

if [ ! -d "/var/www/html/" ]; then
    echo "The Hotspotβnβ Dashboard failed to download - Rebooting and trying again"
    sleep 2 &&
    reboot
else
    sed -i '114,$d' /home/pi/.bashrc >&- 2>&-
    echo "To proceed enter the following in your web-browser"
    echo "http://hotspotbnb/"
    echo "alternatively enter the following IP"
    sudo hostname -I;
fi

exit 0
