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

    if [ ! -d "/var/www/html/" ]; then
	    echo "Making absolutely sure there's internet before beginning Dashboard installation  ..." &&
            sleep 15 &&
            while ! ping -c1 8.8.8.8 &>/dev/null; do echo "Internet hasn't connected yet - waiting a few seconds"; done ; exit ; &&
            sleep 15 &&
            while ! ping -c1 8.8.8.8 &>/dev/null; do echo "Internet hasn't connected yet - troubleshooting ..."; done ; exit ; &&
            echo "wpa_cli -i wlan0 reconfigure" &&
            sudo wpa_cli -i wlan0 reconfigure &&
            echo "If IP obtained, it will show here ..." &&
            hostname -I; &&
            echo "systemctl reload daemon and dhcpcd" &&
            sudo systemctl daemon-reload &&
            sudo systemctl restart dhcpcd &&
            echo "If IP obtained, it will show here ..." &&
            hostname -I; &&
            # sudo dhclient -r wlan0 &&
            echo "ifdown & ifup"
            sudo ifdown eth0 &&
            sudo ifup eth0 &&
            sudo ifdown wlan0 &&
            sudo ifup wlan0 &&
            echo "If IP obtained, it will show here ..." &&
            hostname -I; &&
            echo "dhclient -v"
            sudo dhclient -v &&
            echo "If IP obtained, it will show here ..." &&
            hostname -I; &&
            echo "There should now absolutely be internet and the Dashboard build should have begun" &&
            sleep 5 &&
            systemctl -q is-active hbnbuild.service  && \
                    echo " yes, it's running in the background" exit 0 || \
                    echo " no - so there's no internet ? let's reboot and try again" &&
            # sudo dhclient -v wlan0 &&
    else
            sudo systemd stop hbnbuild.service &&
            sudo service stop hbnbuild.service &&
	    sudo systemctl stop hbnbuild.service &&
            sed -i '114,$d' /home/pi/.bashrc >&- 2>&-
	    sudo rm -r /home/pi/hbnbuild.sh &&
	    echo "To proceed enter this hostname or ip address in your web-browser"
	    echo "http://hotspotbnb/"
	    hostname -I; &&
    fi

echo "checking again to see if dashboard build service is running in the background (depends on active internet)"
systemctl -q is-active hbnbuild.service  && \
                    echo " yes, it's running in the background" exit 0 || \
                    echo " no - rebooting - unsure what went wrong" &&

sleep 1 &&
echo "the internet must be connected and script running in the background, but if for some reason either aren't and you're seeing this - then get to work - wpa_supplicant will copy to /boot to be safe then the system will reboot and try again"
sudo cp -r /etc/wpa_supplicant/wpa_supplicant.conf /boot/ &&
echo "one final final check this background service isn't running, just to be safe before restarting"
systemctl -q is-active hbnbuild.service  && \
                    echo " yes, it's running in the background" exit 0 || \
                    echo " no - rebooting - unsure what went wrong" && sudo reboot

exit 0
