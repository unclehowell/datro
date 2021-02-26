# mod-raspberrypi-ua-netinst

Holds the custom files that I need to build my own image of [`FooDeas/raspberrypi-ua-netinst`](https://github.com/FooDeas/raspberrypi-ua-netinst).

## Functionality
This repository allows me to build a custom version of the `FooDeas/raspberrypi-ua-netinst` installer without the need of having to maintain a separate branch of that repo. I just `clone` the installer repo locally together with a clone of this mod-repo. 
This application then takes care that any custom changes that I need are inserted into the installer wherever I need them. 
It then builds the installer for me. For modifications that need to wait until the installed system is booted for the first time my `raspboot` repository can be used.

## Requirements:
- A clone of the repository `FooDeas/raspberrypi-ua-netinst` is present in the same directory as where this repository resides:

```
  mod-raspberrypi-ua-netinst
  pi-netinst.branch
  raspberrypi-ua-netinst
```
- The file `../pi-netinst.branch` contains the name of the branch to be used. E.g.:

```
  user@host:~/mod-raspberrypi-ua-netinst$ cat ../pi-netinst.branch
  master
```

## Installing
1. Clone [`FooDeas/raspberrypi-ua-netinst`](https://github.com/FooDeas/raspberrypi-ua-netinst) from GitHub
2. Clone [`Mausy5043/mod-raspberrypi-ua-netinst`](https://gitlab.com/mausy5043-installer/mod-raspberrypi-ua-netinst.git) from GitLab
3. `echo "master" > pi-netinst.branch   # this defines the branch to be used`

## Usage
1. `cd mod-raspberrypi-ua-netinst`
2. `./mod-ua.sh <hostname>`
3. the rest is automatic:
  - The repos are updated to the current version and the chosen branch is selected.
  - Files contained in the directory `overlay` are copied to the `raspberrypi-ua-netinst` directory.
  - The raspberrypi-ua-netinst image is built by executing the `clean.sh`, `update.sh` and `build.sh`.
  - Attention: If `buildroot.sh` is required, then this needs to be done manually.
