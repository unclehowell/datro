# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1-rc.7] - 2020-04-30
### Added
- 

### Changed
- build.sh needed a 10 second delay to allow for the Wi-Fi connection to establish

### Removed
-

### Fixed
-

### Plans
- add regerneration of keys to post-install.txt
- add an upgrade (cgi) button, to reboot and re-build. Saves re-flashing the MicroSD Card
- add and configure cgi in build.sh - (and place upgrade-reboot & reboot cgi into cgi-bin ready) 
- introduce a preference menu on first install e.g. detect system storage (usb), recommended default apps,
- in preference menu open by identifying the internet access (wlan/ eth/ eth>usb) etc - and show options to configure new mode (or keep)
- App Store methodology, like advent calender and chocolate inside. Except the doors are AppUnits
- e.g Make a folder to correspond to each available space on the appstore. 
- like install-config.txt, have a settings text file > use a build script > outputs an App Unit.
- make apps install

## [0.0.1-rc.6] - 2020-04-29
### Added
- README.md, CHANGELOG.md & COLLABORATE.md [@unclehowell](https://github.com/unclehowell).
- Timezones in client/os/
- 15 second delay added in build.sh. Due to Raspberry Pi rebooting before wlan establishes internet (2020-05-01) 

### Changed
- Replaced git checkout in /client/os/build.sh with `svn co`. Cleaner, Better. 

### Removed
- 

### Fixed

## [0.0.1-rc.5] - 2020-04-27
### Added
- 

### Changed
- 

### Removed 
- 

### Fixed
- 

[Unreleased]: https://github.com/unclehowell/hbnb/compare/v0.0.1-rc.6...HEAD
[0.0.1-rc.6]: https://github.com/unclehowell/hbnb/compare/v0.0.1-rc.5...v0.0.1-rc.6
