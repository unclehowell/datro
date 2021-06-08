# Changelog
It's expected that developers log all changes to this directory, in this CHANGELOG.md file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

1. This websites within a directory of a directry of a gh-pages repo
   - for this reason `index.html` is located two directory levels up e.g. for `index.html` you'd instead use `../../index.html`  
   - equally `index.html` has to locate files in this directory e.g. for `"css/style.css"` you'd instead use `static/datro/css/style.css`  
   - this said a copy of ../../index.html exists in this directory (with updated links) so there's no 404 or redirect when you visit datro.xyz/static/datro/    

## [Unreleased]

## [datro.03] - Q2/2021

### Changed
08-May - Changed `html/videos/package-json.lock` (packages: `ua-parser-js` & `lodash`) and `html/featherlight/package-json` (package: `grunt`) ... to latest version to solve high severity security threats (reported by github dependancy bot).  
05-May - Minor change to json in html/videos - security fix - see `html/video/changelog.md`  
17-Apr - GitHub link for HBnB segment was incorrect. Changed it to point to net-installer branch and hbnb README.md   
10-Apr - Removed scroll bars from 404 and changed some content on the 404 page to exactly match the other pages  
05-Apr - Intro text on docs page was re-written  
05-Apr - Changed the semantic version and the prefix of this directory - the full semantic version is now `0.0.1-rtw.11-static-datro.03`  
       - `0.0.1-rtw.11` is the branch e.g. "Release to Web (RTW)"  
       - `static-datro.03` is added to the end to reflect this subdirectories version'  
       -  must find a way to use semantic version badges on the published content too to save viewing the changelogs for version numbers   

### Fixed
04-May - Security Vunerability fixed - https://github.com/websockets/ws/commit/00c425ec77993773d823f018f64a5c44e17023ff
04-May - An experimental bash script (`monoreapo/analytics/run.sh`) removed lines while injecting/removing google analytics script  
24-May - Carousel in index.html didn't work offline, fixed it by replacing `bootstrap.min.js` with an offline copy  
05-Apr - There was a security vunerablity in html/videos/package-lock.json - fixed it as per github's suggestion (upping the version of a package to the latest)  


## [0.0.2] - Q1/2021

### Added
31-Jan - The Academy link was missing from the index page so I added it  

### Changed
25-Mar - Links to Facebook Page were incorrect, changed it sitewide  
24-Mar - Noticed the video player has stopped functioning. So updated npm and re-installed the solution adopted, but no success locally. Will push and try remotely again later  
10-Mar - Academy.html said GPL was General Open Licence (bad case of find and replace by the looks of it) changed "Open" back to "Public" so it makes sense  
31-Jan - Html/statistics/website.html - few minor bug fixes - made it look better on mobile.   

### Fixed
23-Mar - Fixed some broken links  
06-Feb - Removed broken links - since the problematic pages were dormant I just erazed them, but kept the pages so as not to cause more broken links  
31-Jan - Html/statistics/website.html - commit comments weren't showing. simple fault, path to js was incorrect.   

### Removed
23-Mar - Bulk removed ® symbol, since this is now all GNU GPL   
31-Jan - Deleted directories labelled old as part of typical housekeeping   


## [0.0.1] - Q3/2020

### Added
13-Sep - GNU General Public Licence - sitewide  
13-Sep - Local boostrap-grid.css, or else the columbs turn into rows if the cdn bootstrap isn't reachable.  

### Changed
13-Sep - Redirected all the pending webpages to the main page. Until they're ready to present. (see meta in header)  
13-Sep - Changed `href="#myCarousel"` to `data-target="#myCarousel"` on the splashpage, to fix a bug (page was scrolling)  
13-Sep - html theme now matches website theme  

### Removed
13-Sep - <link href="https://www.f-cdn.com/assets/bundles/jquery-4df54fac.js" rel="preload"> appeared multiple times on the same page.  
13-Sep - Modernizer.js is discontinued, not the service, just the single js file method. So it's been removed, since it was causing errors.  
13-Sep - Removed videolightning.js too, haven't used that feature for a while.  

### Fixed
13-Sep - The frame the docs are displayed in (featherlight) was scrolling upwards off screen, whenever you selected the doc. Fixed it!  
13-Sep - Copyleft symbol wasn't appearing on chrome on android. Reversed copyright symbol using css instead.   
13-Sep - Changed background color to theme, the white default was making the website look poor between page refreshes  

### To Do
13-Sep - The dropdown in the footers seems to work locally now, let's see if it works when the sites pushed to gh-pages .... No :(  
