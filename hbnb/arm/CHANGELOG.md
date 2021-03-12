# Changelog
Developers are expected to log all changes to this directory to this changelog.

The Datro Consortium format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
and [Prince2 Highlight Reports](https://prince2.wiki/management-products/highlight-report/).

## [Unreleased]

## [0.0.1-rc.9-hbnb-arm.04] - Q1/2021
10-Mar - 2021-03-11-0111.log - changes to custom-settings files caused missing /home/pi/.bashrc and /etc/init.d/build.sh. 
         -- confident these are now fixed (changes in compile.bash). These changes should make the next build work 100%. 
11-Mar   -- error "cannot create /dev/null: Permission denied" is an annoyance. added the following code into post-install:
            `rm /dev/null && mknod /dev/null c 1 3 && chmod 666 /dev/null`

### Removed
10-Mar - adding country=XX to installer-config.txt caused it to appear twice in wpa_supplicant.conf (removed from post-install.txt to fix it)

## [0.0.1-rc.9-hbnb-arm.03] - Q1/2021
10-Mar - 2021-03-10-0748.log (on RPI4) net-instal success - Installation took 31 minutes (2 or 3 warnings/ alerts (no real errors).
         -- autologin and build.sh failed - so no dashboard - must explore
         -- the earlier experiment helped. `compile.bash` will be trimmed down to use minimal files/folders in hbnb.arm.04 (but custom-settings will remain untouched for the meanwhile)

### Added
10-Mar - put `#wlan_country=RD` in the installer-config.txt's in custom-settings because syslog showed p2/3 errors and defaulted to US.

### Changed 
10-Mar - used build data to determine which custom-settings files to hash out (eventually remove) from compile.bash - hbnb-arm.04 compiled ok
10-Mar - made some changes to post-install.txt (all of them in custom-settings) to try to get init.d/build.sh to run on boot. will see in hbnb-arm.04 if it worked. 

## [0.0.1-rc.9-hbnb-arm.02] - Q1/2021

### Added
09-Mar - 2021-03-09-1637.log#2018/2022 lots of "cp: cannot stat" and "No such file or directory". 
       -- Trial and Error didn't work. So we made almost every combination of source and target folder and file in custom-settings and compile.bash
       -- in the files (in the custom-settings directory) we appended their location (file path) as a note in each file, for future reference 
10-Mar -- now, when the disk image is mounted (and when the build generates a log), we'll see the origin of each successful file transfered
       -- then we can do away with all the excess files created for this test (in custom-settings) leaving the source code dependable and minimal.
       -- feedback will be given to FooDeas/raspberrypi-ua-netinst's guide, which we're confident we can simplify after this.  

# [0.0.1-rc.9-hbnb-arm.01] - Q1/2021

### Added
08-Mar - 2021-03-08-1910.log#1691 "dos2unix: can't open" error. Added 'dos2unix' to installer-config.txt 
       - 2021-03-08-1910.log#1691-94 "No such file or directory" error. Added the following line to compile.bash
         `cp -r ../custom-settings/my-files.list config/files/ &&`

### Changed
08-Mar - 2021-03-08-1910.log#1740/41 "www-data:x:33:33:" error. Moved permission changed from installer.config.txt to build.sh (run by .bashrc)
08-Mar - 2021-03-08-1910.log#1746 "chroot: can't execute '/usr/bin/svn" error. Moved svn block of code, from installer.config to build.sh too


## [0.0.1-rc.9-hbnb-arm] - Q1/2021

07-Mar - Introduced `ip4_nameservers=8.8.8.8,8.8.4.4` and `ip6_addr=disable` to installer-config.txt and it helps a lot with poorer grad networks e.g. badly configured routers, repeaters etc
03-Mar - Added some code to build.sh to allow php files to run shell commands on the local system
01-Mar - Noticed a .bashrc file was missing from the custom-settings directory. Placed it in there.

#### Changed
08-Mar - so my-files.list and custom_files.txt was failing and got so confusing we hit the bug with a big hammer and just ran every combination to ensure it works. These files now go into /config/files/ and /config and both are run. This has become a real source of annoyance
       - attempted to add some bug fixes to the post-install.txt e.g. apt-key permissions, dns resolving and CLI warning with apt packages 
       - attempted to get post-install.txt to do everything and have .bashrc load /etc/init.d/build.sh which serves as a sort of final check 
07-Mar - Moved packages from installer-config.txt to post-install.txt to lower risk of failure rate in step 1 (installer config) and to proceed to step 2 (post install) 
       - Re-organised post-install.txt so that most suceptable points of failure (which cause reboot) are executed last. init.d/build.sh can go over the previous 2 steps to be sure they got done before proceeding
       - Still messing with wpa_supplicant.conf - also used both custom_files.txt and my-files.list (part of a troubleshooting process)
       - End-user now required to only add wi-fi ssid/password & country_code to the installer-config.txt (the build handles wpa-supplicant now (see post-install.txt))
       - With the autonomated compiler its now possible to make this into a self-service download website, whereby a bespoke 'plug & play' disk image is created for each user.
06-Mar - Trying a new method with wpa_supplicant.conf to try to keep it minimal and dependable
02-Mar - Changed build.sh to compile.sh (because raspberrypi-ua-netinst/build.sh caused confusion. I also reworded it in README and CHANGELOG so it maintains sense when reading. 
       - Changed README to include fill usage instructions
01-Mar - Compile.sh now appends `exit 1` to the end of `raspberrypi-ua-netinst/buildroot.sh` (or else an `:(stdin)` error prevents exit on completion) see https://github.com/FooDeas/raspberrypi-ua-netinst/issues/213 
27-Feb - Minor edit to README.md

#### Fixed
07-Mar - Post-install.txt started getting ignored during local testing. Weird. Possibly because it fails beforehand trying mount the /boot (FAT32 must be used, not exFAT32)
       - I also moved a lot of the packaged that needed to be installed from installer-config.txt to post-install.txt to lighten the load and opportunity for failure on the first step
02-Mar - compile.sh moved `img.xz` to a directory one above the desired one. Changed `mv ../*.img.xz` to `mv ./img.xz` - Fixed! 
01-Mar - compile.sh should be `trunk/static/gui` not `trunk/gh-pages/static/gui` ('gh-pages' is the repos default branch, maybe how it knows)
       - an E1700013 error: or in the case of local testing a E1700000 error.
        
#### Removed
08-Mar - Used 1 DNS in installer-config.txt . comma or space between them ? until this is known, 1 will have to do 
       - Took away custom_files.txt since it doesn't seem to be used - although this may stop the disk image build if I recall
07-Mar - trimmed down the installer-config.txt a little to help secure a dhcp connection 
03-Mar - build.sh duplicated some of installer-config.txt, more of a contingecy in case installer-config failed. Housekeeping so removed it
01-Mar - results.log - intended for reporting how the compile.sh performed, but ended up ditching it.

### ISSUES,RISKS,CONCERNS
07-Mar - build.sh isn't working. Perhaps to do with install_files in post-install.txt (troubleshooting to find out)
01-Mar - Semantic versioning concern - 'rc' suffix applies to all the software compiler source code in this monorepo branch (net-installer)
       - Each software in this branch really needs its own suffix e.g. 'rc.1-hbnb-arm' and 'rc.1-togo-x86', or something to this effect
       - We expect the softwares will expand to support more architectures and the types of softwares for the network resources will expand e.g. Hotspotβnβ, To-Go-USB, Cacher, Neo-Dome etc
01-Mar - the build doesn't complete nicely. The buildroot.sh file needs reviewing. 
