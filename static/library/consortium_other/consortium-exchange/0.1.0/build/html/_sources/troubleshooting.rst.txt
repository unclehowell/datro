Troubleshooting
=================

Android-RPi Desktop Application Fails to Launch
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

- Ensure the Raspberry Pi is powered up
- Ensure the Micro SD Card is seated correctly 
- Ensure the Ethernet Cable is corrected inserted (in both the Pi and the PC). 
- Reboot
- Relaunch the Desktop Application

Touchscreen Issues/ Interface is Frozen 
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

- Reboot the Machine

After accepting an update or upgrade to the underlying operating systems on the devices may cause mild issues such as screen freezes. 
Again these mild issues can be solved with a reboot. In most cases an upgrade or update won't be performed if it is not compatible with the machines hardware.


Unexpected Event 
~~~~~~~~~~~~~~~~~~~~

**Desktop Application is displaying the Android desktop on launch, not Loyverse application**

This may be a result of the startup manager application on Android being accidently removed. This creates a situation where Loyverse is not automatically opened during power up, which is why when you launch the desktop application it displays Android without the Loyverse application open. Kkeep notes of any changes you decide to make to the defaults, so that your custmisations and changes can be reversed later on if there's a poor consequence.  

**Window displaying Android/ Loyverse closes**

While the service is running you may see a command line window open in the background. If you close this window it closes the window displaying Android/Loyverse automatically because the fate of the two windows are interlinked. Alternatively the Raspberry Pi might have experienced a network failure (the ethernet cable has come loose) or a power loss or system failure has occured. The best resolution in all the instances is to check cables and connectors are properly seated and reboot the machine. 