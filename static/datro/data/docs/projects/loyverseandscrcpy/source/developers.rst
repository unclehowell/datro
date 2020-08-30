Developers
===========

Introduction 
~~~~~~~~~~~~~

The source code for the Wave Operating System can be found by visiting Github at this repo  `unclehowell/waveos <https://github.com/unclehowell/WaveOS>`__, 

A downloadable image will be made avaliable from datro.xyz, which can be easily copied to portable storage devices (MicroSD Card & USB) so the End-User can be up and running in seconds. But at this stage we are only offering the solution as a manually built process, which in summary goes as follows:

Step 1. Install LineageOS to the Raspberry Pi and using a HDMI display and keyboard/mouse enable developer mode and Debugging, install Loyverse and a StartUp App (and configure to make Loyverse boot on startup).  Then disable the Wi-Fi and connect the Raspberry Pi to the PC via Ethernet. 

Step 2. Install Ubuntu to the PC and ensure all display, touchscreen & networking drivers etc are installed. 

Step 3. Share the PC´s Wireless connection to the ethernet port and take note of the IP address it assigns the RPi. 

Step 4. Install scrcpy and all its dependancies (snap etc). Install using snap for automated install. 

Step 5. Put this script into /etc/profile.d and call it ``launcher.sh``, remembering to use the RPi IP and/or adb devices output. The example IP in this sample script is ``10.42.0.52``. 


Sample Script
---------------

::

    # restart all network adaptors
    sudo service network-manager restart &&
    sleep 4 &&
    # share the PC´s Wi-Fi to its Ethernet Port
    nmcli c modify netplan-enp1s8 ipv4.method shared &&
    sleep 4 &&
    # connect the adb service to Android - * ideally we want to explore ´adb device > .txt´ at this juncture
    #incase a different IP address is assigned  
    sudo adb connect 10.42.0.52:5555  &&
    # match the screensizes - again we may want to explore ´randr --listdisplays > .txt´ here
    # incase the users changed the PC´s default display dimensions 
    adb shell wm size 1024x768 &&
    # launch scrcpy at a rate that will run smooth and fullscreen
    sudo scrcpy -b2M -m800 -f 

Step 6. Give the script root permissions with the command ``sudo chmod +x launcher.sh``

Step 7. Create a .desktop icon to launch the script. Here´s a sample: 

.desktop icon
---------------

::

    #!/usr/bin/env
    [Desktop Entry]
    Icon=/home/onelove/Pictures/icons/icon.png
    Categories=Utility;Application;
    Comment=use CTL + F to escape fullscreen
    Exec=/etc/profile.d/launcher.sh
    Name[en_US]=Android-RPI3
    Name=CTL + F to escape fullscreen
    Terminal=true
    Type=Application




