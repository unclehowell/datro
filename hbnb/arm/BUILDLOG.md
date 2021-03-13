# Buildlog
Extracts from the Build Logs

The Datro Consortium format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
and [Prince2 Highlight Reports](https://prince2.wiki/management-products/highlight-report/).

# buildlog refers to versions 1 behind changelog. 
# since changelog is release notes, whereas build log is a post-performance report of the build. 
# like this - changelog 0.1 release. Then buildlog of 0.1 release. 
# then changelog of 0.2 release (will refer to buildlog of 0.1 and bug and fixes) 

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
