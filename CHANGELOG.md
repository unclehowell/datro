# Changelog
It's expected that developers log all changes to this branch in this CHANGELOG.md file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1-rtwx.2] - Q1/2021

### Added
24-Jan - added the ability to launch a different icon hyperlink depending if viewing the website from online or offline. 
         this solves seeing the dreaded 404 pages when working offline, while preserving the online experience.
         the reason the hyperlinks can't just begin with './' is because the destinations are all on a seperate domain (see README.md to learn why). 
14-Jan - introduced a new website for evr-network (bootstrap of datro.xyz)
       - evr-network.live in GoDaddy forwards to evrnetwork.datro.world, then the javascript in this splashpage brings up the frame that loads the website
16-Jan - added canion meta to redirect pages to force https. Not hugely neccessary, just keeping things consistent with datro.xyz repo

### Removed
01-Feb - version "v" in title was causing the version number to spill off the page. Shrinking text was a nightmare, so I just removed the v. 

### Changed
24-Jan - Installed some packages to my local machine and suddenly the gui started showing minor style bugs, which have now been corrected.   


## [0.0.1-rtwx.1] - Q4/2020

### Added
22-Oct - Change the header text to display version number. (netlify branch, not gh-pages branch). 
17-Oct - Added a local.html page, for localhost. Or else you see a 404 each time when working offline. 
17-Oct - Moved Hotspotβnβ from development to Beta testing (WoodHaven Installation Complete). 
         RPi4 image only atm (see releases for link),still need to make the image a net-installer and serve all models of RPI. 
15-Oct - New Hotspotβnβ logo added

### Changed
03-Oct - moved content of frame down a bit, it was getting cut off
03-Oct - changed page titles from `Datro Assets` to `DATRO`

## [0.0.1-rtwx.1] - Q3/2020

### Added
15-Sep - made it so videos (inside the dashboard iframe) could be played full screen
15-Sep - Put in some cool css, to hide blue flashes (in chrome) when you click stuff:
         `a{-webkit-tap-highlight-color: transparent;}`
15-Sep - Jquery, to detect subdomain then change iframe content to correspond and raise top bar
       # So when you type hbnb.datro.world, index.html takes you to hbnb.html#anchor (the anchor hides the topbar)

### Removed
15-Sep - Remove AMP from splashpage. For now.
13-Sep - Hid scrollbars, gorgeous if I do say so

### Changed
15-Sep - moved everything from /docs directory into the top level directory
15-Sep - New theme - the one kind most web-apps follow e.g. the grey, night-coding, dark-mode type
15-Sep - Merged some css files into 1, on the dashboard. And solved the bugs which came up as a result. 

### Fixed
15-Sep - The frame didn't reach the bottom, causing a small black bar. TWOK
15-Sep - The topbar button (to hide the top bar) was loading early and too think to click easily. TWOK
