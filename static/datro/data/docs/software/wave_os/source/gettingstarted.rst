Getting Started Guide
======================

hyperlink
~~~~~~~~~

Hyperlink `here <http://ArchLinuxarm.org/platforms/armv6/raspberry-pi>`__, 

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

.. list-table:: Title
   :widths: 25 25 50
   :header-rows: 1

   * - Heading row 1, column 1
     - Heading row 1, column 2
     - Heading row 1, column 3
   * - Row 1, column 1
     -
     - Row 1, column 3
   * - Row 2, column 1
     - Row 2, column 2
     - Row 2, column 3

	 
	 