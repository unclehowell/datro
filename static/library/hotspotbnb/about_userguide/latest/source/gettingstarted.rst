Getting Started Guide
======================

Get HotspotBnB running on any Raspberry Pi.

A) Download the latest release
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

1. Visit 'Latest Releases <https://github.com/unclehowell/datro/releases/>'__ "DATRO Net-Installer Latest Release")
2. Download the latest pre-comiled image (attached in the 'assets' segment at the bottom of the release notes)

  - a point to note about our GitHub releases. Our releases include 'platform' and 'software' release. 
  - 'platform' is primarily all the website (the 'gh-pages' branch). And is recognised by the extesion -rtw (release-to-web)
  - 'software' is primarily all the software (the 'net-installer' branch). And is recognised by the extension -rc (release candidate)

Building from source (Developers)
##################################

1. Grab a local copy of this directory:
   - Git Checkout '/hbnb/arm/' from this 'Net-Installer' Branch is the best and recommended method
   - Or Git Fetch/Clone the whole 'Net-Installer' Branch will get files you don't need, but it's easier
   - Or Git Fetch/Clone or Zip download the entire monorepo is not recommend, since it's tens of gigabytes in size
        - If you need instruction on performing any of the above, visit [Collaborate with the DATRO Net-Installer Branch](https://github.com/unclehowell/datro/blob/net-installer/COLLABORATE.md "Collaborate with the DATRO Net-Installer Branch")
2. Run the following Command: `sudo bash ./compile.sh`
     - this script will produce an upto-date image entitled 'hbnb-latest.img.xz'

B) Burn the image to your Raspberry Pi's MicroSD Card 
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Insert your Pi's MicroSD Card into your laptop/desktop computer
Using your prefered Disk Burning Program, write the image to the Card.

* We recommend [RaspberryPi Imager](https://www.raspberrypi.org/software/ "RaspberryPi Imager") since it supports Windows, Mac & Linux
* Most other softwares do the same job if you prefer not to use RPI Imager e.g. Etcher, Win32 Disk Imager, Gnome Disk Utility etc
* But with RaspberryPi it defaults the format to FAT32, so you can be more sure not to screw up the build using it.

The disk image is now ready to go into your Raspberry Pi (providing the Pi has internet access via Ethernet)

Wireless (Wi-Fi) Support
###########################
If you prefer to power up your Pi and have it connect wirelessly to a Wi-Fi Access point (to establish internet access) then follow these steps:
1. Eject and re-insert the MicroSD Card into your machine
2. Navigate to /raspberrypi-ua-netinst/config/ in your favorate text editor
   - Open the `installer-config.txt` file in Notepad
   - Enter Wi-Fi SSID and Password where instructed and save the file
3. Eject your MicroSD Card - You're ready to proceed

If your using Ethernet(default) make sure your Raspberry Pi is connected via Ethernet to a router that has working internet access.
If your using Wi-Fi make sure your Router is broadcasting Wi-Fi and the SSID/Passwords Match.

C) Power On and Bootup
~~~~~~~~~~~~~~~~~~~~~~~

      - Insert your MicroSD Card into the Pi and apply power.
      - HotspotBnB autonomously installs (over Ethernet/Wi-Fi)
      - Connect to a TV via HDMI to see the progress
      - Your Pi may reboot a few times, this is normal!

D) Accessing the Dashboard
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Once the autonomous build has completed, identify the devices ip address
(shown on your TV Screen, if connected - otherwise scan your network for the IP of the new device)
   - Enter the Pi's IP address into the web browser of any device connected to your local network.
   - Displayed in your web-browser should be the HotspotBnB dashboard.
   - The remainder of the setup can be completed via the dashboard.


Notes
~~~~~~~

Support
########
 - 'Configuring wlan0 with DHCP' can sometimes stick. Reboot your wireless access point then reboot the Pi to clear the problem
 - In the event of an issue, please check you have the latest release, failing that [Report Issues](https://github.com/unclehowell/datro/issues "Report Issues")

Tips 
#####
 - If you're accessing the dashboard from a mobile device (preferably using Chrome web browser) it's recommended you save the page to your devices homescreen, so that you can launch your HotspotBnB Dashboard in the same way you do other apps on your mobile devices.  Locally this will work, but to access the Raspberry Pi remotely you will need to install an application such as Dataplicity (currently being loaded to HotspotBnB's App Store).

Notes 
######
 - This release is only a proof of concept of the autonomous self-build capabilities and a preview of the final solution (so no apps can actually be installed yet). For a disk image with apps pre-installed, please download [HotspotBnB v0.0.1-rc.8](https://mega.nz/#!ZCAziaQb!P4r2FrkY0-bQnDqThiQkY0Da0ORtguYO2tCnO3CO_Ec "HotspotBnB v0.0.1-rc.8")
 - download each new release and repeat this initial installation process to experience the latest developments in near 'real-time' until we introduce our Software/ Firmware Over the Air (OTA) updates/ upgrades.
 - tested and working on all models of the raspberry pi.
 - Users will normally be prompted to accept the terms of the cryptocurrency mining when accessing the dashboard for the first time - an optional and opt-in feature. However this 'JSECoin' feature is still being integrated into HotspotBnB. (If users don't agree and accept the cryptocurrency mining, the banner just remains on the dashboard. We owe no obligation not to inhibit the user experience in this way if they aren't willing to participate in a fair exchange e.g. our software solution for access to your network devices redundant processing power)




