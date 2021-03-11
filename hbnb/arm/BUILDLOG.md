# Buildlog
Extracts from the Build Logs

The Datro Consortium format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
and [Prince2 Highlight Reports](https://prince2.wiki/management-products/highlight-report/).

## [0.0.1-rc.9-hbnb-arm.03] - Q1/2021
#### ---------------------------------------
#### .buildlog/2021-03-10-0748.log (on RPI4)
#### ---------------------------------------
#### Line  # Details (+ = repeates)
    +1704    WARNING: apt does not have a stable CLI interface. Use with caution in scripts.
    +1711    /usr/bin/apt-key: 57: /usr/bin/apt-key: cannot create /dev/null: Permission denied
     1746    usage: update-rc.d [-f]
     ----    ----------------------------------------------------------------------------------
     1757:   Installation finished at Wed Mar 10 11:36:33 UTC 2021 and took 31 min 3 sec (1863 seconds)


## [0.0.1-rc.9-hbnb-arm.02] - Q1/2021
#### ---------------------------------------
#### .buildlog/2021-03-09-1637.log (on RPI4)
#### ---------------------------------------
#### Line  # Details (+ = repeates)
    +2018    cp: cannot stat '/rootfs/boot/raspberrypi-ua-netinst/config/files/root/home/pi/.bashrc': No such file or directory
    +2020    cp: cannot stat '/rootfs/boot/raspberrypi-ua-netinst/config/files/root/etc/init.d/build.sh': No such file or directory
    +2021    chmod: cannot access '/rootfs/etc/init.d/build.sh': No such file or directory
    +2022    chown: cannot access '/etc/init.d/build.sh': No such file or directory
    +2035    WARNING: apt does not have a stable CLI interface. Use with caution in scripts
     2042    /usr/bin/apt-key: 57: /usr/bin/apt-key: cannot create /dev/null: Permission denied


#### [0.0.1-rc.9-hbnb-arm.01] - Q1/2021
#### ---------------------------------------
#### .buildlog/2021-03-08-1910.log (on RPI4)
#### ---------------------------------------
#### Line  # Details (+ = repeates)
     1691    dos2unix: can't open '/rootfs/boot/raspberrypi-ua-netinst/config/files/my-files.list': No such file or directory
     1692    tail: can't open '/rootfs/boot/raspberrypi-ua-netinst/config/files/my-files.list': No such file or directory
     1693    tail: no files
     1694    grep: /rootfs/boot/raspberrypi-ua-netinst/config/files/my-files.list: No such file or directory
    +1697    WARNING: apt does not have a stable CLI interface. Use with caution in scripts.
    +1704    /usr/bin/apt-key: 57: /usr/bin/apt-key: cannot create /dev/null: Permission denied
     1739    chmod: cannot access '/etc/init.d/build.sh': No such file or directory
     1740    www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
     1741    www-data:x:33:
     1742    Running in chroot, ignoring request: reload
     1746    chroot: can't execute '/usr/bin/svn': No such file or directory


#### ---------------------------------------
#### .buildlog/2021-03-08-1604.log (on RPI4)
#### ---------------------------------------
#### Line  # Details (+ = repeates)
     0038    Set time using ntpdate... Failed to set time via ntpdate. Switched to rdate.
     1691    cp: cannot stat '/rootfs/boot/raspberrypi-ua-netinst/config/files/root/home/pi/.bashrc': No such file or directory
     1692    /etc/init.d/build.sh
     1693    cp: cannot stat '/rootfs/boot/raspberrypi-ua-netinst/config/files/root/etc/init.d/build.sh': No such file or directory
     1694    chmod: cannot access '/rootfs/etc/init.d/build.sh': No such file or directory
     1695    chown: cannot access '/etc/init.d/build.sh': No such file or directory
    +1700    WARNING: apt does not have a stable CLI interface. Use with caution in scripts.
     1706    /usr/bin/apt-key: 57: /usr/bin/apt-key: cannot create /dev/null: Permission denied
     1707    Err:2 http://raspbian.raspberrypi.org/raspbian buster InRelease
     1708    Temporary failure resolving 'raspbian.raspberrypi.org'
     1713    W: Failed to fetch http://raspbian.raspberrypi.org/raspbian/dists/buster/InRelease  Temporary failure resolving 'raspbian.raspberrypi.org'
     1714    W: Some index files failed to download. They have been ignored, or old ones used instead.
     3571    chmod: cannot access '/etc/init.d/build.sh': No such file or directory
     3572    www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
     3573    www-data:x:33:
     3574    Running in chroot, ignoring request: reload
     3575    Fetching the HotspotÎ²nÎ² Dashboard ...
     3577    Executing Main Method ...
     3578    chroot: can't execute '/usr/bin/svn': No such file or directory

