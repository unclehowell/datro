# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).  

This directory and changelog belongs to [![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/unclehowell/datro?include_prereleases)](https://github.com/unclehowell/datro/releases)  

## [Unreleased]  

## [_theme-docs.08-rc2.4] - Q1/2022

### Added
Mar-22 - Updated `blue.sh` and `grey.sh` (v0.4-rc.3 => v0.4-rc.4) added `white-space:normal` to prevent overflow of text in main column   
Jan-27 - Updated `blue.sh` and `grey.sh` (v0.4-rc.2 => v0.4-rc.3) fixing the position of the breadcrumb broke after pip/wheel update  
Jan-15 - Updated `rebuild-master.sh`. The preview link was incorrect, now it is correct  

### Fixed
Mar-23 - `blue.sh & grey.sh rc.4 => rc.5` no-wrap changed from normal to pre-line   
Mar-12 - Stylesheet bug on narrow mobile devices - fixed it in blue.sh and grey.sh    
Mar-12 - Search Result format was poor. This change bug fixes the stylesheet  

### Issues
Mar-22 - Some of the bug fixed in `blue.sh` are missing from `grey.sh`  

## [_theme-docs.08-rc2.3] - Q4/2021

### Added
Nov-08 - Introduced a `html` directory with all the generatic css,img & js from the html builds. Part of a plan to remove duplicates during the build   

## [_theme-docs.08-rc2.2] - Q3/2021

### Added
Sep-29 - `rebuild-master.sh` (> v08-rc.2.6) Added some PDF notes and code tips at the bottom  
Sep-14 - `rebuild-master.sh` (> v08-rc2.2) Added simple error check/safeguard, 1) Reverts path to `./latest` after each task, 2) Confirm, 3) Resume script (abort if 2 = mismatch)   

