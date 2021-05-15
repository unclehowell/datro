Release Notes and Notices
================================================

This section provides information about what is new or changed, including urgent issues, Software & documentation updates, maintenance and new releases. 

- 'Updates' are the term used to describe significant changes to our public source code 

- Twice daily WaveOS™ will check the source code for scripts which can impliment these changes

- If a change script is flagged as ready, WaveOS™ will retrieve and run it locally

- The last digit(s) of the versions ID will increase to reflect the new update e.g. ``0.0.X``

- Auto-Updates are normally performed every two months

- A reboot and downtime of between 30 seconds and 2 minutes is expected

Version 0.5.0 (Alpha)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 

In this version release our developement team have removed a barrier which requested new users adjust their router's subnet to match Wave's pre-set static IP, before booting up the device for the first time. An issue preventing the Edition from running and subsequently the initial installation from completing was also rectified. 

- 25th Oct 2018: Development of version 0.5.0 begins
- The default IP during initial boot was static. The device will now await to be dynamically assigned and IP by the connected router
- The dynamically assigned IP (& Gateway & DNS) will autonomously convert to a static IP when a ping to 8.8.8.8 succeeds
- To avoid conflicting IP addresses on the network, this process will repeat in the even the connection is lost. 
- 1st December 2018: Release for public download


Older Versions
####################

Below are references to older version releases and release notes: 

.. csv-table:: Table 1.0 - archived versions of WaveOS™
   :file: _static/firmware.csv
   :widths: 20, 20, 20, 20, 20
   :header-rows: 1
   
   
Version 0.4.4
####################

Published in Winter 2018. 500Mb .ISO (150Mb compressed). Lightweight in size & quick to download. Installs and configures autonomously in around 10 minutes during first boot. Now contains a remote updating feature. Some new `issues <#known-and-corrected-issues>`__, still need resolving by next version
   
Version 0.4.0
####################

Published in Summer 2018. The image is much lighter (150Mb). But there were serious faults with this release and it should be disregarded. Possibly due to how we were compiling the image. We introduced PiShrink and brought in someone who was familiar at image compression before releasing another version. A point worth noting is that we are installing DietPi to an SD Card, alter a config file then taking a local copy of the image and compressing it. Which is an around the houses way to go about it we need to address. Perhaps we can fork DietPi, alter the config to use ours then compile it ourself rather than reverse engineering their final build.   


Version 0.3.0
####################

Published in Spring 2018 as proof-of-concept, demonstrating how easily our solution could be downloaded from our website (for free), copied to a Micro SD Card and upon inserSiôn (into any of the 19 million Single Board Computers in circulation) the device and the software operating it would perform as intended, without any programming knowledge or configuration required e.g. completely 'plug & play'. This demonstrated the methodology of quick deployment and scaling internationally. WaveOS™ version 0.1.0 also demostrated how product assembly could occur with a non-skilled/ robotic workforce. Faults with this version release include download time (it's 2GB) and restriction to the exact device type the source ran on. Since it's a snapshot (copy) only, outdates software is actually being transfered, instead of the latest source code being obtained during first boot. There are also many features not included in this image.   
  
  
Known and Corrected Issues
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Below is a table of pending issues which have been reported to our team. 
	These issues will be cleared from this list as and when they are remedied. 

.. csv-table:: Table 1.1 - Known Issues
   :file: _static/issues.csv
   :widths: 10, 10, 20, 60
   :header-rows: 1
   
**Comments** - If connection is lost/ re-established, version 0.5+ will stop services, return to dynamic then change to static (avoiding network conflics). The script required to convert a dynamic address to a static one, after the ethernet is inserted or removed and re-inserted ( ``ifup`` / ``ifdown`` ) must be on the sd card image itself and obviously not a remote location, since there will be no outside connection until said script establishes it

**Comments** - This idea of converting a dynamic IP to a static one should be done in DietPi (DietPi bridges the gap between the Linux Operating System and Wave® Software layer). Their team is also aware of the suggestion since we submitted it via their GitHub repository in early 2018. However Wave® aims to phase out DietPi from its final solution and build itself upon Linux directly. DietPi has been used for bootstrapping and startup only, since it automates many of the functions Wave® depends on and the DietPi team have resolved many of the issues integrating the various 3rd party applications e.g. Emby, Netstats, PiHole etc.

Recently Updated Topics
~~~~~~~~~~~~~~~~~~~~~~~~

Nothing significant to report


