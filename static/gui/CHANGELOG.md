# Changelog
Developers are expected to log all changes to this directory to this changelog.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and a combination of [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
and a combination of [Prince2 Project Management](https://prince2.com).

## [Unreleased]

## [0.0.1-gui.3] - Q1/2021

### Plan this Quarter/Version

Just constant never ending improvements of GUI, as seen fit

### Performance

#### Added
12-Feb - Added gamepad app, which I've hosted on a Google Cloud server for now, since its gotta work with emulationstation (which will display with guacamole/uv4l)
12-Feb - Openhab just release v3.0 which has a ton of new features, and looks better on mobile. So it's been added to the demo/ demo screen for home control
31-Jan - Added Jellyfin interactive demo
27-Jan - started to work on app store. app store will be the same for actual gui on localhost webserver and remote online demo. Unlike 'screens' pages, which have seperate demo pages for online. 

#### Changed
14-Feb - Started messing with an email capture form with the online demo. Better to insist on mailchain or something instead, using a blockchain method, so will hold off. 
12-Feb - added category icons and hyperlinks to the splashpage for less clickthrough & minor bug fixes and housekeeping. 
10-Feb - minor edit to search page to speed up its page load time. See issues, risks concerns about this too - still outstanding work here
01-Feb - minor change to controllers screen - not the demo, the actual one - it was showing entertainment app (jellyfin).
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

#### Fixed
12-Feb - entertainment screen wasn't loading, fixed the bug
12-Feb - removed some buggy css from all pages e.g. body{opacity: 0.9;transition: opacity 2s; -webkit-transition: opacity 2s; /* Safari */}
         it may have been buggy because in a lot of pages it didn't have an opening bracket where one should have been. 

### Issues, Risks, Concerns

12-Feb - Because of the screen-selector solution that has been implimented the backspace doesn't work in some cases.
12-Feb - Browser cache doesn't appear to be storing the title change when offline.  

### Plan for Next Quarter/Version

00-Apr - Make browser back button work - perhaps have the screen-selector java work within the origin page, instead of its own page which is adding the extra step (which you can go back to, since it takes you forward again) 

## [0.0.1-gui.2] - Q4/2020

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
