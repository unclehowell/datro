# Changelog
Developers are expected to log all changes to this directory to this changelog.

The Datro Consortium format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
and [Prince2 Highlight Reports](https://prince2.wiki/management-products/highlight-report/).

# changelog refers to versions one ahead of buildlog. 
# since changelog is release notes, whereas buildlog is a post-performance report of the build/changelog version. 
# like this - changelog 0.1 release. Then buildlog of 0.1 release. 
# then changelog of 0.2 release (will refer to buildlog of 0.1 and bug and fixes) 

## [Unreleased]

## [0.0.1-rc.9-hbnb-arm.08] - Q1/2021
13-Mar - 2021-03-13-0909.log - v0.0.1-rc.9-hbnb-arm.07 on RPI4 - still buggy, below are fixes for hbnb-arm.08:

### Changed
13-Mar - line 249-251 (and it repeats) `W: Couldn't download` & `ERROR 1, trying again` - increased `installer_networktimeout` from 15 to 60    
13-Mar - line 1811 shows 'update-rc.d: error: unable to read /etc/init.d//etc/init.d/build.sh'. Why's etc/init.d inside etc/init.d ? 
         -- changed `cp -p` to `cp -r` inside compile.bash
    
## [0.0.1-rc.9-hbnb-arm.07] - Q1/2021
13-Mar - 2021-03-13-0500.log - v0.0.1-rc.9-hbnb-arm.06 ran on RPI4 with bugs - below are the patches for hbnb-arm.07:
         -- zero errors with custom-settings files - first time ever

### Added
13-Mar - error line 1927 says "dpkg-preconfigure: unable to re-open stdin" - added `export DEBIAN_FRONTEND=noninteractive` to post-install.txt
13-mar - error line 1653 isn't an error, its a user prompt to choose locales. Added a flag to avoid user prompts. Not errors, but could do without.        
13-Mar - build.sh wasnt recognising svn, so added package install for svn again, in build.sh before svn is called..
13-Mar - noticed on build completion `hostname -I` is called but no ip is displayed. Could be internet is lost on reboot. But set net-tools to install beforehand just incase.

## [0.0.1-rc.9-hbnb-arm.06] - Q1/2021
12-Mar - 2021-03-12-2250.log - v0.0.1-rc.9-hbnb-arm.05 ran on RPI4 with following bugs. Here are the fixes:
13-Mar - hbnb-arm.06 compiles in 1 minute (down from 3 minutes)

### Changed
12-Mar - Line 1904-19 (make-ssl-cert errors) - moved package installs from installer-config back to post-install.txt and build.sh     

### Removed
13-Mar - During compile custom-settings files added are displayed. So those have been kept in custom-settings, all others removed  
        
## [0.0.1-rc.9-hbnb-arm.05] - Q1/2021
11-Mar - 2021-03-11-2350.log says that v0.0.1-rc.9-hbnb-arm.04 ran on RPI4 but bugs reported (see buildlog). Here are the fixes:

### Changed
12-Mar - errors 1696 - 1700 (missing /config/files/root/) - seems config/files/root wash hashed out in compile.bash - unhashed them
12-Mar - dpkg-preconfigure: unable to re-open stdin: - set the perl:locale's in post-install.txt's
12-Mar - build ended abruptly (during package install) - moved all package installs from post-install to install-config (possibly more stable)
12-Mar - may have solved apt CLI Warning by adding this to apt update in post-install  `2>/dev/null | grep packages | cut -d '.' -f 1`

## [0.0.1-rc.9-hbnb-arm.04] - Q1/2021
10-Mar - 2021-03-11-0111.log - changes to custom-settings files caused missing /home/pi/.bashrc and /etc/init.d/build.sh. 
         -- confident these are now fixed (changes in compile.bash). These changes should make the next build work 100%. 
11-Mar   -- error "cannot create /dev/null: Permission denied" is an annoyance. added the following code into post-install:
            `rm /dev/null && mknod /dev/null c 1 3 && chmod 666 /dev/null`

### Removed
10-Mar - adding country=XX to installer-config.txt caused it to appear twice in wpa_supplicant.conf (removed from post-install.txt to fix it)
