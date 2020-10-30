# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1-rtw.8] - Q3/2020

### Added
13-Sep - Missing files from the last commit - restored (/static/files/_source-files)
09-Sep - GNU General Public Licence - repo/ sitewide

### Changed
30-Oct - static/gui improved. See its embedded changelog for more info
09-Sep - Moved the entire repo from `github.com/unclehowell/HBnB` to `github.com/unclehowell/datro`
09-Sep - Re-structured directory (ongoing)... and re-branded, from Wave, to HotspotBnB, to DATRO
09-Sep - HotspotBnB and Wave are now spin-off/subsidiary projects of DATRO
09-Sep - Renamed `static/demo` directory to `static/gui`. It may double up as a demo for HBnB, but it's actually the actual GUI

### Removed
13-Sep - Removed Scrollbars on all websites, part of the introduction of https://datro.world
09-Sep - Copyright (from Sphinx html docs)

### Fixed
24-Sep - Broken links fixed (using a chrome link checker plugin from pagemodified.com - thanks whoever built it)
09-Sep - The frame the docs are displayed in (featherlight) was scrolling upwards off screen, whenever you selected the doc. Fixed it!
09-Sep - Copyleft symbol wasn't appearing on chrome on android. Reversed copyright symbol using css instead.
09-Sep - changed background color to theme, the white default was making the website look poor between page refreshes


### To Do
09-Sep - Add Copyleft to Sphinx html docs, where copyright used to be (now that displaying the copyleft symbol has been resolved)

### Issues
09-Sep - the dropdown in the footers seems to only work locally

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
