Loyverse & ScrCpy (LaS)
========================================

User Guide
-----------------

.. image:: images/hardware.png

Welcome to the Loyverse & ScrCpy (LaS) User Guide. 
Contained in this document is clear and helpful information to assist you understand, operate and enjoy LaS. 

Loyverse and ScrCpy (LaS) is a free 'purpose built' software solution that permits the Loyverse EPOS (Android-only) Application to run on older computers which may not support running Android applications e.g. via a virtual environment (the official solution currently being suggested by the Loyverse support team). The current recommended workaround "solution", for non-Android Operating Systems such as Windows and Mac, is not only painfully slow to interact with, but also tedious to configure and complex to operate - not ideal for your average fast paced, service industry businesses e.g. Bars, Restaraunts etc. 

As the title suggests, LaS utalises a software called ScreenCopy (ScrCpy) in order to launch a java interface window, which is not only lightweight but extreamily fast, even on older machines. Android is also hosted on a second 'headless' machine, not the PC. The headless (screenless) machine is a low cost, highly popular Single Board Computer called a Raspberry Pi (RPi). This Raspberry Pi connects to the PC via Ethernet. The Android Operating System, which will run the Loyverse application, also runs on the Raspberry Pi in developer mode, which permits a remote viewing feature to be utalised called Android Debugging. 

So Raspberry Pi is actually running Android (or in this case a customised version entitled LineageOS), with the sole purpose of running the Loyverse Application. Whereas the PC runs Linux (Ubuntu) for bespoke printer and touchscreen LaS scripts to run, then uses the ScrCpy application as a means of remotely viewing and interacting with the Raspberry Pi, Android OS and Loyverse Application. 

The final solution is a desktop icon which upon selection, simulates the Loyverse application is running on the PC, when in fact its running on a seperate machine and is only visible on the PC thanks to the Android Debugging background service and the low-latency ScrCpy java interface.   


Index:

.. toctree::
   :maxdepth: 2
    
   releasenotes
   terminology
   preperation
   gettingstarted
   installation
   productmaint
   troubleshooting
   developers
   


 
   
**Document Author(s):** 
^^^^^^^^^^^^^^^^^^^^^^^^^

===================
Wave Telecom Limited
===================




 
