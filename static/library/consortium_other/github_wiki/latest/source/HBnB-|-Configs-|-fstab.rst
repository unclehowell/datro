HBnB > Configs > fstab
------------------------------------------------------------------------
If the MicroSD Card corrupts, use fsck/ dosfsck. 

1. Place it into a Linux machine
2. Get device location with this command `lsblk` e.g. # /dev/sdb
3. Check for errors with this command `sudo dosfsck -w -r -l -a -v -t /dev/sdb1`
3. This command also works `sudo fsck -y /dev/sdb1`
