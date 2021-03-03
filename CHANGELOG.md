# Changelog
Developers are expected to log all changes to this directory to this changelog.
This CHANGELOG (in the top level directory) follows a [Prince2 Highlight Report](https://prince2.wiki/management-products/highlight-report/) Methodology.
CHANGELOG's exist in each subdirectry to correspond to its content and ahead to [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html). The CHANGELOG structure is as follows:
BRANCH: net-installer/
                     /hbnb/arm/CHANGELOG.md # H
		     /hbnb/x86/CHANGELOG.md #

## [Unreleased]

## [0.0.1-rc.1] - Q1/2021

### PLAN

2021Q1 - Get the 'net-installer' branch in better shape,
         so that anyone, anywhere can also compile a fresh disk image, which produces the same results

### PERFORMANCE

#### Added
01-Mar - got hbnb/arm functioning - see hbnb/arm/changelog.md for details

#### Changed
02-Mar - hbnb/arm build doesn't complete successfully. build.sh goes into /etc/init.d and .bashrc is set to run it. Troubleshooting 
01-Mar - Restarted semantic versioning. Higher standard set for releases, no more increasing semantic versioning willy nilly
         Few more changes too - see the hbnb/arm/changelog.md for more info
27-Feb - Minor edit to README.md

#### Fixed
02-Mar - ran the image produced for hbnb/arm (rpi) - issues reported. Fixed! see hbnb/arm CHANGELOG for details
01-Mar - hbnb/arm/custom-settings/ fix - see hbnb/arm CHANGELOG

#### Removed

### ISSUES,RISKS,CONCERNS

### PLAN MOVING FORWARD
02-Mar - more of an idea. Since a compile.sh script now exists, it maybe worth making this into a self-service web-service
       - could use heroku or something near free, to let the website visitor enter SSID and password, or select ethernet and produce a custom build
       - would surely be concerns with privacy, but it could be made a choice for convenience     
01-Mar - perhaps img.xz is already at its smallest, but if it could be compressed further without issues that would be great. Worth investigating
