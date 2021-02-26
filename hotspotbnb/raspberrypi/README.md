# hotspotbnb-netinst build

In this directory you'll find the resources to build the latest hotspotbnb image using the latest sources. 

## Requirements:
- Two customised subrepo clones exist in this directory: 
`FooDeas/raspberrypi-ua-netinst` and 'Mausy5043/mod-raspberrypi-ua-netinst' 
- and a file containing the name of the prefered repository branch to be used e.g. master

```
  mod-raspberrypi-ua-netinst
  raspberrypi-ua-netinst
  pi-netinst.branch
```

## Instructions

Follow these steps to build the hotspotbnb MicroSD Card .img file, from source:

1. execute the clean script with the command `sudo bash raspberrypi-ua-netinst/cleansh`

2. execute the mod-ua with the command `sudo bash mod-raspberrypi-ua-netinst/mod-ua.sh`
   - a directory should now exist in raspberrypi-ua-netinst called build_dir
   - this directory contains the image, as it will appear on the MicroSD Card

3. copy the custom text files from custom_setting into raspberrypi-ua-netinst/build_dir: 
   - copy the config.txt and cmdline.txt to hbnb-netinst/raspberrypi-ua-netinst/build_dir/bootfs
   - remove line 2 of config.txt and copy again to bnb-netinst/raspberrypi-ua-netinst/build_dir/bootfs/raspberrypi-ua-netinst/config/boot
   - copy the post-install.txt and installer-config.txt to the hbnb-netinst/raspberrypi-ua-netinst/build_dir/bootfs/raspberrypi-ua-netinstall/config directory
   - leave .bashrc and build.sh where they are, inside the custom_settings directory (the firmware will retreive them during bootup). 

4. go into raspberrypi-ua-netinst and run buildroot.sh to build the .img.xz file (for the timezone set in installer-config.txt) 

## Notes

