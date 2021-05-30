# Buildlog
Extracts from the Build Logs

The Datro Consortium format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
and [Prince2 Highlight Reports](https://prince2.wiki/management-products/highlight-report/).

## [0.0.1-rc.9-hbnb-arm.12] - Q1/2021
#### ---------------------------------------
#### .buildlog/2021-03-15-0000.log (on RPI4)
#### ---------------------------------------
15-Mar - Failed to establish internet on reboot


## [0.0.1-rc.9-hbnb-arm.11] - Q1/2021
#### ---------------------------------------
#### .buildlog/2021-03-14-1800.log (on RPI4)
#### ---------------------------------------
#### Line  # Details (+ = repeates)
     1662    update-rc.d: error: unable to read /etc/init.d//etc/init.d/build.sh

## [0.0.1-rc.9-hbnb-arm.10] - Q1/2021
#### ---------------------------------------
#### .buildlog/2021-03-14-4444.log (on RPI4)
#### ---------------------------------------
#### Line  # Details (+ = repeates)
     1649    chroot: can't execute 'export': No such file or directory
     1654    chroot: can't execute 'cd': No such file or directory

*build.sh threw out a load of errors worth mentioning because they prevent the build completing:
       - ping. just ran on and on
       - /etc/sudoers permissions error 
       - `svn` and even `sudo /usr/bin/svn` failed. 
       
*post-installer.txt complaind about using the echo command.


## [0.0.1-rc.9-hbnb-arm.09] - Q1/2021
#### ---------------------------------------
#### N/A (on RPI4)
#### ---------------------------------------
*build.sh ping error. also wrote over the SD card before grabbing the log (slapped wrist)


## [0.0.1-rc.9-hbnb-arm.08] - Q1/2021
#### ---------------------------------------
#### .buildlog/2021-03-13-1800.log (on RPI4)
#### ---------------------------------------
#### Line  # Details (+ = repeates)
     1662    update-rc.d: error: unable to read /etc/init.d//etc/init.d/build.sh
     1667    Installation finished at Sat Mar 13 16:05:27 UTC 2021 and took 40 min 5 sec (2405 seconds)

* says on screen: 

/etc/init.d/build.sh: 20: /etc/init.d/build.sh: svn: not found
sudo: /usr/bin/svn: command not found
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
www-data:x:33:
Failed to reload apache2.service: Unit apache2.service not found.

## [0.0.1-rc.9-hbnb-arm.07] - Q1/2021
#### ---------------------------------------
#### .buildlog/2021-03-13-0909.log (on RPI4)
#### ---------------------------------------
#### Line  # Details (+ = repeates)
     +249    E: Couldn't download 
     +251    ERROR: 1, trying again
    +2018    cp: cannot stat '/rootfs/boot/raspberrypi-ua-netinst/config/files/root/home/pi/.bashrc': No such file or directory
    +2020    cp: cannot stat '/rootfs/boot/raspberrypi-ua-netinst/config/files/root/etc/init.d/build.sh': No such file or directory
    +2021    chmod: cannot access '/rootfs/etc/init.d/build.sh': No such file or directory
    +2022    chown: cannot access '/etc/init.d/build.sh': No such file or directory
     1811    update-rc.d: error: unable to read /etc/init.d//etc/init.d/build.sh

## [0.0.1-rc.9-hbnb-arm.06] - Q1/2021
#### ---------------------------------------
#### .buildlog/2021-03-13-0500.log (on RPI4)
#### ---------------------------------------
#### Line  # Details (+ = repeates)
     1653   Please choose which locales to generate  [not an error, but user prompts cannot be allowed to exist in a fully autonomous build]
    +1700   Adding files & folders listed in ... my-files.list [not an error, but remove from post-install to eliminate repeating the task]
     1706   WARNING: apt does not have a stable CLI [solved this already, why is it back ?] 
     1927   dpkg-preconfigure: unable to re-open stdin: No such file or directory

## [0.0.1-rc.9-hbnb-arm.05] - Q1/2021
#### ---------------------------------------
#### .buildlog/2021-03-12-2255.log (on RPI4)
#### ---------------------------------------
#### Line  # Details (+ = repeates)
     1904   Setting up ssl-cert (1.0.39) ...
     1905   hostname: Name or service not known
     1906   make-ssl-cert: Could not get FQDN, using "(none)".
     1907   make-ssl-cert: You may want to fix your /etc/hosts and/or DNS setup and run
     1908   make-ssl-cert: make-ssl-cert generate-default-snakeoil --force-overwrite
     1909   make-ssl-cert: again.
     ----   ------------------------------------------------------------------------------
            Froze a few times then rebooted and skipped to post-install, which failed bacause some packages didn't install

## [0.0.1-rc.9-hbnb-arm.04] - Q1/2021
#### ---------------------------------------
#### .buildlog/2021-03-11-2350.log (on RPI4)
#### ---------------------------------------
#### Line  # Details (+ = repeates)
    +1696    cp: cannot stat '/rootfs/boot/raspberrypi-ua-netinst/config/files/root/home/pi/.bashrc': No such file or directory
    +1698    cp: cannot stat '/rootfs/boot/raspberrypi-ua-netinst/config/files/root/etc/init.d/build.sh': No such file or directory
    +1699    chmod: cannot access '/rootfs/etc/init.d/build.sh': No such file or directory
    +1700    chown: cannot access '/etc/init.d/build.sh': No such file or directory
     1818    dpkg-preconfigure: unable to re-open stdin: No such file or directory