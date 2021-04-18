# Changelog
It's expected that developers log all changes to this directory, in this CHANGELOG.md file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]


## [-library.03] - Q2/2021

### Added 
15-Apr - more work on campus library document - entitle consortium-campus
13-Apr - Testing a serverless file indexing method, so datro.xyz/static/library will show the document directories as html   
13-Apr - Added a document for the DATRO Campus e.g. static/library/datro-consortium/consotrium/campus/latest   
27-Mar - Trying to get docs library to work with readthedocs by adding .readthedocs.yml  

### Fixed
18-Apr - Fixed a load of issues with the github api index.html files (which allows file exploring via gh-pages webpage view)   
05-Apr - The custom.sh script file in some docs (which pulls spreadsheet data in) was producing errors. Appended a `--location` to curl which fixed it  

### Changed
07-Apr - worked on datro-consortium/consortium-investors v0.1.6 then archived, ran `make clean` and began work on v0.1.7 e.g. latest
07-Apr - Moved archives to netlify branch and called it `wayback`  
05-Apr - Moved archived content from each document directory to /static/archives    

### To Do
06-Apr - Solve Table numbering in Sphinx. Table numbering restarts on every new chapter   

### Issues
17-Apr - Github API tends to temporarily stop responding when testing - perhaps it thinks it's abuse. stop seems temp, no perminant - maybe cloudflare

## [-library.02] - Q3/2020

### Added
00-000 - GNU General Public License - site-wide  
00-000 - removed scrollbars completely - see the `master-rebuild.sh` script in the `_blue-build-source` directory  

### Changed
00-000 - Re-structured directory (ongoing)... and re-branded, from Wave, to HotspotBnB, to DATRO  
00-000 - HotspotBnB and Wave are now spin-off/subsidiary projects of DATRO  
00-000 - Renamed `static/demo` directory to `static/gui`. It may double up as a demo for HBnB, but it's actually the actual GUI  

### Removed
00-000 - Copyright (from Sphinx html docs)  

### Fixed
00-000 - The frame the docs are displayed in (featherlight) was scrolling upwards off screen, whenever you selected the doc. Fixed it!  
00-000 - Copyleft symbol wasn't appearing on chrome on android. Reversed copyright symbol using css instead.  
00-000 - Changed background color to theme, the white default was making the website look poor between page refreshes  
00-000 - The dropdown in the footers seems to work locally now, let's see if it works when the sites pushed to gh-pages.  

### To Do
00-000 - Add Copyleft to Sphinx html docs, where copyright used to be (now that displaying the copyleft symbol has been resolved)  

### Issues

## [-library.01] - 2020-06-24
### Added
00-000 - Two important folders introduced, dynamic and static. static is for all the static websites, dynamic for the server-side backend/ CMS's etc.  
00-000 - Added the Latex docs library under the directory /static/files (/static/docs is the website to view the files)  

### Changed
00-000 - Altered the content of the CHANGELOG.md to relate specifically to this (gh-pages-dev) branch e.g. website development, not software development  
00-000 - Moved all the hiden (server-side) folders into the dynamic directory. And made the folders visible (removed the dots from the start of the name)  

### Removed

### Fixed

00-000 - Semantic version is standard, other than v0.0.x-rc.x is for software (master branches) and v0.0.x-rtw.x is for websites (gh-pages branches)  

### Issues
00-000 - I installed the php extension imagick.so to the localmachine and php.ini file and it's throwing up an apache error with the demo  
00-000 - But weirdly not the wordpress websites. I installed it to clear a wordpress health report error. All we know at this point.  

[Unreleased]: https://github.com/unclehowell/hbnb/compare/v0.0.1-rtw.9-library.03...HEAD  
[0.0.1-rtw.9-library.02]: https://github.com/unclehowell/hbnb/compare/v0.0.1-rtw.9-library.01...v0.0.1-rtw.9-library.02  