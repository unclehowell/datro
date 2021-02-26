#! /bin/bash

WIFI=false
CLIENT="raspberrypi"
NETINST="../raspberrypi-ua-netinst"
BRANCH="../pi-netinst.branch"
WPA="../wpa.conf"

GOPTS=$(getopt -n 'mod-ua.sh' -o n:w --long name:,wifi -- "$@")
if [ $? != 0 ] ; then echo "!!! Failed parsing options." >&2 ; exit 1 ; fi
eval set -- "$GOPTS"

while true; do
  case "$1" in
    -w | --wifi ) WIFI=true; shift ;;
    -n | --name ) CLIENT="$2"; shift; shift ;;
    -- ) shift; break ;;
    * ) break ;;
  esac
done

# Check if the `raspberrypi-ua-netinst` directory is present.
if [ ! -d $NETINST ]; then
  echo "!!! A clone of raspberrypi-ua-netinst could not be found." >&2
  exit 1
fi

# Check if `pi-netinst.branch` file exists
# This file contains the name of the branch that should be used.
if [ ! -e $BRANCH ]; then
  echo "!!! Could not find $BRANCH" >&2
  echo "    This file should contain the name of the branch to be used."
  echo "    Both the branchname of raspberrypi-ua-netinst and the branchname of mod-raspberrypi-ua-netinst must be the same."
  exit 1
fi
BRANCH=$(cat $BRANCH)


echo ""
echo ""
echo ""
echo "Settings being used:" | tee >(logger -t mod-raspberry)
echo "Wi-fi=$WIFI" | tee >(logger -t mod-raspberry)
echo "Name=$CLIENT" | tee >(logger -t mod-raspberry)
echo "Branch=$BRANCH" | tee >(logger -t mod-raspberry)
echo ""

echo ""
echo ""
echo ""
echo "**************************************************"
echo "*** Updating the RASPBERRYPI-UA-NETINST files ****" | tee >(logger -t mod-raspberry)
echo "**************************************************"
echo ""
pushd $NETINST/
  git pull
  git fetch origin
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH" && \
  git clean -f -d
popd

echo ""
echo ""
echo ""
echo "**************************************************"
echo "*** Putting modifications in place ***************" | tee >(logger -t mod-raspberry)
echo "**************************************************"
echo ""
cp -rv ./overlay/* $NETINST/
if [ "$WIFI" == true ]; then
  echo "   ...adding wpa_supplicant.conf to installer!"
  echo "ifname=wlan0"           >> $NETINST/config/installer-config.txt
  echo "drivers_to_load=8192cu" >> $NETINST/config/installer-config.txt
  cp -rv $WPA $NETINST/config/wpa_supplicant.conf
fi

# try to fix build.sh

fnd="\ config"
rpl="\ \.\.\/config"
sed -i "s/${fnd}/${rpl}/" $NETINST/build.sh

echo ""
echo ""
echo ""
echo "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
echo "@@@ Building RASPBERRYPI-UA-NETINST image @@@@@@@@" | tee >(logger -t mod-raspberry)
echo "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
echo ""
pushd $NETINST/
  # change the hostname in the default installer-config.txt
  sed -i "s/raspberrypi/${CLIENT}/" ./config/installer-config.txt
  echo ""
  echo ""
  echo ""
  echo "**************************************************"
  echo "*** Cleaning the installer ***********************" | tee >(logger -t mod-raspberry)
  echo "**************************************************"
  echo ""
  ./clean.sh || exit 1

  echo ""
  echo ""
  echo ""
  echo "**************************************************"
  echo "*** Updating the installer packages **************" | tee >(logger -t mod-raspberry)
  echo "**************************************************"
  echo ""
  ./update.sh || exit 1

  echo ""
  echo ""
  echo ""
  echo "**************************************************"
  echo "*** Building the installer ***********************" | tee >(logger -t mod-raspberry)
  echo "**************************************************"
  echo ""
  # We don't need the zip file
  sed -i 's/cd bootfs && zip/#not zipping#/' ./build.sh
  sed -i '/#not zipping#/{n;s/.*/#############/}' ./build.sh
  ./build.sh || exit 1
  # By default don't `./buildroot`
  #./buildroot.sh

  # At the end we don't `./clean.sh` so we can use the files in `./bootfs/` directly.
popd
