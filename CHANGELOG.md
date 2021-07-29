# Changelog
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).  

1. When refering to a directory e.g. `library', 'datro', 'hbnb' etc, note that the full path includes a '/static/' before the directory title  
 - better to say this once than keep writing /static/ in every changelog entry, before the directory being refered to.  
 - ideally at some point the content of /static/ could be moved up a directory and /static/ removed alltogether.   
 - However, for now, it's understood that /static/ is required of gh-pages to serve the directory content as webpages.   
2. Any changes to index.html in this top level directory should be logged in the datro subdirectory, since it belongs to that website  
3. Before commiting a change update the sitemap.xml (automated script to perform this task is in the `static/monoreapo/sitemap/` directory  

## [Unreleased]

## [0.0.1-rtw.12] - Q3/2021

### Added
Jul-24 - Added a custom.sh in one of the docs in library (see library changelog), just wanted to push before running the script, incase  

### Removed
Jul-29 - Removed some bad code in library `github_wiki/index.html` which caused a bug. see library changelog for details   

### Changed 
Jul-24 - Change in Library (wiki document) - see libraries dedicated changelog for details  
Jul-11 - Minor edit to `library` and regenerated sitemap.xml and changed the date format in this changelog moving forward. Was DD-MM , now it's MM-DD   
Jul-08 - Changed to `static/library` - see library changelog for details  
Jul-06 - Ran `static/monoreapo/analytics/undo.sh` and `run.sh` (remove/ re-insert google analytics in *.html's & re-generate sitemap)  

### Fixed

### Updated
Jul-26 - Updated sitemap.xml (to include first draft document (pdf/html) version of github wiki  
Jul-24 - Updated Bloculus biz case draft in library and updated the sitemap.xml  

## [0.0.1-rtw.11] - Q2/2021

### Added
25-Jun - Added content to `static/bloculus` - just a map at this stage, no h3 overlay - but it's a start   
25-Jun - Added `static/library/bloculus`  
22-Jun - Added `static/grid2` trying the following https://openlayers.org/en/latest/examples/graticule.html   
21-Jun - Added `static/grid/` as part of a new project   
02-Jun - Added `static/monoreapo/analytics` and `static/monoreapo/sitemap` - details in their dedicated README.md files   
25-May - Added a sitemap generator script `make-sitemap.sh` and `make-sitemap.sh.options`   
24-May - Added a table containing links to the other monorepo branches in README.md  - It did exist previously, it must have been mistakenly removed   
24-May - Added css to file explorer index.html pages to hide scrollbars - when visiting datro.xyz webpages within datro.world scrollbars were showing   
23-May - Added `body{color:#202020}` to index.html as it was considered to be critical css   
08-May - Added key at top of changelog to keep author from repeating lengthly notes   
06-May - Added more docs to the library - see the file explorer to see: https://datro.xyz/static/library/   
01-May - Added index.html to `static` subdirectory, with .treeview.json  - the result is a html navigator   
18-Apr - Theme customisation in Docs Library (github api/gh-pages html-view) see corresponding static/library CHANGELOG.md for details   
17-Apr - Added code tip to COLLABORATE.md - a script to add 2 spaces at the end of each line in .md files - see note in file (at bottom)   

### Removed
25-Jun - Removed everything in `static/bloculus/` - was only there for testing, not important ... yet   
25-Jun - Removed `static/library/grid` and `grid2` - Directory is now labelled `bloculus`   

### Changed
25-Jun - Generated new sitemap.xml  
25-Jun - Changes to color scheme in index.html pages (file explorer) inside `static/library` and change style.css inside `static/library/_theme-explorer` - see corresponding changelogs for details   
25-Jun - Changed `static/grid` and `static/grid2` to `static/bloculus`  
04-Jun - Minor edits - added html   
03-Jun - Changed `http` to `https` and `CNAME` content from `datro.xyz` to `unclehowell.github.io` as instructed by GitHub support to solve white page issue e.g. mixed content   
02-Jun - Ran run.sh in `static/monoreapo/analytics` - which inserted analytics tracking into all .html files in this branch  
25-May - Modified `make-sitemap.sh` to change sitemap from weekly to hourly   
25-May - Modified `make-sitemap.sh.options` to remove unwanted files in `sitemap.xml`   
23-May - Changed `sitemap.xml` - `consortium_campus` corrected to `consortium_campuses`  
23-May - See `static/hbnb/CHANGELOG.md` - .png > .webp  
23-May - Added the file explorer index.html's to `sitemap.xml`  
23-May - Manual entries into the `sitemap.xml` - mainly the locations of the compiled html's in `static/library` which are listed to show in the .treeview.json   
15-May - Changed the index.html in `static/` to stop file explorers navigating up a directory.  
10-May - Updated `funding_invesors` (0.0.7 > 0.0.8) - see document release notes for details  
08-May - Updated `funding_creditors` document in library (0.0.3 > 0.0.4). See static/library/CHANGELOG.md for more info  
05-May - Changed the index.html in static (the html directory navigator) - included glyphicons  
02-May - Changed `coming-soon/coming-soon` to `coming_soon/coming_soon` throughout the monorepo - to match the new path of the document  
21-Apr - Changed some characters in README.md since the characters weren't all recognised in different readers  
17-Apr - Minor change to static/datro - see corresponding CHANGELOG.md for details  
13-Apr - Started a new document for the DATRO Campus - see the doc library changelog for more info  
10-Apr - Little tidy up on badges layout of README.md in the top level directory   
10-Apr - Changed /static/files to /static/library and updated all references to it  
07-Apr - Worked on static/library/ (datro-consortium/consortium-investors) - see static/library/CHANGELOG.md and changelog in document for details  
05-Apr - Minor edit to static/datro/documents.html - see corresponding changelog for details  

### Fixed
25-Jun - Fixed missing buttons in the `static/datro` website - `static/datro/css/bootstrap.min.css` needed replacing with an earlier version. Perhaps building and testing `static/monoreapo/analytics/run.sh` or `./undo.sh` buggered it up   
04-May - An experimental bash script (`monoreapo/analytics/run.sh`) removed lines while injecting/removing google analytics script  
04-May - Fixed the white page of death. Put CNAME and Cloudflare DNS settings back, but tag urls changed from https to https were kept   
27-May - Busted then fixed messing with svn  
23-May - Google Search Console Reported error `Alternate page with proper canonical tag` - Attempt made to remedy  
08-May - Fixed some data miscalculations in the creditors document - see static/library/changelog for more info  
08-May - Minor edit to document in library - see static/library changelog for details  
08-May - Updated packages in static/datro/html/featherlight and /videos to counter security threats - see corresponding changelogs for details   
05-Apr - Minor security fix in static/datro - see corresponding changelog for details  

## [0.0.1-rtw.10] - Q1/2021

### Added
23-Mar - Added `neodome`, `scottishbay`, `cacher` & `togo` subdirectories in `static`, since they'll have dedicated websites shortly too.  
27-Feb - Directory Structure in README.md  
25-Feb - ES subrepo added - see static/gui changelog for details   
30-Jan - gui changes - app store etc - see gui changelog for more info   
27-Jan - added first app store page - caterogies only for look and feel demo purposes only. Incomplete work (see static/gui CHANGELOG.md)    
14-Jan - introduced a new website for evr-network (bootstrap of datro.xyz)  
14-Jan - evr-network.live in GoDaddy forwards to evrnetwork.datro.world, then the javascript in the netlify splashpage brings up the website   

### Changed 
25-Mar - link to facebook was incorrect on datro website, fixed it sitewide  
10-Mar - minor typo correction - see static/hbnb/changelog.md   
07-Mar - see static/gui changelog   
24-Feb - fetch.html changed in static/gui/app-store/apps/xxx-xxx/ - see corresponding changelog for details   
16-Feb - more work on gui - see static/gui changelog    
14-Feb - changed the way methodology for how screens pages load and the apps load - see static/gui changelog    
14-Feb - see changelog for static/gui and static/hbnb - just some minor minor edits   
12-Feb - made more changes to 'static/gui', see its dedicated changelog for details   
01-Feb - see changelog for 'static/gui' and 'static/evr-network' - minor edits   

### Removed   
24-Mar - removed hbnb video from evr-network directory, basic housekeeping  
16-Feb - removed secret ssl keys from some 3rd parties embedded repo  

### Fixed
29-Mar - static/gui - fixed broken link - see gui changelog  
25-Mar - more wc3 validating (index.html only)  
24-Mar - wc3 validator fixes - https://pastebin.com/Au8ZEHmd  
24-Mar - hbnb video corrupted , had to grab an old copy and overwrite  
22-Feb - sorted 2 schoolboy erros on javascript on index.html e.g. `<script> src="" </script>`  
16-Feb - see static/gui changelog - search fixed  
16-Feb - removing the keys from the 3rd party repo (see ### removed above) caused a push and gh-pages build to fail because of a broken symlink   
16-Feb - theres a copy of the repo from before this oversight, so rolling back could work, but I decided to remove the folder containing the symlink instead and try again  
 
## [0.0.1-rtw.9] - Q4/2020  

### Added
13-Dec - Replaced instances of HotspotBnB with Hotspotβnβ in index.html, static/gui and static/hbnb  
13-Dec - static/files alternate theme added. See their subdirecty changlogs for more details   

### Changed
14-Dec - static/gui & static/hbnb favicons changed to new logo  
13-Dec - static/gui theme colour modified. See their subdirecty changlogs for more details   
30-Oct - static/gui improved (search splashpage). See its embedded changelog for more info  
 
## [0.0.1-rtw.8] - Q3/2020

### Added
13-Sep - Missing files from the last commit - restored (/static/library/_source-files)  
09-Sep - GNU General Public Licence - repo/ sitewide   

### Changed
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

### Fixed
- Semantic version is standard, other than v0.0.x-rc.x is for software (master branches) and v0.0.x-rtw.x is for websites (gh-pages branches)  

### Issues
- I installed the php extension imagick.so to the localmachine and php.ini file and it's throwing up an apache error with the demo  
- But weirdly not the wordpress websites. I installed it to clear a wordpress health report error. All we know at this point.  

[Unreleased]: https://github.com/unclehowell/hbnb/compare/v0.0.1-rtw.11...HEAD  
[0.0.1-rtw.10]: https://github.com/unclehowell/hbnb/compare/v0.0.1-rc.10...v0.0.1-rtw.10  
