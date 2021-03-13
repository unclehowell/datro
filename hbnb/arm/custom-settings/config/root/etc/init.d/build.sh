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
sudo echo "v0.0.1-rc.9-hbnb-arm.0.8 BUILD ..." &&
sleep 25 &&
printf "%s" "pinging 8.8.8.8 to be sure ..."
while ! timeout 0.2 ping -c 1 -n 8.8.8.8 &> /dev/null
do
    printf "%c" "."
done
printf "\n%s\n"  "ping success. proceeding ..." &&

sudo apt install -y net-tools git git-svn subversion apache2 &&

sudo echo "Fetching the Hotspotβnβ Dashboard ..." &&
sudo sleep 2 &&
sudo printf "\n%s\n"  "Executing Main Method ..." &&
sudo mkdir -p /tmp/html/ &&
svn co --depth infinity https://github.com/unclehowell/datro/trunk/static/gui/  \
                        /tmp/html/ &&
sleep 5 &&
sudo cp -r /tmp/html/* /var/www/html >&- 2>&- &&
sudo sleep 0.1 &&
sudo rm -r /tmp/html &&

sleep 5 &&
sudo systemctl restart apache2 &&

echo "www-data ALL = NOPASSWD: /sbin/reboot, /sbin/halt" >> /etc/sudoers &&
sudo systemctl restart apache2 &&
sudo echo "Setting up www-data user & permissions ..."
sudo grep www-data /etc/passwd &&
sudo grep www-data /etc/group &&
sudo useradd -g www-data -s /usr/sbin/nologin -m -d /home/www-data www-data &&
sudo usermod -a -G www-data pi &&
sudo systemctl restart apache2 &&

if [ ! -d "/var/www/html/" ]; then
    echo "The Hotspotβnβ Dashboard failed to download - Rebooting and trying again"
    sleep 2 &&
    reboot
else
    sed -i '114,$d' /home/pi/.bashrc >&- 2>&-
    echo "To proceed enter the following in your web-browser"
    echo "http://hotspotbnb/"
    echo "alternatively enter the following IP" 
    hostname -I;
fi

exit 0
