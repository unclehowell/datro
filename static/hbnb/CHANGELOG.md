# Changelog
It's expected that developers log all changes to this directory, in this CHANGELOG.md file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1-rtw.14] - 02/09/2024

### Changed
- Changed the website in the monorepo https://github.com/unclehowell/datro/tree/gh-pages/static/hbnb to React.js
- Implemented modern web design using React.js + Tailwind CSS 

### Fixed
- Responsive issues and JavaScript errors that appeared on https://hbnb.datro.xyz/ were fixed.

## [hbnb.03] - Q1/2022

### Added
Mar-25 - Added link to video, next to link to demo (loop back to this task later and add a featherlight popup)  
Jan-12 - Added sitemap directory with a sitemap.xml generator script  

### Changed
Mar-25 - Chaged `_popup` to `_blank` for main links to external sources  

### Fixed
Mar-22 - Small bug fixed - Some dashboards weren't loading  

## [hbnb.02] - Q4/2021

### Fixed 
Oct-02 - `manifest.json` was missing `:` after `"icons"`. Final comma also removed to clear errors    

### Changed
Dec-11 - Link to demo changed, demo now has its own url: `gui.datro.xyz`  
Dec-03 - Replaced link to demos with link to github repo and datro website   
Dec-03 - Changed URL of Demo. Temp fix. Ideally a lookup needs to be used so that if the address in the address bar is not `hbnb.datro.xyz` then `../gui/` is returned, in order it works offline too    
Dec-01 - Added `lookup.html` and `js/jquery-3.3.1.min.js` - url detection, to determin url of demo based on url in address bar  
Nov-30 - Cleared _config.yml and inserted `exclude: - Gemfile` instead (trying to get this site published via netlify)   

### Removed
Dec-01 - Removed _config.yml, not needed  


## [-hbnb.01] - Q3/2021

### Added
Aug-13 - Minor edit to README.md - almost lost a handy bit of code, so I put it in the README for now. Really it should be in docs, will get to that later  

## [-hbnb.01] - Q2/2021

### Added 
17-Apr - Added double spaces to end of paragraphs in this changelog so it presents on github.com website the same as in a text editor   

### Changed
23-May - Changed the images from `.png` to `.webp`  


## [0.0.3] - Q1/2021

### Changed
14-Feb - Minor edit. Typo/ spelling correction  

## [0.0.2] - Q4/2020

### Added
13-Dec - Changed all instances of 'HotspotBnB' to 'Hotspotβnβ'  

### Changed
14-Dec - FavIcons updated to show the new Hotspotβnβ Logo  
10-Oct - Changed the github.com release url, from the hbnb repo, to the datro repo  
       - - inacurate according to our semantic release methodology and nomenclature, but it's only temporary.  
       - - at least until the hbnb net installer source code branch is moved from hbnb to datro   

## [0.0.1] - Q3/2020

### Added
00-Ooo - put some css into the header to allow scrolling, but hide the scrollbars  
00-Ooo - it should be in the css, but one step at a time. Will try that next, but not on the main (on the beta)  

### Changed
13-Sep - got rid of a horizontal scrollbar which was very apparent against the contrasting footer color.   

### Fixed
