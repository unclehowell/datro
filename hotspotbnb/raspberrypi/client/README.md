# HotspotBnB Client Directory

## Introduction

This 'client' directory holds everything required to produce a HotspotBnB client. 
A client is definied as physical Single Board Computer (SBC) Device e.g. Raspberry Pi 0,II,III,IIII etc
In order for an SBC to become a HotspotBnB Client, is must first be able to operate the HotspotBnB Firmware. 

Once the setup process is complete (30 minutes of fully-autonomous installation) a person, tech savvy enough to operate a smartphone, 
may benefit from use and enjoyment of HotspotBnB e.g. applications, feature/ security updates and upgrades etc. 

## The Basics

Anyone can visit github.com/unclehowell/hbnb and navigate to the latest release to get the pre-build img file for their SBC's MicroSD Card. 
The workflow to produce these SDCard images (for testing and developing or for public use) is equally as straightforward:

a. Obtain a copy of this source code, using any of the following methods: 
 -  `svn checkout` command (install `subversion` beforehand)
 -  'git sparse-checkout' command (install 'git' v2.5+ beforehand). 

(It is not recommended you try to take a copy of the entire monorepo, by downloading from the github.com as a zip file or using git clone.
The reason for this is that this monorepo could be tens of gigabytes, so only take (and put back, if improved) what you absolutely need)  

To navigate and understand this directory it is important to note that this folder contains 2 key sub-directories. 
Before we explain them, it's also worth noting that these are also 'subrepo's' e.g. they share a special link to their own source of origin.
Subrepo's allow  

 - 'hbnb-netinst' : This sub-directory contains the resources to autonomously-build the autonomous-self-building MicroSD Card image:

     - the 'custom-settings' directory contains text files for the main underlying settings e.g. timezones, languages etc
     - the 'mod-raspberrypi-ua-netinst' directory is a neat project, designed to make the generation of the MicroSD Card image, easier
         - contained within this directory is the script file we run to autonomously generate the content files for the MicroSD Card image 
     - the 'raspberrypi-ua-netinst' directory is the founding father of this autonomous-self-build solution
         - contained within this directory is the sciprt file we run to autonomously compile the content into a single MicroSD Card image file
 
 - 'html' : This sub-directory contains the graphical user interfaces, giving the end-users a friendly way to interact with their device.    
     - the 'dashboard' directory contains the basic user (web) interface files e.g. css, js, html,img etc
     - the 'appstore' directory also contains similar files, but with the addition of some script files (.cgi)

The workflow to produce a new software release (for testing and developing or public use) is as follows: 

   
