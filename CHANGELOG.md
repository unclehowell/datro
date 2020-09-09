# Changelog
All changes to this directory will be documented in this file.
For changes to the directories content, please see the CHANGELOG's contained within the corresponding directory.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1-rtw.8] - 2020-09-03
### Added
    - GNU General Public Licence - sitewide

### Changed
    - Moved the entire repo from `github.com/unclehowell/HBnB` to `github.com/unclehowell/datro`
    - Re-structured directory (ongoing)... and re-branded, from Wave, to HotspotBnB, to DATRO
    - HotspotBnB and Wave are now spin-off/subsidiary projects of DATRO
    - Renamed `static/demo` directory to `static/gui`. It may double up as a demo for HBnB, but it's actually the actual GUI 

### Removed
    - Copyright (from Sphinx html docs)

### Fixed
    - The frame the docs are displayed in (featherlight) was scrolling upwards off screen, whenever you selected the doc. Fixed it!
    - Copyleft symbol wasn't appearing on chrome on android. Reversed copyright symbol using css instead.
    - changed background color to theme, the white default was making the website look poor between page refreshes
    - the dropdown in the footers seems to work locally now, let's see if it works when the sites pushed to gh-pages. 

### To Do
    - Add Copyleft to Sphinx html docs, where copyright used to be (now that displaying the copyleft symbol has been resolved)

### Issues

## [0.0.1-rtw.7] - 2020-06-24
### Added
- two important folders introduced, dynamic and static. static is for all the static websites, dynamic for the server-side backend/ CMS's etc.
- added the Latex docs library under the directory /static/files (/static/docs is the website to view the files)

### Changed
- altered the content of the CHANGELOG.md to relate specifically to this (gh-pages-dev) branch e.g. website development, not software development
- moved all the hiden (server-side) folders into the dynamic directory. And made the folders visible (removed the dots from the start of the name)

### Removed
-

### Fixed

- Semantic version is standard, other than v0.0.x-rc.x is for software (master branches) and v0.0.x-rtw.x is for websites (gh-pages branches)

### Issues
- I installed the php extension imagick.so to the localmachine and php.ini file and it's throwing up an apache error with the demo
- But weirdly not the wordpress websites. I installed it to clear a wordpress health report error. All we know at this point.

[Unreleased]: https://github.com/unclehowell/hbnb/compare/v0.0.1-rtw.7...HEAD
[0.0.1-rtw.7]: https://github.com/unclehowell/hbnb/compare/v0.0.1-rc.7...v0.0.1-rtw.7
