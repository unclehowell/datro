# Changelog
It's expected that developers log all changes to this directory, in this CHANGELOG.md file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [-library.04] - Q3/2021

### Added
Sep-09 - Links to docs in languages selector page needed a tweak to match the design of the categories links  
Sep-08 - Most of the document library explorer pages are now accurate. Maybe 2 more left to improve on (the hbnb appstore apps). Aim to do tomorrow, must sleep now   
Sep-07 - Improved the BJesus out of the design of the library, but it's not complete yet. Uploading to run a test (see if the redirect in /build/latex/` is ok   
Sep-03 - Now supporting multiple languages(See _theme-docs/CHANGELOG.md). More dependancies required (See COLLABORATE.md)   
Jul-24 - Added a directory called `consortium_other/github_wiki` in library and contained within is a new type of `custom.sh` build script   
Jul-24 - The idea is that this build will trigger the custom.sh which will fetch the latest github wiki and turn it into a standard doc e.g. html/pdf   

### Changed
Sep-09 - Minor tweaks to `_theme-explorer/style.css`   
Sep-08 - Made some updates to COLLABORATE.md and README.md, to include recent developments   
Sep-08 - Stylesheet improvements to Library Explorer  
Jul-26 - Major change and milestone with custom.sh script in `consortium_other/github_wiki`  
Jul-11 - Added svg/png maps to `consortium_bloculus` document  
Jul-11 - Changed date format on this changelog - should always be YYYY-MM-DD, not sure why its been DD-MM up until now (perhaps keepchangelog guildelines ??)   
Jul-11 - Minor edit to `consortium_bloculus` - removed content from template and inserted some lorum ipson text  
Jul-08 - Changed the `consortium_bloculus` document content to further explain the protocol ... still way more to do on this doc and protocol, but it's coming together  

### Removed
July-24 - Removed `Grid-Intro` from `consortium_plans/.treeview.json`  
July-29 - Removed some bad code from the end of `consortium_other/github_wiki/index.html` which caused hits to redirect back to the previous page.  

### Fixed
Sep-09 - Google Search Console was reporting overflow issues. had to add `padding:0px;` to `ui`, bullet points were hidden but still shifted content into an overflow situation  

## [-library.03] - Q2/2021

### Added 
23-May - Added `consortium_plans/test_network/` (not Sphinx but instead a slideshow made in Google Docs Slides (for now)). The `build/` filepath is used for consistency for the html/json file explorer  
12-May - Have to commit abrubtly due to keyboard and laptop possibly overheating and keystrokes resulting in duplicate letters on the screen. Concern of data loss upon impending system reboot  
12-May - Added content to `static/library/casestudy_techhouse1`, which has also been renamed from `campusone` to `techhouse1` - still more to do  
11-May - Modified `static/library/_theme-*/rebuild-master.sh` (rc1.3 > rc.1.4) - Added sed command to change stylesheets to left aligns images   
10-May - Updated `consortium_finance/funding_investors` (v0.0.7 > v0.0.8) - See the documents latest release notes for details  
09-May - Added `consortium_campus/casestudy_campusone` (v0.0.1) - Still in draft, but it's a start  
08-May - Updated `consortium_finances/funding_creditors` (v0.0.4 > v0.0.5). Made sure there's a rst for v0.0.4 , and followed the methodology for re-release (which is still undocumented FYI)
08-May - Updated `consortium_finances/funding_creditors` (v0.0.3 > v0.0.4). Note: No rst for version '0-0-1/2 & 3', but PDF's exist in archive/"wayback" - v0.0.4 release done according to proposed smart contract rule e.g. archived '0.0.3' and linked to archived copy in 'latest/v0.0.4' releasenotes (olderversions segment) & Semantic version updated by x.x.1 etc   
06-May - Added some more docs to explorer  
05-May - Added glyphicons to the explorer - nothing too fancy, just up icon for navigating up the directory and a book icon for the directories/files    
01-May - The json file is now entitled `.treeview.json` and the remote url will be used instead of githubs API.    
01-May - Enhanced the scripts for the html navigation so that it uses an offline json when offline. Next up - A script to produce the json file would be an impovement over manually maintaining it, as the library grows   
20-Apr - Build script (rebuild.sh) now creates a redirect page in latex, so instead of seeing a directory listing in html view, you see the compiled PDF  
18-Apr - Added theme for github api/ github-pages html-view of library (_theme-gitapi)    
15-Apr - More work on campus library document - entitle consortium-campus  
13-Apr - Testing a serverless file indexing method, so datro.xyz/static/library will show the document directories as html   
13-Apr - Added a document for the DATRO Campus e.g. static/library/datro-consortium/consotrium/campus/latest   
27-Mar - Trying to get docs library to work with readthedocs by adding .readthedocs.yml  

### Fixed
23-May - Minor typo fix in html footer of Google Patent Purchase Agreement  
08-May - Annex.rst removed from campus one doc. It was from a template used - didn't correspond  
08-May - Corrected the purchase price of Campus One from $200k to $250k (possibly still inaccurate as it was around 7 years ago)  
18-Apr - Fixed a load of issues with the github api index.html files (which allows file exploring via gh-pages webpage view)   
05-Apr - The custom.sh script file in some docs (which pulls spreadsheet data in) was producing errors. Appended a `--location` to curl which fixed it  

### Changed
25-Jun - Changed `consortium_deals` to `consortium_contracts` and updated references and titles in the file explorer e.g. `index.html` and `.treeview`    
25-May - Changed color in index.html files e.g. file explorer pages. Because the library will now appear in a featherlight popup on the DATRO website when documents are seleted. So the themes need to match   
25-May - Updated `funding_investors` but didn't re-release doc. Although the entry was made in the releasenotes  
24-May - Updated `funding_creditors` 0.0.9 => 0.1.0  ... also updated `fundin_investors` data
23-May - Title of file explorer index for `consortium_plans/test_network/` was changed to match doc title  
02-May - Began changing all the filepaths in the library from `something-something` to `something_something` - part of a uniform standard being adopted  
02-May - see _theme* directories changelogs to see update to rebuild-master.sh (version 1.0)  
22-Apr - Put collaboration instructions from README.md into its own COLLABORATE.md file  
21-Apr - Master-rebuild.sh in `_theme-blue` and `_theme_grey` has gone up to version 0.0.9 - it now builds html files for library navigation via html  
07-Apr - Worked on datro-consortium/consortium-investors v0.1.6 then archived, ran `make clean` and began work on v0.1.7 e.g. latest  
07-Apr - Moved archives to netlify branch and called it `wayback`  
05-Apr - Moved archived content from each document directory to /static/archives   

### To Do
06-Apr - Solve table numbering in Sphinx. Table numbering restarts on every new chapter   

### Issues
08-May - Need to get docs (html & PDF) to open links in new tab. Browser based PDF viewer doesn't show within iframes/ divs. And `library.datro.world` displays `datro.xyz/static/library` in a frame  
08-May - Solved below by ignoring github API and using local .json (.treeview.json) in each directory instead  
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