### Changed
Sep-16- `rebuild-master.sh` (> v08-rc.2.3) changed the preview document link which appears after the doc has compiled (sprase-checkout (default) / customize link (optional)  

## [_theme-docs.08-rc2.1] - Q3/2021

### Added
Sep-14 - `rebuild-master` (> v0.8-rc2.4) added `chown -R $user:$user` before `make html` and `bash ./theme.sh` to overcome a permissions error  
Sep-11 - `Grey.sh` and `Blue.sh` (>v0.4-rc.2) - Introduced css to left-align author. Otherwise it inherited the default (text-align: justify), which didn't sit right  
Sep-09 - Blue.sh & Grey.sh (> v0.4) - After introducing a feature to add a "Back to Library" Button in the footer during the application of the theme   
Sep-08 - Grey.sh (v0.2 > v0.3) - The theme was displaying text in black. Made color white e.g. `color:#fff`   

### Changed
Sep-10 - `Grey.sh` and `Blue.sh` (v0.4 > v0.4-rc.1) Added an affix to semantic version of these theme files because they change so after, and improved yesterdays change to these files   
Sep-09 - `Grey.sh` and `Blue.sh` (v0.x > v0.3) - Reversed copyleft footer, it was '..Consortium | datro.xyz', now it's 'datro.xyz | ..Consortium', incase we need to append, say, '& Co-Author'  
Sep-08 - Minor edit to `rebuild-master.sh` to save anyone changing the theme some time. See code/commit if you care about this change   

### Issues
Sep-09 - Really annoying dot at the end of the footer. Tried `footer p:child-element:after{content ""}` with no success  

## [_theme-docs.08-rc2.0] - Q3/2021

### Added
Sep-07 - Now generates an `index.html` inside `build/latex` which redirects to `build/latex/en`  

### Changed
Sep-07 - Brought `grey.sh` upto version 0.2 and `blue.sh` to version 0.2 too - final change was removing `filter` css class from the images (used only for the Campus IV Site Survey)   
Sep-07 - The last change to `blue.sh` and `grey.sh` (theme changer) didn't correctly remove the "View Source" nor support biligual. Now it does   

## [_theme-docs.08-rc1.9] - Q3/2021

### Added 
Sep-05 - Made PDF's open in "_self"  
Sep-03 - Appended another line to blue.sh and grey.sh to change footer copyleft notice to show date range, as oppose to a fixed date.   
Sep-03 - Now supports Internationalization (EN, ES, DE, FR, IT, RU, ZH, AR, HI). More to come. ATM tanslations have to be done manually using a .po editor.  

### Remved
Sep-04 - Removed some languages as they were causing issues. es fr de & en all work fine.  

## [_theme-docs.08-rc1.8] - Q3/2021

### Added
Aug-22 - Added sed command to build-master.sh to append script that'll change date in footer (copyleft notice) from fixed year to range e.g. 2021 - YYYY  (YYYY being the current year)   

### Changed

Sep-02 - replaced `sed -i 's/ View page source/ /g' build/html/*.html` with `sed -i 's|<a href="_sources/index.rst.txt" rel="nofollow">.*</a>||'` to support multi-language  

## [_theme-docs.08-rc1.7] - Q2/2021

### Changed
24-Jun - Changed `https://localhost` to `http://localhost` on preview link in rebuild.sh, because ssl error caused if there's no certificate on localserver  
24-Jun - Changed `-theme-docs` to `_theme-docs`, how it should be  

## [_theme-docs.08-rc1.6] - Q2/2021  

### Added
15-May - Blue.sh (v0.0 > v0.1) - Added `sed -i 's/#bdbdbd/#333687/g' build/html/_static/css/theme.css`   
14-May - RC1.6 - `_theme-{color}` is now simply `_theme-docs` - the color is now set in the `rebuild.sh` script - This saves maintaining multiple `_theme-{color}` directories   
14-May - RC1.5 - rebuild-master.sh messages improved to be clearer and more specific  
11-May - RC1.4 - rebuild-master.sh now changes `.rst-content blockquote{margin-left:24px` to `0px` to left align images  
05-May - RC1.1 - Added better styling for codeblock  
02-May - index.html generated for build/latex no longer redirects to pdf, but instead opens it in new tab - temp fix for PDF not opening in datro.world iframe (which resulted in the following error "Requests to the server have been blocked by an extension")  

### Changed  
07-May - For the sake of beutifying things the rebuild script (v1.2) now displays a link to the newly developed html file explorers index.html on completion of the build   
19-Apr - Changed rebuild-master to produce a html redirect in build/latex/ - redirects from the directory to the pdf   

## [0.0.6] - Q3/2020

## Added
10-Oct - the text for the tables was dark (black) and should have been light (grey/white). Updated the rebuild.sh to perform this modification  
13-Sep - modified the `rebuild.sh` script to add css to hide the scrollbar in the html build  

## [0.0.5] - 2020-09-02                                                                    
xx-MMM - Rebranded - hotspotbnb.com is now a subsidiary of the DATRO consortium.   
xx-MMM - Moved repo to github.com/unclehowell/datro  
xx-MMM - Updated the update.sh to make sure it pulls latest from there now instead  
xx-MMM - Hide the copyright notice in footer (still need to get copyleft in its place)  
xx-MMM - LICENCE was still MIT. Changed it to GNU General Public Licence 3.0  
xx-MMM - Changed docs html theme to match websites.   


## [0.0.4] - 2020-01-10 

### Added 

xx-MMM - Auto-rebuild.sh still started with `sh` for some reason, which caused an error, so it was changed to `bash`  
xx-MMM - Update.sh had a coding error on the final curl, which pulled the README.md into the sphinx directory. Fixed it  
xx-MMM - Formatting this changelog and README.md to the same standard as we do in the reStructuredText (.rst) files e.g. *** above and below the title, === below the sub title and ------ below the sub-sub title  
xx-MMM - Made the rebuild script call the update.sh file as well, since rebuild pulls the latest files from source-files. So it just as well try be updated to the latest first.   
xx-MMM - Fixed awk datetime.log error in update.sh. Since the file is called from the latex directory, I had to change `datetime.log` to `../../../_blue-build-source/datetime.log`  

## [0.0.3] - 2020-01-01

### Added

xx-MMM - used bash instead of `sh` in the scripts. So to run type `./script.sh` not `sh script.sh`  
xx-MMM - fixed the auto-rebuild.sh script  
xx-MMM - made sure all directories had the latest build and auto-rebuild script and were in `latest` subdirectories  
xx-MMM - fix with update.sh - it was pulling the latest source files into the sphinx directory where `auto-rebuild.sh` was kept. Changed the path of the curl destination  
xx-MMM - modified `rebuild-master.sh` to include `sh custom.sh 2> /dev/null &&` - runs `custom.sh` if it exists. If it doesn't exist the error is hidden  
