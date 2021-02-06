#! /bin/bash

BRANCH="../pi-netinst.branch"

# Check if `pi-netinst.branch` file exists
# This file contains the name of the branch that should be used.
if [ ! -e $BRANCH ]; then
  echo "!!! Could not find $BRANCH"
  echo "    This file should contain the name of the branch to be used."
  echo "    Both the branchname of raspberrypi-ua-netinst and the branchname of mod-raspberrypi-ua-netinst must be the same."
  exit 1
fi
BRANCH=$(cat $BRANCH)

echo ""
echo ""
echo ""
echo "**************************************************"
echo "*** Updating the MOD-RASPBERRYPI-UA-NETINST files*"
echo "**************************************************"
echo ""
echo ""
echo ""
git pull
git fetch origin
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH" && git clean -f -d
chmod +x ./*.sh
