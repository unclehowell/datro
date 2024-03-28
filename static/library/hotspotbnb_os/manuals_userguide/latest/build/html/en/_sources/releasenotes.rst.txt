Release Notes and Notices
===============================

This section provides information about what is new or changed, including urgent issues, documentation updates, maintenance, and new releases.
- 'Updates' are the term used to describe significant changes to our public source code and/or records.  
 

This Release (0.0.6)
~~~~~~~~~~~~~~~~~~~~~

2021-09-08 - `This document hasn't been updated in around 2 years, a lot has changed. Scheduled to be updated thoroughly soon`



Older Versions
####################

In the table below the last entry displays a link to an archived copy of the last report.
To keep the filename from overflowing in the table below the name displayed may differ from the file name.
The date the file was archived will differ from the date of the document label, which is its creation date.
If you're viewing this document on a subdomain of `.datro.world` you may need to right-click and select 'open link in new tab`.
In the interim of a bug fix, you can avoid right-clicking all together, by viewing our document library at its original location `datro.xyz/static/library <https://datro.xyz/static/library>`__


.. csv-table:: Older Versions of this Document
   :file: _static/olderversions.csv
   :widths: 20, 20, 20, 40
   :header-rows: 1




Version 0.0.5
###############

In this version release our developement team have removed a barrier which requested new users adjust their router's subnet to match Wave's pre-set static IP, 
before booting up the device for the first time. An issue preventing the Edition from running and subsequently the initial installation from completing was also rectified.

- 25th Oct 2018: Development of version 0.5.0 begins
- The default IP during initial boot was static. The device will now await to be dynamically assigned and IP by the connected router
- The dynamically assigned IP (& Gateway & DNS) will autonomously convert to a static IP when a ping to 8.8.8.8 succeeds
- To avoid conflicting IP addresses on the network, this process will repeat in the even the connection is lost.
- 1st December 2018: Release for public download


Version 0.0.4
################

Published in Summer 2018. The image is much lighter (150Mb). But there were serious faults with this release and it should be disregarded. 
Possibly due to how we were compiling the image. We introduced PiShrink and brought in someone who was familiar at image compression before releasing another version. 
A point worth noting is that we are installing DietPi to an SD Card, alter a config file then taking a local copy of the image and compressing it. 
Which is an around the houses way to go about it we need to address. Perhaps we can fork DietPi, 
alter the config to use ours then compile it ourself rather than reverse engineering their final build.
   

Version 0.0.3
################

Published in Spring 2018 as proof-of-concept, demonstrating how easily our solution could be downloaded from our website (for free), 
copied to a Micro SD Card and upon inserSiôn (into any of the 19 million Single Board Computers in circulation) the device and the software operating it would perform as intended, 
without any programming knowledge or configuration required e.g. completely 'plug & play'.
This demonstrated the methodology of quick deployment and scaling internationally. 
HotspotBnB version 0.1.0 also demostrated how product assembly could occur with a non-skilled/ robotic workforce.
Faults with this version release include download time (it's 2GB) and restriction to the exact device type the source ran on. 
Since it's a snapshot (copy) only, outdates software is actually being transfered, instead of the latest source code being obtained during first boot. 
There are also many features not included in this image.   


Known and Corrected Issues
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Below is a table of pending issues that have been reported to our team.
These issues will be cleared from this list as and when they are remedied.


.. csv-table:: Known Issues
   :file: _static/issues.csv
   :widths: 10, 15, 15, 60
   :header-rows: 1




