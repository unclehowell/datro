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
#custom-settings/config/files/root/etc/init.d to raspberrypi-ua-netinst/config/files/root/etc/init.d

sleep 25 &&
sudo printf "completing installation ..." &&
sudo cp -r /etc/wpa_supplicant/wpa_supplicant.conf /boot/ &&
sudo apt update -y &&
sudo apt install -y net-tools git git-svn subversion apache2 &&
sudo printf "Fetching the Hotspotβnβ Dashboard ..." &&
sudo sleep 2 &&
sudo printf "\n%s\n"  "Executing Main Method ..." &&
sudo mkdir -p /tmp/html/ &&
sudo svn co --depth infinity https://github.com/unclehowell/datro/trunk/static/gui/  \
                        /tmp/html/ &&
sleep 5 &&
sudo cp -r /tmp/html/* /var/www/html >&- 2>&- &&
sudo sleep 0.1 &&
sudo rm -r /tmp/html &&

sleep 5 &&
sudo chmod -R 755 /var/www/html &&

sudo apt -y install php php-common php-cli php-fpm php-json php-mysql php-zip php-gd php-mbstring php-curl php-xml php-pear php-bcmath libapache2-mod-php &&
sudo update-alternatives --config php &&
sudo systemctl restart apache2 &&

if [ ! -d "/var/www/html/" ]; then
    echo "Rebooting - Maybe an internet issue"
    sleep 10 &&
    reboot
else
    sed -i '114,$d' /home/pi/.bashrc >&- 2>&-
    echo "To proceed enter the following in your web-browser"
    echo "http://hotspotbnb/"
    echo "alternatively enter the following IP"
    hostname -I;
fi

exit 0