# DATRO Consortium: 'net-installer' Branch: Hotspotβnβ 

Welcome to the Hotspotβnβ Net-Installer Directory.   
The table below displays the content of this directory.  
Basically all of the source code for our autonomous, self-building Hotspotβnβ MicroSD Disk Image.  
You may also notice the compiling of these disk images (source code > img.xz) is a full automated process.  
Just visit the subdirectory corresponding to your target devices architecture and run the `compiler.bash` script.  
Alternatively visit our [Latest Releases](https://github.com/unclehowell/datro/releases/ "DATRO Net-Installer Latest Release") for pre-compiled disk images.  


| Path                      | Details                                                                             |  
|:--------------------------|:------------------------------------------------------------------------------------|  
|[hbnb/arm/](https://github.com/unclehowell/datro/tree/net-installer/hbnb/arm/ "Hotspotβnβ on ARM")  | Hβnβ (ARM e.g. RPi/All Models) Autonomous, Self-Building Disk-Image Source Code     |  
|[hbnb/x86-64/](https://github.com/unclehowell/datro/tree/net-installer/hbnb/x86-64 "Hotspotβnβ on x86-64")  | Hβnβ (x86-64 e.g. Desktop/Laptop) Autonomous, Self-Building (Persistent-Live) USB Disk-Image Source Code  |  


### Other Resources

| Path                      | Details                                                                             |  
|:--------------------------|:------------------------------------------------------------------------------------|  
|[hbnb website](https://github.com/unclehowell/datro/tree/gh-pages/static/hbnb/ "Hotspotβnβ Website Source Code")  | Hβnβ Website Source Code |  
|[hbnb gui](https://github.com/unclehowell/datro/tree/gh-pages/static/gui "Hotspotβnβ GUI Source Code") | Hβnβ GUI |  

Note that the GUI functions as an end-user GUI when installed, but it can also be accessed online where it functions as an online demo.
The online demo actually runs the GUI from the source files directly (using gh-pages), so there's no web-server required. https://datro.xyz/static/gui/
The GUI can also determine if it's installed on the end-users device (client) and when it's being used as an online demo.
This is how it know weather to display the demo apps (online demo) or the actual appstore whereby apps can be installed (client).

This README.md is required in this directory since the wiki refers to this directory and so a README is helpful, rather than seeing just a bunch of code. 
