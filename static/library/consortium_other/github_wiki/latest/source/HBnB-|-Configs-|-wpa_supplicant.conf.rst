HBnB > Configs > wpa_supplicant.conf
======================================================

1. Create `wpa_supplicant.conf` in the `/boot/` directory using this command:

  `sudo nano wpa_supplicant.conf`

2. Past this text below into the file and fill out the Country Code, SSID & PSK:

```
country=US
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

 network={
    ssid="NETWORK-NAME"
    psk="NETWORK-PASSWORD"
 }
```

3. Then `CTL-X` then `Y` then `ENTER` to save the file. 

4. `umount ./` to unmount
