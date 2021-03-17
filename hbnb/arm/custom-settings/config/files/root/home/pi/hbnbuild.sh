#!/bin/sh
### BEGIN INIT INFO
# Provides:          hbnbuild.sh
# Required-Start:    $remote_fs
# Required-Stop:
# Should-Start:
# Default-Start:     2 3 4 5
# Default-Stop:
# X-Interactive:     true
# Short-Description: build HotspotBnB
### END INIT INFO
#custom-settings/config/files/root/home/pi to raspberrypi-ua-netinst/config/files/root/home/pi

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
sudo lighttpd-enable-mod fastcgi-php &&
sudo service lighttpd force-reload &&
sudo systemctl restart lighttpd.service &&

# Optimize configuration of php-cgi.
function _optimize_php() {
    if [ "$upgrade" == 0 ]; then
        _install_log "Optimize PHP configuration"
        if [ ! -f "$phpcgiconf" ]; then
            _install_warning "PHP configuration could not be found."
            return
        fi

sleep 5 &&

if [ ! -d "/var/www/html/" ]; then
    echo "Rebooting - Maybe an internet issue"
    sleep 10 &&
    reboot
else
    echo "Dashboard appeared to have installed - visit the IP below for a quick check before the final reboot"
    hostname -I;
fi
sleep 30 &&
sudo reboot & reboot
exit 0
