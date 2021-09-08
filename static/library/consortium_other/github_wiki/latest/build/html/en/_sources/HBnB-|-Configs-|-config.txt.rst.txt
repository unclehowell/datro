HBnB > Configs > config.txt
------------------------------------------------------------------------
Below is where you'll find the default config.txt - Although looking at this, this isn't it - so don't depend on it. 

```
disable_splash=1
display_default_lcd=0
disable_overscan=1
hdmi_force_hotplug=1
hdmi_ignore_edid=0xa5000080
hdmi_drive=2
config_hdmi_boost=4
dtparam=i2c_arm=on
dtparam=audio=on
gpu_mem_256=128
gpu_mem_512=256
gpu_mem_1024=384
gpu_mem_2048=512
gpu_mem_4096=512

[pi3]
program_usb_boot_mode=1
enable_uart=1

[pi4]
dtoverlay=vc4-fkms-v3d
max_framebuffers=2

[all]
dtoverlay=vc4-fkms-v3d

```
