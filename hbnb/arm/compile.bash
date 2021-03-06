#! /bin/bash

#unset CDPATH

#.......................................................
#            2021 Copyleft - DATRO Consortium
#.......................................................
#         DATRO Document Library by Unclehowell
#.......................................................
#                   https://datro.world/
#.......................................................
#                       Version 0.1
#.......................................................

function ProgressBar {
	let _progress=(${1}*100/${2}*100)/100
	let _done=(${_progress}*4)/10
	let _left=40-$_done
	_done=$(printf "%${_done}s")
	_left=$(printf "%${_left}s")
	printf "\rProgress : [${_done// /#}${_left// /-}] ${_progress}%%"
}

_start=1
_20=20
_40=40
_60=60
_80=80
_end=100

printf "\n\e[2;4;33m${PWD#${PWD%/*/*/*}/} ... is building!\e[0m\n"

printf "\n\e[2;3;33m Step 1 of 5. Installing Dependancies \n\e[0m\n"
for number in $(seq ${_start} ${_20})
do
        sleep 0.1
        ProgressBar ${number} ${_end}
done

sudo apt-get install git curl bzip2 zip xz-utils gnupg kpartx dosfstools binutils bc &&
printf "\e[2;3;33m Step 1 Complete! \n\e[0m"

printf "\n\e[2;3;33m Step 2 of 5. Fetching latest files \n\e[0m\n"
for number in $(seq ${_20} ${_40})
do
	sleep 0.1
	ProgressBar ${number} ${_end}
done

rm -rf raspberrypi-ua-netinst &&
rm -rf hbnb-latest.img.xz &&
mkdir -p raspberrypi-ua-netinst &&
cd raspberrypi-ua-netinst &&
rm -rf .git &&
sudo git init &&
sudo git remote add origin https://github.com/FooDeas/raspberrypi-ua-netinst.git &&
sudo git pull origin master &&

printf "\e[2;3;33m Step 2 Complete! \n\e[0m"
printf "\n\e[2;3;33m Step 3 of 5. Producing the Build_Dir \n\e[0m\n"

for number in $(seq ${_40} ${_60})
do
        sleep 0.1
        ProgressBar ${number} ${_end}
done

sudo bash ./clean.sh &&
sleep 0.1 &&
sudo bash ./update.sh &&
sleep 0.1 &&
cp -r ../custom-settings/{installer-config.txt,post-install.txt} config/ &&
cp -r ../custom-settings/my-files.txt config/ &&
cp -r ../custom-settings/{config.txt,cmdline.txt,ssh} config/boot/ &&

mkdir -p config/files/home/pi/ &&
cp -r ../custom-settings/.bashrc config/files/home/pi/ &&

mkdir -p config/files/etc/init.d/ &&
cp -r ../custom-settings/build.sh config/files/etc/init.d/ &&

sed -i 's/set -e # exit/#set -e # exit/g' build.sh &&
sudo bash ./build.sh &&

printf "\e[2;3;33m Step 3 Complete! \n\e[0m"
printf "\n\e[2;3;33m Step 4 of 5. Prep & Build hbnb-latest.img.xz \n\e[0m\n"
for number in $(seq ${_60} ${_80})
do
       sleep 0.1
       ProgressBar ${number} ${_end}
done

sed -i 's/compress_bz2=1/compress_bz2=0/g' buildroot.sh &&
sed -i 's/set -e/#set -e/g' buildroot.sh &&
echo 'exit 1' >> buildroot.sh &&
sudo bash ./buildroot.sh &&

printf "\e[2;3;33m Step 4 Complete! \n\e[0m"
printf "\n\e[2;3;33m Step 5 of 5. Quick Clean Up  \n\e[0m\n"
for number in $(seq ${_80} ${_end})
do
    sleep 1
    ProgressBar ${number} ${_end}
done

rm -rf *.zip &&
mv *.img.xz ../hbnb-latest.img.xz &&
cd .. &&
rm -rf raspberrypi-ua-netinst &

printf "\e[2;3;33m Finished! \n\e[0m\n" &&
exit 0
