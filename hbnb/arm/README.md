## Hotspotβnβ Disk Image (Raspberry Pi)

Intructions for getting Hotspotβnβ running on any Raspberry Pi.

### Compile the Disk Image from Source (Linux)

 `sudo bash ./compile.sh`

hbnb-latest.img.xz will be produced after a few minutes!

### Or Download a Pre-compiled Disk Image

Visit [GitHub](https://github.com/unclehowell/datro/releases/ "DATRO on Github").

### Burn the image to your Raspberry Pi's MicroSD Card 

Insert your Pi's MicroSD Card into your laptop/desktop computer
Using your prefered Disk Burning Program, write the image to the Card.

* Recommend [Etcher](https://www.balena.io/etcher/ "Etchers Website") or Gnomes Disk Utility (restore disk image).

### Configure for Ethernet

Do Nothing - The disk image is already configured for the Raspberry Pi to access the web via Ethernet

### Configure for Wi-Fi

To customize the disk image so the Raspberry Pi accesses the web over Wi-Fi, do the following:
   - eject and re-insert the MicroSD Card into your laptop/desktop computer
   - navigate to /boot/raspberrypi-ua-netinst/config and open the `installer-config.txt` file in Notepad
   - follow the instructions in the file to add your existing Wi-Fi's SSID and Password

## Power On and Bootup
   - eject your MicroSD card from your computer, insert it into the Pi and apply power. 
   - hotspotβnβ autonomously installs 
   - connect to a TV via HDMI to see the progress
   - it may reboot a few times, this is normal! 

## Access the Dashboard

Once the autonomous build has completed, identify the devices ip address 
(shown on your TV Screen, if connected - otherwise scan your network for the IP of the new device) 

   - Enter the Pi's IP address into the web browser of any device connected to your local network. 
   - Displayed in your web-browser should be the HotspotBnB dashboard.
   - The remainder of the setup can be completed via the dashboard. 

## Support

In the event of an issue, please check back for latest releases with bug fixes and/or submit an issue on here. 

### Tips 
 - If you're accessing the dashboard from a mobile device (preferably using Chrome web browser) it's recommended you save the page to your devices homescreen, so that you can launch your HotspotBnB Dashboard in the same way you do other apps on your mobile devices.  Locally this will work, but to access the Raspberry Pi remotely you will need to install an application such as Dataplicity (currently being loaded to HotspotBnB's App Store). 

### Notes 
 - This release is only a proof of concept of the autonomous self-build capabilities and a preview of the final solution (so no apps can actually be installed yet). For a disk image with apps working, please use this instead - https://mega.nz/#!ZCAziaQb!P4r2FrkY0-bQnDqThiQkY0Da0ORtguYO2tCnO3CO_Ec
 - download each new release and repeat this initial installation process to experience the latest developments in near 'real-time' until we introduce our Software/ Firmware Over the Air (OTA) updates/ upgrades. 
- tested and working on all models of the raspberry pi. 
 - Users will normally be prompted to accept the terms of the cryptocurrency mining when accessing the dashboard for the first time - an optional and opt-in feature. However this 'JSECoin' feature is still being integrated into HotspotBnB. (If users don't agree and accept the cryptocurrency mining, the banner just remains on the dashboard. We owe no obligation not to inhibit the user experience in this way if they aren't willing to participate in a fair exchange e.g. our software solution for access to your network devices redundant processing power)




