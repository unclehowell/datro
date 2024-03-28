#!/usr/bin/env bash
#
#unset CDPATH


#.................................................
#         DATRO Consortium - 2024 (OGL v3.0)
#.................................................
#
#   ██████╗  █████╗ ████████╗██████╗  ██████╗
#   ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔═══██╗
#   ██║  ██║███████║   ██║   ██████╔╝██║   ██║
#   ██║  ██║██╔══██║   ██║   ██╔══██╗██║   ██║
#   ██████╔╝██║  ██║   ██║   ██║  ██║╚██████╔╝
#   ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝
#................................................
#       make-sitemap-new.sh  0.1-rtw(?)
#................................................
#                  gui.datro.xyz
#................................................


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

# url configuration
URL="https://gui.datro.xyz/"
# values: always hourly daily weekly monthly or yearly
FREQ="monthly"

# values: changable 

printf "\n\e[2;3;33m ------------------------------------------------- \n\e[0m\n"
inner_output="${PWD#*/*/*/*/*/}" && 
printf "\e[2;3;33mProducing sitemap.xml for \e[2;3;33m %s\n" "${inner_output%/*}/"

printf "\n\e[2;3;33m Step 1 of 5. Removing old sitemaps \n\e[0m\n"
for number in $(seq ${_start} ${_20})
do
        sleep 0.1
        ProgressBar ${number} ${_end}
done

rm -r sitemap.xml 2> /dev/null &&

# values: changable 
rm -r ../sitemap.xml 2> /dev/null &

printf "\e[2;3;33m Done! \n\e[0m"
printf "\n\e[2;3;33m Step 2 of 5. Generating sitemap.xml file \n\e[0m\n"
for number in $(seq ${_20} ${_40})
do
	sleep 0.1
	ProgressBar ${number} ${_end}
done

exec 1> sitemap.xml &&
exec >/dev/tty &&

printf "\e[2;3;33m Done! \n\e[0m" &&
printf "\n\e[2;3;33m Step 3 of 5. Appending files and directories to URL \n\e[0m\n" &&

for number in $(seq ${_40} ${_60})
do
        sleep 0.1
        ProgressBar ${number} ${_end}
done

echo -ne '<?xml version="1.0" encoding="UTF-8"?>' >> sitemap.xml &&
echo -ne '\n<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">' >> sitemap.xml &&

cd ../

IFS=$'\r\n' GLOBIGNORE='*' command eval "OPTIONS=($(cat sitemap/$0.options))"
find . -type f "${OPTIONS[@]}" -printf "%TY-%Tm-%Td%p\n" | \
while read -r line; do
  DATE=${line:0:10}
  FILE=${line:12}
  echo -ne "\n<url>" >> sitemap/sitemap.xml &&
  echo -ne "\n<loc>${URL}${FILE}</loc>" >> sitemap/sitemap.xml &&
  echo -ne "\n<lastmod>$DATE</lastmod>" >> sitemap/sitemap.xml &&
  echo -ne "\n<changefreq>$FREQ</changefreq>" >> sitemap/sitemap.xml &&
  echo -ne "\n</url>" >> sitemap/sitemap.xml
done

cd sitemap/

echo -ne "\n</urlset>" >> sitemap.xml &&

mv sitemap.xml ../ 

printf "\e[2;3;33m Done! \n\e[0m"
printf "\n\e[2;3;33m Step 4 of 5. Displaying sitemap.xml ... \n\e[0m\n" &&

for number in $(seq ${_60} ${_80})
do
       sleep 0.1
       ProgressBar ${number} ${_end}
done
printf "\n\e[2;3;33m \n\e[0m\n"

cat ../sitemap.xml &&

printf "\n\e[2;3;33m  \n\e[0m\n"

sleep 1 &&

printf "\n\e[2;3;33m Step 5 of 5. Script will now End!  \n\e[0m\n" &&

for number in $(seq ${_80} ${_end})
do
    sleep 0.1
    ProgressBar ${number} ${_end}
done

printf "\n\e[2;3;33m --------------------------------------------- \n\e[0m\n"

# going wild here to make absultely sure the script escapes - it can hang for all sorts of reasons
sleep 0.1 &&
exit 1 &
sleep 0.1 &&
exit 0 &
sleep 0.1 &&
exit
sleep 0.1 &&
exit 0
sleep 0.1 &&
exit 1
sleep 0.1 &&
end
