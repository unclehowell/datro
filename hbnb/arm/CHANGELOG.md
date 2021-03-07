# Changelog
Developers are expected to log all changes to this directory to this changelog.

The Datro Consortium format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
and [Prince2 Highlight Reports](https://prince2.wiki/management-products/highlight-report/).

## [Unreleased]

## [0.0.1-rc.9-hbnb-arm] - Q1/2021

### PLAN

2021Q1 - Get the HotspotBnB ARM Architect (Raspberry Pi) 'net-installer' branch in better shape,
         so that anyone, anywhere can also compile a fresh disk image, which produces the same results

### PERFORMANCE
03-Mar - Building ok on the raspberry pi 4. Just tried it.  
01-Mar - Made a build script, to help understand what's going on and automate the compiling of autonomated builder aka net-intaller (source code > img.xz), with one command (`sudo bash ./compile.sh`).

#### Added
03-Mar - Added some code to build.sh to allow php files to run shell commands on the local system
01-Mar - Noticed a .bashrc file was missing from the custom-settings directory. Placed it in there.

#### Changed
07-Mar - Still messing with wpa_supplicant.conf - also switched from custom_files.txt to my-files.list
       - end-user now required to only add wi-fi ssid/password & country_code to the installer-config.txt (the build handles wpa-supplicant now (see post-install.txt))
       - with the autonomated compiler its now possible to make this into a self-service download website, whereby a bespoke 'plug & play' disk image is created for each user.
06-Mar - Trying a new method with wpa_supplicant.conf to try to keep it minimal and dependable
02-Mar - changed build.sh to compile.sh (because raspberrypi-ua-netinst/build.sh caused confusion. I also reworded it in README and CHANGELOG so it maintains sense when reading. 
       - changed README to include fill usage instructions
01-Mar - Compile.sh now appends `exit 1` to the end of `raspberrypi-ua-netinst/buildroot.sh` (or else an `:(stdin)` error prevents exit on completion) see https://github.com/FooDeas/raspberrypi-ua-netinst/issues/213 
27-Feb - Minor edit to README.md

#### Fixed
02-Mar - compile.sh moved `img.xz` to a directory one above the desired one. Changed `mv ../*.img.xz` to `mv ./img.xz` - Fixed! 
01-Mar - compile.sh should be `trunk/static/gui` not `trunk/gh-pages/static/gui` ('gh-pages' is the repos default branch, maybe how it knows)
       - an E1700013 error: or in the case of local testing a E1700000 error.
        
#### Removed
07-Mar - trimmed down the installer-config.txt a little to help secure a dhcp connection 
03-Mar - build.sh duplicated some of installer-config.txt, more of a contingecy in case installer-config failed. Housekeeping so removed it
01-Mar - results.log - intended for reporting how the compile.sh performed, but ended up ditching it.

### ISSUES,RISKS,CONCERNS
07-Mar - build.sh isn't working. Perhaps to do with install_files in post-install.txt (troubleshooting to find out)
01-Mar - Semantic versioning concern - 'rc' suffix applies to all the software compiler source code in this monorepo branch (net-installer)
       - Each software in this branch really needs its own suffix e.g. 'rc.1-hbnb-arm' and 'rc.1-togo-x86', or something to this effect
       - We expect the softwares will expand to support more architectures and the types of softwares for the network resources will expand e.g. hotspotbnb, to-go-usb, cacher, neo-dome etc

01-Mar - the build doesn't complete nicely. The buildroot.sh file needs reviewing. 

### PLAN MOVING FORWARD

