# Changelog
It's expected that developers log all changes to this directory, in this CHANGELOG.md file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

1. This websites within a directory of a directry of a gh-pages repo
   - for this reason `index.html` is located two directory levels up e.g. for `index.html` you'd instead use `../../index.html`  
   - equally `index.html` has to locate files in this directory e.g. for `"css/style.css"` you'd instead use `static/datro/css/style.css`  
   - this said a copy of ../../index.html exists in this directory (with updated links) so there's no 404 or redirect when you visit datro.xyz/static/datro/    

## [Unreleased]

## [-datro.05] - Q1/2022

### Fixed
Feb-22 - Security Fix `follow-redirects >=1.14.8` & `engine.io >=4.0.0"` in `static/datro/html/videos/package-lock.json`  

## [-datro.04] - Q4/2021

### Removed
Dec-11 - Removed the `academy link` because its a very incomplete page  


## [-datro.04] - Q3/2021

### Added
Oct-02 - `index.html` was missing `<link rel="manifest" href="manifest.json">`, so it was added   

### Fixed
Oct-02 - `manifest.json` was missing `:` after `"icons"`. Final comma also removed to clear errors    
Oct-02 - Some spelling errors on the splashpages and the styling of the `learn more` dropdown needed tweaking  
Oct-01 - The video on the splashpage was a broken link - fixed it   

### Removed
Oct-02 - Removed analytics and some java to increase pagespeed load time. Not sure with analytics regen how we exclude pages,, yet  

## [-datro.04] - Q3/2021

### Added
Sep-13 - manifest.json  
Sep-06 - Added current year to page title (and a "view all" option for commits) to the following page `html/statistics/website.html`  

### Changed
Sep-30 - Changed video location in `html/videos/intro-hbnb.html` - see corresponding changelog for details  
Sep-25 - Changed index.html and ../../index.html text  
Sep-13 - Improved the dropdown menu look, it has been anoying us for a long while  
Aug-29 - Changed ScottishBay to DAS (Decentralized Autonomous Society) - operation is no longer stationary/static, we're going mobile/itenerant   
Aug-29 - Changed icon image in 'html/static/website.html' to the profile logo from github.com/unclehowell   
Aug-14 - Copywriting improved - minor edit - Also changed format of date on this Changelog    
Aug-04 - Copywriting text improved in index.html and links to documents.html replaced with data-featherlight view and new library view (codenamed LibrarEye)     
Aug-04 - Changed download in footer to downloads - since the button links to the gh-pages releases, which now features more than just compiled HBnB Disk Image e.g. Persistent-Live, DApps and all the websites   
Aug-04 - Changed date on footer to include script that detects and displays current year (for copyleft).Replaces having to rewrite the year on the website each year to keep it concurrent   
Jul-07 - Changed the menu labels from `technology` to `portfolio` and `documents` to `library`  
 

## [datro.03] - Q2/2021

### Changed
Jun-25 - Changed document link in footer to open `../library/` in featherlight box instead of hyperlink to `documents.html` page - html library explorer is a better user experience   
Jun-25 - Changed `<a class="nav-link" href="documents.html">` to `<a data-featherlight="iframe" data-featherlight-iframe-allowfullscreen="true" class="nav-link" href="../library/">`  
May-08 - Changed `html/videos/package-json.lock` (packages: `ua-parser-js` & `lodash`) and `html/featherlight/package-json` (package: `grunt`) ... to latest version to solve high severity security threats (reported by github dependancy bot).  
May-05 - Minor change to json in html/videos - security fix - see `html/video/changelog.md`  
Apr-17 - GitHub link for HBnB segment was incorrect. Changed it to point to net-installer branch and hbnb README.md   
Apr-10 - Removed scroll bars from 404 and changed some content on the 404 page to exactly match the other pages  
Apr-05 - Intro text on docs page was re-written  
Apr-05 - Changed the semantic version and the prefix of this directory - the full semantic version is now `0.0.1-rtw.11-static-datro.03`  
       - `0.0.1-rtw.11` is the branch e.g. "Release to Web (RTW)"  
       - `static-datro.03` is added to the end to reflect this subdirectories version'  
       -  must find a way to use semantic version badges on the published content too to save viewing the changelogs for version numbers   

### Removed
Jun-25 - Removed `))` at the start of `static/datro/html/statistics/website.html` - typo error, shouldn't be there   


### Fixed
May-04 - Security Vunerability fixed - https://github.com/websockets/ws/commit/00c425ec77993773d823f018f64a5c44e17023ff
May-04 - An experimental bash script (`monoreapo/analytics/run.sh`) removed lines while injecting/removing google analytics script  
Apr-24 - Carousel in index.html didn't work offline, fixed it by replacing `bootstrap.min.js` with an offline copy  
Apr-05 - There was a security vunerablity in html/videos/package-lock.json - fixed it as per github's suggestion (upping the version of a package to the latest)  


### Ideas

Jun-25 - Make the `static/library` html library explorer theme match the `static/datro/documents.html` page e.g. maybe a html tag in the library explorer menu to show the release version   

## [0.0.2] - Q1/2021

### Added
Jan-31 - The Academy link was missing from the index page so I added it  

### Changed
Mar-25 - Links to Facebook Page were incorrect, changed it sitewide  
Mar-25 - Noticed the video player has stopped functioning. So updated npm and re-installed the solution adopted, but no success locally. Will push and try remotely again later  
Mar-10 - Academy.html said GPL was General Open Licence (bad case of find and replace by the looks of it) changed "Open" back to "Public" so it makes sense  
Jan-31 - Html/statistics/website.html - few minor bug fixes - made it look better on mobile.   

### Fixed
Mar-23 - Fixed some broken links  
Feb-06 - Removed broken links - since the problematic pages were dormant I just erazed them, but kept the pages so as not to cause more broken links  
Jan-31 - Html/statistics/website.html - commit comments weren't showing. simple fault, path to js was incorrect.   

### Removed
Mar-23 - Bulk removed ® symbol, since this is now all GNU GPL   
Jan-31 - Deleted directories labelled old as part of typical housekeeping   


## [0.0.1] - Q3/2020

### Added
Sep-13 - GNU General Public Licence - sitewide  
Sep-13 - Local boostrap-grid.css, or else the columbs turn into rows if the cdn bootstrap isn't reachable.  

### Changed
Sep-13 - Redirected all the pending webpages to the main page. Until they're ready to present. (see meta in header)  
Sep-13 - Changed `href="#myCarousel"` to `data-target="#myCarousel"` on the splashpage, to fix a bug (page was scrolling)  
Sep-13 - html theme now matches website theme  

### Removed
Sep-13 - <link href="https://www.f-cdn.com/assets/bundles/jquery-4df54fac.js" rel="preload"> appeared multiple times on the same page.  
Sep-13 - Modernizer.js is discontinued, not the service, just the single js file method. So it's been removed, since it was causing errors.  
Sep-13 - Removed videolightning.js too, haven't used that feature for a while.  

### Fixed
Sep-13 - The frame the docs are displayed in (featherlight) was scrolling upwards off screen, whenever you selected the doc. Fixed it!  
Sep-13 - Copyleft symbol wasn't appearing on chrome on android. Reversed copyright symbol using css instead.   
Sep-13 - Changed background color to theme, the white default was making the website look poor between page refreshes  

### To Do
Sep-13 - The dropdown in the footers seems to work locally now, let's see if it works when the sites pushed to gh-pages .... No :(  
