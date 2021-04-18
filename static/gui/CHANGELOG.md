# Changelog    
Developers are expected to log all changes to this directory to this changelog.    
 
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),    
and a combination of [Semantic Versioning](https://semver.org/spec/v2.0.0.html).    
and a combination of [Prince2 Project Management](https://prince2.com).    
 
## [Unreleased]    

## [0.0.1-rtw.10-gui] - Q1/2021    
 
#### Added    
08-Mar - emoncms webapp and interactive online demo    
       - added &embed=1 to the end of the url to hide the bright blue top bar    
       - added min-width:100vw; to html class in appstore.css because it went to about 90vw when the chrome download bar was visible    
03-Mar - added some php script - for net-installer testing    
25-Feb - added Aloshi/EmulationStation as subrepo (app-store/apps/002-002/subrepo) and included alongside it the Hβnβ ES theme folder    
20-Feb - openhab is the only entry in the demo search atm. but the url was missing, so that's been added and now the app search results in the app opening when selected    
20-Feb - added netdata , same methodology as below. port 19999 locally and remotely (remote server, like always, is handled via proxy pass)    
20-Feb - added Althea icon to appstore and demo screen (smarthome) and added the Althea webapp/gui to our public server    
20-Feb - added netflix icon on appstore. It's definately going to need to run inside kodi (accessible via guacamole/webrtc/uv4l etc), just not sure how to go about it all yet:    
         options 1 includes: having a seperate debian (ubuntu on the demo server) and guacamole user, with a seperate kodi/netflix user profile which autologsin when accessed.    
         option 2 includes: not promoting netflix, just having kodi as an app on the app store. And let visitors be suprised that Netflix is installed into it. food for thought right now       
20-Feb - added motioneye app to the public gui / demo and added the webapp to the server with some example camera feeds    
16-Feb - started working on a webapp to showcase emulationstation, with kodi and netflix, big files and work, but end result is worth it    
16-Feb - new webapp on the demo/ public entertainment screen only, not locally. Webapp 002-002. Working to showcase Netflix in kodi, in EmulationStation in Guacamole. Locally it will use UV4l    
12-Feb - Added gamepad app, which I've hosted on a Google Cloud server for now, since its gotta work with emulationstation (which will display with guacamole/uv4l)    
12-Feb - Openhab just release v3.0 which has a ton of new features, and looks better on mobile. So it's been added to the demo/ demo screen for home control    
31-Jan - Added Jellyfin interactive demo    
27-Jan - started to work on app store. app store will be the same for actual gui on localhost webserver and remote online demo. Unlike 'screens' pages, which have seperate demo pages for online.    

#### Changed    
26-Mar - the app icons were stretched (not square) when screen resized. possibly solved it      
12-Mar - jellyfin introduced x-frame option to jellyfin public demo, so we switched to our own server instance of jellyfin      
08-Mar - some code was removed from pages to make them work online and offline. But it seems gh-pages requires the header snippet - so it's being put back    
       - changed some files to .old and back again - because it appears gh-pages didn't build correctly since some links doesn't adhear to the source code - weird!    
07-Mar - removed apps from dashboard. fresh installs shouldn't see apps until the user decided to install them. For the public server there's seperate -demo.html pages.    
03-Mar - dashboard/screen-lookups/* needed simplifying with the same logic as was implimented on the 24th Feb (see below)    
02-Mar - did a `git svn clone` with the HotspotBnB Net Installer and it pulled files, previously removed. Bizzar. So tried to overwrite the remote to fix it.    
25-Feb - changed gameconsole images in emulationstation HBnB themes, to remove unauthorised usage of gaming companies trademarked and copyrighted brands and logos etc    
24-Feb - fetch.html javascript logic was changed from (if '127.' '192.' or 'localhost') to (if NOT 'datro.xyz'). Since the existing logic would fail if the local ip subnet didn't match what was specified. It's easier to just say 'if NOT datro.xyz e.g. online, then presume it's localhosted. Better to change this if the public url changes, that keep adding to it to suite a myriad of local ip addresses and risk user experience.       
20-Feb - made althea logo bigger. And made the fetch file correspond to a dedicated url (althea.bucklerfamilyestate.com), which proxy passes port 3005 to 443 to make the connection secure, in order it can appear within the hotspotbnb dashboard - regardless of x-frame option    
16-Feb - setup a subdomain gamepad.bucklerfamilyestate.com which apache ProxyPasses to port 8089. So now https://gamepad.etc works and should work in the frame because its presented on a secure port    
16-Feb - the gamepad app (port 8089) works on the remote server, but not in the dashboards iframe, perhaps due to no ssl. So I've made the apps server in question, https    
14-Feb - played around with how the apps load, came up with a better solution. Not perfect, just better. Also bug fixed controller screen, the link to the app store wasn't showing.    
14-Feb - housekeeping plus the way the apps (specifically the gamepad) on our server opened, wasn't correct so it didn't work. Changed it to use onclick instead of href.      
14-Feb - housekeeping, mainly search is now fallen into how and where it should be as a screen (001) as appose to a stray page in the top direction.    
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
29-Mar - fixed broken link to files in the openhab doc (demo) since the target file was moved      
25-Mar - webcache wasn't working. found solution by comparing sourcecode from when it was. a simple fix      
08-Mar - gamepad demo screen wasn't loading remotely, sorted it. EmulationStation now removed from demo screen, but kept in appstore      
21-Feb - the search results on the demo search pages wasn't working - look like the actual search pages were showing on the public demo too, not the demo search pages      
20-Feb - style.css for 005-002 (netdata) was a template one, needed updating. Fixed it!      
19-Feb - minor edit, broken link in the docs page.      
16-Feb - the G.ES.K.N (guacamole, emulationstation,kodi,netflix) fetch file was wrong, it pointed to the gamepad app. corrected it      
16-Feb - search wasn't searching. Jquery issues, fixed      
12-Feb - entertainment screen wasn't loading, fixed the bug      
12-Feb - removed some buggy css from all pages e.g. body{opacity: 0.9;transition: opacity 2s; -webkit-transition: opacity 2s; /* Safari */}      
         it may have been buggy because in a lot of pages it didn't have an opening bracket where one should have been.      

#### Removed      
14-Mar - removed old images from app-store and dashboard img or /media/img files. It was making the svn checkout bigger than it needed to be      
03-Mar - removed subrepos. Decided on creating a seperate branch for subrepo's      
02-Mar - had to remove a .svn because it caused an error when running `svn checkout` on a local machine (featured in the HotspotBnB Build script)      
15-Feb - removed CNAME from static/gui, it wasn't correect anyway. only downside having there, can't see any upside.      
 
### ISSUES,RISKS,CONCERNS    
19-Feb - our server hosting our webapps has issues. Working to resolve.      
12-Feb - Because of the screen-selector solution that has been implimented the backspace doesn't work in some cases.      
12-Feb - Browser cache doesn't appear to be storing the title change when offline.      
 
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
