# Changelog
It's expected that developers log all changes to this directory, in this CHANGELOG.md file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.2] - Q1/2021

### Added
31-Jan - The Academy link was missing from the index page so I added it.

### Changed
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
