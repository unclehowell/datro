Manual Build Process (All Devices)
=======================================

Intro
###############

WaveOS (Version 0.6.x - branch a) is based on the Raspbian Stretch Lite OS. This will be the base OS for all hardware variations of the Wave Smart Home Hotspot e.g. LTE, 5G etc 


Step 1: Preperation
############################

a) Download the latest version of Raspbian Stretch Lite from [Raspberrypi.org](https://www.raspberrypi.org/downloads/raspbian/).


b) Copy the latest copy of Raspbian Stretch Lite to the MicroSD Card using a program like [Etcher](https://www.balena.io/etcher) or [Win32 Disk Imager](https://sourceforge.net/projects/win32diskimager).


c) Insert the MicroSD Card into your device and connect the keyboard. Connect the device to a display e.g. via HDMI (making sure the display is turned on before applying the power cord) 



# Ensure your device has a heatsink, since it will be overclocked and running at maximum capacity a lot of the time. 
# Ensure the power supply is the correct recommended voltage and current for the device. 
# Ensure the quality of the MicroSD Card (and the Power and HDMI cord) are the best quality possible.


Step 2: Wi-Fi, SSH & Update/Upgrade
########################################################

a) Once the Pi has booted up, login with the default username and password :

		``Username: pi``
		
		``Password: raspberry``
		
b) Then enter setup in order to enable SSH and connect to another Wireless Hotspot e.g. your Cellular dongle Hotspot :

		``sudo raspi-config``

c) Via your connected display ( or a remote SSH terminal client over Wi-Fi e.g. [Putty](https://www.putty.org/) ) you must update and upgrade the OS :

		``sudo apt-get update && sudo apt-get upgrade -y``
		
		``sudo rpi-update``
		
d) Reboot the system :

		``sudo shutdown -r now``
		

Step 3: Cellular to Wi-Fi
############################

This segment explains how to obtain internet access from the cellular dongle over USB and then enable a Wireless Access Point using the Raspberry Pi's onboard Wi-Fi. 
Before proceeding with the steps below, the device should already be connected to the internet via Ethernet or using the onboard Wi-Fi to connect to another Wireless Hotspot. 


1st - Cellar over USB
--------------------------------------------------------

a) Install the software with these commands :

		``sudo apt-get update``
		
		``sudo apt-get install ppp usb-modeswitch wvdial``

b) Poweroff the system with the following command :

		``sudo poweroff``

c) Once the system has powered off, Connect the cellular dongle via USB then reboot. 


2nd - Wi-Fi Access Point
--------------------------------------------------------

For the Wireless Access Point we will be using [RaspAP](https://github.com/billz/raspap-webgui).
This application is ideal, since it features a user interface so the end-user can change the Access Point Name and Password.  
And the best thing is, RaspAP is now a one-line installation now. 

	  ``wget -q https://git.io/voEUQ -O /tmp/raspap && bash /tmp/raspap``
		
To see the default SSID and password, please refer to the GitHub page above. 
Then access the UI ( http://10.3.141.1/ - username/password = admin, secret) and set the Wave SSID and password. 

	 ``#SSID: Wave-Hotspot``
		
	 ``#Password: makeitwave2020!!``

The system should now be receiving internet from the USB and broadcasting it as a Wireless Hotspot Access Point.  


Step 4: Emulation Station
############################

This segment explains how to install the Emulation Station Gaming System. 


1st - Set the minimum amount of RAM to the GPU
--------------------------------------------------------

	  ``sudo nano /boot/config.txt``
  
	  ``# add or replace "gpu_mem = 32"``
	  
	  ``# if you skip this step, you will probably get "out of memory" errors when compiling``
	  ``# Reboot to apply GPU RAM changes``


2nd - Install Dependencies
---------------------------------------------------------

	``sudo apt-get install -y libboost-system-dev libboost-filesystem-dev libboost-date-time-dev libboost-locale-dev libfreeimage-dev libfreetype6-dev libeigen3-dev libcurl4-openssl-dev libasound2-dev cmake libsdl2-dev``


3rd - Compile and Install
---------------------------------------------------------

	 ``git clone https://github.com/Aloshi/EmulationStation``
	  
	 ``cd EmulationStation``
	  
	 ``mkdir build``
	  
	 ``cd build``

	 ``# On the RPi 2, you may need to add "-DFREETYPE_INCLUDE_DIRS=/usr/include/freetype2/".``
	 
	 ``# See issue #384 on GitHub for details.``
		
	 ``cmake ..``

	 ``# you can add -j2 here to use 2 threads for compiling in parallel (depending on how many cores/how much memory your RPi has)``
	
	 ``make -j2``
	
     ``#If you want to install emulationstation to /usr/local/bin/emulationstation, which will let you just type 'emulationstation' to run it, you can do:``

	 ``sudo make install``
		
NOTE: This will conflict with RetroPie, which installs a bash script to /usr/bin/emulationstation.
Otherwise, you can run the binary from the root of the EmulationStation folder:

	 ``../emulationstation``

4th - Reset GPU RAM and Reboot
---------------------------------------------------------

	 ``sudo nano /boot/config.txt``
	
	 ``# change/add "gpu_mem = 32" to "gpu_mem = 128" or "gpu_mem = 256", depending on your Pi model``
	 
	 ``sudo reboot``
		
	
		
