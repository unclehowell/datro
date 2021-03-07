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

echo "Setting up www-data user & permissions ..."

grep www-data /etc/passwd &&
grep www-data /etc/group &&
usermod -a -G www-data pi &&
echo "www-data ALL = NOPASSWD: /sbin/reboot, /sbin/halt" >> /etc/sudoers &&
systemctl reload apache2 &&

echo "Fetching the Hotspotβnβ Dashboard ..."
sleep 2 &&
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

# work in progress to change php.ini, which has a variable filepath since php version may vary

#sudo apt-get install mlocate -y &&
#sudo updatedb &&
#sudo mlocate apache2/php.ini > /tmp/phpurl &&
#sed -i 's/disable_functions/#disable_functions/g' dirname /tmp/phpurl/php.ini &&

sudo systemctl reload apache2

if [ ! -d "/var/www/html/" ]; then
    echo "Read the Docs - Visit https://datro.world"
else
    sed -i '114,$d' /home/pi/.bashrc >&- 2>&-
    echo "To proceed enter the following in your web-browser"
    echo "http://hotspotbnb/"
    echo "alternatively enter the following IP"
    sudo hostname -I;
fi

exit 0
