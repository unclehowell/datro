# Changelog
It's expected that developers log all changes to this branch in this CHANGELOG.md file.  

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).  

## [Unreleased] 

## [0.0.1-rtwx.4-rc.6] - Q1/2024

### Added
Feb-24 - Cloudflare Pages Build error - Update deployment ID (Code 8000009) - I disabled cloudflare pages since netlify and gh-pages are enough  

## [0.0.1-rtwx.4-rc.5] - Q4/2023

### Added
Dec-23 - Added 'demos' directory  

## [0.0.1-rtwx.4-rc.4] - Q2/2022

### Added 
May-25 - Added 2nd quote for client Env, in wayback directory  
May-24 - Added quote for client Env, in wayback directory  

### Changed
Apr-15 - See Wayback/Changelog.md  

## [0.0.1-rtwx.4-rc.3] - Q1/2022

### Added 
Jan-27 - Added docs for client file `EVL`  

### Changed
Jan-27 - Format of recently added docs needed altering  

### Issues
Jan-27 - Need to make it so language comes before document type shortcode e.g. inv/quo etc  

## [0.0.1-rtwx.4-rc.2] - Q4/2021

### Added
Dec-30 - See wayback/changelog - added some PDF's  
Dec-18 - Renamed it Wayback Archive and made both `wayback.datro.xyz` and `archive.datro.xyz` to a/b test  
Dec-17 - Added a better design to wayback - checkout wayback.datro.xyz to see  
Dec-12 - Added `2021-10-18_consortium_finance-funding_sales8cc_en_inv-0042.pdf` to wayback   

## [0.0.1-rtwx.4-rc.1] - Q3/2021

### Changed
Sep-16 - Minor edit to `2021-09-01_consortium_contracts-techhouse2_lease5_es_v0-0-0.pdf` - Section 6 was still in Spanish. Now it's translated to English    
Sep-12 - Changed the CNAME to world.datro.xyz and made datroxyz-* subdirectories featuring an index file which redirects to the corresponding content in the gh-pages repo and datro.xyz domain e.g. world.datro.xyz/datroxyz-gui/ redirects to datro.xyz/static/gui   
       - this allows datro.xyz/static/gui to appear when world.datro.xyz/datroxyz-gui/ is entered in the address bar (static/gui will then know to serve up the GUI as a DATRO World wrapper, as oppose to the online demo data  
Sep-12 - Few more tweaks before we go ahead and merge all this into a shared feature of the main GUI,  
Sep-12 - Major change. Investing in the possibility that the same GUI can function as the online demo, gui and "datro world" (asset explorer)  
       - The GUI already serves the first two functions, with javascript that looks at the address bar before serving content  


### Added
Sep-30 - Added `2020-08-01_hbnb-intro.webm` to wayback. In gh-pages it corrupts due to constant push/pulls  
Sep-16 - Added `2021-09-01_consortium_contracts-techhouse2_lease5_es_v0-0-0.pdf`  
Sep-15 - Archived contract for techhouseII added  
Sep-14 - Just a note. Having a pair of iframes here in this "netlify" repo (accessible via world.datro.xyz and world.datro.xyz/library) ...  
       - Pointing to a pair of GUI's in the "gh-pages" repo (accessible via datro.xyz/static/gui/ and datro.xyz/static/library) ...  
       - is 1) a step towards a single world.datro.xyz interface for everything   
       - a solution to split content across multiple repo branches in order to:   
           - work around github's 1 site limit (by introducing netlify) and enjoy free hosting  
           - fall below netlify's billing ceiling (content with fewer changes will live on the branch netlify deals with)   
           - speed up page loading by having multiple domains/ repos delivering the content.  
           - make content accessible from easier to remember urls e.g. world.datro.xyz instead of datro.xyz/static/gui (for 1 example)  

### Issues
Sep-14 - In the spirit of functionality offline, the library .json files should point to redirectors which check the address in the address bar.   
       - When only the library GUI should retrieve archived files from "world.datro.xyz/wayback" which points to the netlify branch content  
       - When offline the library GUI should retrieve archived files from, for example "http://localhost/datro-netlify/wayback"  


## [0.0.1-rtwx.3] - Q2/2021

### Added
25-Jun - Added 4c60e78bf3c2bae9787f88f62c877867.txt for custom domain mail server setup  
25-May - Added a sitemap generator script `make-sitemap.sh` and `make-sitemap.sh.options`   
23-May - Added `sitemap.xml` for SEO purposes  
12-May - Added `2021-05-06_consortium_finances-funding_investors.v0.1.7` to wayback directory and updated `wayback/treeview.json`   
08-May - Added `2021-05-02_consortium_campus-sitesurvey_jamhighland_v0.0.1.pdf` to wayback directory and updated `treeview.json`  
08-May - Added `2019-12-09_wave-tokens-wit_v0.1.3.pdf` to archive/"wayback" directory and reference it in `treeview.json`   
05-May - Added `gui.datro.world` which maybe a waist of time since the netlify splashpage is itself a version of the dashboard too. But why not.  
02-May - Added `wayback.datro.world` to list of subdomains - `datro.world/wayback` also works too.  
02-May - Added two spaces to the end of every line in this changelog so it formats correctly when viewing it on githubs webpage  
01-May - Added library.datro.world - opens datro.xyz/static/library - a html file explorer of the DATRO document library  
13-Apr - Archieved another file in the wayback directory. see wayback changelog for details  
07-Apr - Archived a file in the wayback directory. see wayback changelog for details  
05-Apr - Added wayback directory e.g. archived files. The content includes items that are compiled e.g. pdf.   
       - The gh-pages branch is already large enough without having to add this archive directory and its contents too.   
       - But this branch is lightweight - providing this new directory isn't modified too frequently there's be no cost either (since netlify charges with excessive usage)  
       - Now documents can link to archived versions of themselves - the only concern is cross domain with iframes , because the docs are on datro.xyz and this directory is datro.world  


