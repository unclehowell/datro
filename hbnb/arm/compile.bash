#! /bin/bash

#unset CDPATH

#.......................................................
#            2021 Copyleft - DATRO Consortium
#.......................................................
#         DATRO Document Library by Unclehowell
#.......................................................
#                   https://datro.world/
#.......................................................
#                  V0.0.1-rc.9-hbnb-arm.05
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
rm -rf *.xz &&
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
sudo bash ./update.sh &&

#sudo mkdir -p config/files/boot/
sudo mkdir -p config/root/home/pi/ &&
sudo mkdir -p config/root/etc/init.d/ &&
#sudo mkdir -p config/files/home/pi/ &&
#sudo mkdir -p config/files/etc/init.d/ &&
sudo mkdir -p config/files/root/home/pi/ && #keep
sudo mkdir -p config/files/root/etc/init.d/ && #keep
#sudo mkdir -p config/etc/init.d/ &&
#sudo mkdir -p config/home/pi/ &&

cp -p ../custom-settings/config/{installer-config.txt,my-files.list,post-install.txt,custom_files.txt} config/ &&
cp -p ../custom-settings/config/boot/{cmdline.txt,ssh,config.txt} config/boot/ && #keep config.txt yes. other two aren't in build
#cp -p ../custom-settings/config/etc/init.d/build.sh config/etc/init.d/ &&
#cp -p ../custom-settings/config/home/pi/.bashrc config/home/pi/ &&
cp -p ../custom-settings/config/files/{installer-config.txt,my-files.list,post-install.txt,custom_files.txt} config/files/ &&
#cp -p ../custom-settings/config/root/{installer-config.txt,my-files.list,post-install.txt,custom_files.txt} config/root/ &&
cp -p ../custom-settings/config/root/home/pi/.bashrc config/root/home/pi/ && #keep
cp -p ../custom-settings/config/root/etc/init.d/build.sh config/root/etc/init.d/ && #keep
#cp -p ../custom-settings/config/files/home/pi/.bashrc config/home/pi/ &&
#cp -p ../custom-settings/config/files/etc/init.d/build.sh config/etc/init.d/ &&
#cp -p ../custom-settings/config/files/boot/{cmdline.txt,ssh,config.txt} config/files/boot/ &&
#cp -p ../custom-settings/config/files/root/{installer-config.txt,my-files.list,post-install.txt,custom_files.txt} config/files/root/ &&
#cp -p ../custom-settings/config/files/root/home/pi/.bashrc config/files/root/home/pi/ &&
#cp -p ../custom-settings/config/files/root/etc/init.d/build.sh config/files/root/etc/init.d/ &&

sed -i 's/set -e # exit/#set -e # exit/g' build.sh &&
sleep 0.1 &&
echo "running the build, may take a few minutes to begin" &&
sudo bash ./build.sh &&
echo "quick break before mkdir build_dir/tmp/home/pi" &&
sleep 15 &&

#sudo mkdir -p build_dir/tmp/home/pi/ &&
#sudo mkdir -p build_dir/tmp/etc/init.d/ &&
sleep 0.1 &&
#cp -p ../custom-settings/build_dir/tmp/{installer-config.txt,my-files.list,post-install.txt,custom_files.txt} build_dir/tmp/ &&
#cp -p ../custom-settings/build_dir/tmp/etc/init.d/build.sh build_dir/tmp/etc/init.d/ &&
#cp -p ../custom-settings/build_dir/tmp/home/pi/.bashrc build_dir/tmp/home/pi/ &&

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
rm -rf raspberrypi-ua-netinst &&

printf "\e[2;3;33m Finished! \n\e[0m\n" &&
exit 0
