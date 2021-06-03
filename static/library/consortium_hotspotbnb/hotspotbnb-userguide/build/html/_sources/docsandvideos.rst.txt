PDF's & Video's
===============

hyperlink
~~~~~~~~~

Hyperlink `here <https://ArchLinuxarm.org/platforms/armv6/raspberry-pi>`__, 

command lines
~~~~~~~~~~~~~~~~~

like this: ``192.168.0.x``, ``10.0.0.14x`` or 

Enough of networking for now. We'll set a proper network configuration later in this guide, but first some *musthaves*.


text block
-----------

::

    passwd  # change root password to something important
    rm -rf /etc/localtime  # dont care about this
    ln -s /usr/share/zoneinfo/Europe/Prague /etc/localtime  # set appropriate timezone
    echo "my_raspberry" >  /etc/hostname  # set name of your RPi

    useradd -m -aG wheel -s /usr/bin/bash common_user # 
    groupadd webdata  # for sharing
    useradd -M -aG webdata -s /usr/bin/false nginx
    usermod -aG webdata common_user

    visudo  # uncomment this line:  %wheel ALL=(ALL) ALL

    pacman -Syu 


**bold text**

-  bullet
-  point