### Changed
15-Jun - Changed jquery-1.1.0 to use same server, not link to jquery's website    
29-May - Minor edits to landing page `canonical` and `title` tag   
25-May - Dashboard/breadcrumb/index.html changed to index.html.old so as not to appear in sitemap.xml   
25-May - Changed `make-sitemap.sh` from weekly to hourly   
25-May - `make-sitemap.sh` had wrong domain name for the branch. Changed `datro.xyz` to `datro.world`   
22-May - Modified footer copyleft year to 2021   
08-May - Modified `wayback` - see wayback/changelog for details   
01-May - Replaced title of splashpage - from `DATRO CONS.` to `DATRO`   
06-Apr - One of the filenames in wayback was amended from `2020-06-12_wave-tokens-wrt_v0.1.5.pdf` to reflect the correct date   

### Removed
15-Jun - Removed analytics tracking code from localhost splashpage   

### Fixed
23-May - Splash page icons were all made the same size   

## [0.0.1-rtwx.2] - Q1/2021

### Added
27-Feb - Minor edit to README.md (directory structure added). Pending changes, need to change 'app-store' to 'websites' and use latest fetch.html method from HBnB GUi  
01-Feb - Added a fund category, using Bitcoin as the symbol, instead of dollars  
24-Jan - Added the ability to launch a different icon hyperlink depending if viewing the website from online or offline.   
       - This solves seeing the dreaded 404 pages when working offline, while preserving the online experience.  
       - The reason the hyperlinks can't just begin with './' is because the destinations are all on a seperate domain (see README.md to learn why).    
14-Jan - Introduced a new website for evr-network (bootstrap of datro.xyz)  
       - Evr-network.live in GoDaddy forwards to evrnetwork.datro.world, then the javascript in this splashpage brings up the frame that loads the website   
16-Jan - Added canion meta to redirect pages to force https. Not hugely neccessary, just keeping things consistent with datro.xyz repo  

### Removed
01-Feb - Version "v" in title was causing the version number to spill off the page. Shrinking text was a nightmare, so I just removed the v.  

### Changed
25-Mar - Changed the header title to 'DATRO CONS.' (DATRO Consortium). The version number made it too technical looking - plus that can be on each webpage as a html badge instead  
07-Feb - Changes on the 3rd were not completed. Locally it worked, not public, solved it by making all the splashpages match the local one!   
03-Feb - Disabled visitors from viewing 'production' and 'beta testing' screens (until we're at those stages).   
03-Feb - Added support for localhost, but from a remote device. Since it sees an ip (192.168 etc), not 'localhost'   
24-Jan - Installed some packages to my local machine and suddenly the gui started showing minor style bugs, which have now been corrected.   


## [0.0.1-rtwx.1] - Q4/2020

### Added
22-Oct - Change the header text to display version number. (netlify branch, not gh-pages branch).   
17-Oct - Added a local.html page, for localhost. Or else you see a 404 each time when working offline.   
17-Oct - Moved Hotspotβnβ from development to Beta testing (WoodHaven Installation Complete).   
       - RPi4 image only atm (see releases for link),still need to make the image a net-installer and serve all models of RPI.   
15-Oct - New Hotspotβnβ logo added  

### Changed
03-Oct - Moved content of frame down a bit, it was getting cut off  
03-Oct - Changed page titles from `Datro Assets` to `DATRO`  

## [0.0.1-rtwx.1] - Q3/2020

### Added
15-Sep - Made it so videos (inside the dashboard iframe) could be played full screen  
15-Sep - Put in some cool css, to hide blue flashes (in chrome) when you click stuff:  
       - `a{-webkit-tap-highlight-color: transparent;}`  
15-Sep - Jquery, to detect subdomain then change iframe content to correspond and raise top bar  
       - (So when you type hbnb.datro.world, index.html takes you to hbnb.html#anchor (the anchor hides the topbar))  

### Removed
15-Sep - Remove AMP from splashpage. For now.  
13-Sep - Hid scrollbars, gorgeous if I do say so  

### Changed
15-Sep - Moved everything from /docs directory into the top level directory  
15-Sep - New theme - the one kind most web-apps follow e.g. the grey, night-coding, dark-mode type  
15-Sep - Merged some css files into 1, on the dashboard. And solved the bugs which came up as a result.   

### Fixed
15-Sep - The frame didn't reach the bottom, causing a small black bar. TWOK  
15-Sep - The topbar button (to hide the top bar) was loading early and too think to click easily. TWOK  
