# Changelog
It's expected that developers log all changes to this branch, in this CHANGELOG.md file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1-gui.3] - Q1/2021
### Added
27-Jan - started to work on app store. app store will be the same for actual gui on localhost webserver and remote online demo. Unlike 'screens' pages, which have seperate demo pages for online. 
### Removed

### Changed
30-Jan - started to change the theme of the app store  - incomplete . work in progress - just wanted to get local work published sooner than later
24-Jan - when you pull down the top bar and select a screen e.g. entertainment, controllers, smart home etc it loads one.
         right now the apps are hardcoded into these screens. and link to the installed apps when you select them (locally only).
         2 things are being changed here. Firstly, there'll be a demo screen which will be loaded if the GUI is accessed online (since its a demo)
         If the GUI is being accessed locally it'll load a sister screen with actually installed apps.
         This is achieved by making the hyperlink go to a lookup.html page, which checks the address bar to decide which screen to load. 
         This is prep work for the app store, the 'one-click' cgi-script installer/uninstaller and app store interactive demo.       

25-Jan - Since this has now been solved we no longer need to have people visiting the demo go to the app store to see the app icons. 
         so the gui file structure can be rectified. For some reason the dashboard html pages of the gui were in app-store not dashboard.  
         so the content of the app-store, other than the apps themselves, are being moved into the dashboard directory.
         until this gui is all figured out in a language like react, html and cgi serves purpose fine. 
         the idea is still to visit the app store (the app-store itself being an app) in order to explore apps. 
         when the 'one-click' install is pressed, the cgi runs and installs script (public server copy (the demo) no install/script can run - perfect) 
         in addition to the script running the bash to install the respective app, it will rewrite the dashboard html to display the app.
         in inverse, if 'one-click' uninstall is hit, the application uninstalls/removes and the dashboard html is re-written to remove the app icon. 
         locally script can run. Public server copy it cannot. So we have demo dashboard pages to simulate apps have been installed. 
         on the demo pages the app icons launch the developers interactive demo. Ideally interactive demos should be sub-repos of ours and work serverless. 
         this is why the work yesterday was so important. This gui is both the actual product for the user and the interactive online demo. 
         so the work yesterday, makes this gui self-aware of if its online (serveless) or running offline (localhost server).
         self-aware but not with actual AI. But rather just some simple javascript which looks at the address bar - we've added the following label to the pages that perform this function *[-lookup].html

## [0.0.1-gui.2] - Q4/2020
### Added

### Removed

### Changed
14-Dec - Favicons updated to new Logo design
11-Dec - Docs (for the Apps) poped up with a blue border. Changed to grey to match GUI theme (gui). 
30-Oct - Copied latest GUI design over & Made search splashpage better

### Fixed

## [0.0.1-gui.1] - Q3/2020
20-Sep - The website interactive dashboard demo/ actual dashboard, 
         evolved into the datro consortium page selector, which has evolved into a beta dashboard we now call, gui. 
         A seperate branch has been created for the gui, so the live build and trial can sync to github as a sort of backup. 

### Added
24-Sep - Added some script to stop links functioning if the destination is a 404 e.g. service hasn't started etc

### Removed

### Changed

### Fixed
