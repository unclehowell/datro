# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This directory and changelog belongs: 
 --  github.com/unclehowell/datro/
 -- `gh-pages` branch (aka "the platform") 
 --  release version `0.0.1-rtw.8`
 --  /static/files (aka "the documents")

## [Unreleased]

## [0.0.6] - Q3/2020

## Added

13-Sep - modified the `rebuild.sh` script to add css to hide the scrollbar in the html build


## [0.0.5] - 2020-09-02                                                                    

 - rebranded - hotspotbnb.com is now a subsidiary of the DATRO consortium. 
 - moved repo to github.com/unclehowell/datro
 - updated the update.sh to make sure it pulls latest from there now instead
 - hid the copyright notice in footer (still need to get copyleft in its place)
 - LICENCE was still MIT. Changed it to GNU General Public Licence 3.0
 - Changed docs html theme to match websites. 


## [0.0.4] - 2020-01-10 

### Added 

 - auto-rebuild.sh still started with `sh` for some reason, which caused an error, so it was changed to `bash`
 - update.sh had a coding error on the final curl, which pulled the README.md into the sphinx directory. Fixed it
 - formatting this changelog and README.md to the same standard as we do in the reStructuredText (.rst) files e.g. *** above and below the title, === below the sub title and ------ below the sub-sub title
 - made the rebuild script call the update.sh file as well, since rebuild pulls the latest files from source-files. So it just as well try be updated to the latest first. 
 - fixed awk datetime.log error in update.sh. Since the file is called from the latex directory, I had to change `datetime.log` to `../../../_source-files/datetime.log`

## [0.0.3] - 2020-01-01

### Added

 - used bash instead of `sh` in the scripts. So to run type `./script.sh` not `sh script.sh`
 - fixed the auto-rebuild.sh script
 - made sure all directories had the latest build and auto-rebuild script and were in `latest` subdirectories
 - fix with update.sh - it was pulling the latest source files into the sphinx directory where `auto-rebuild.sh` was kept. Changed the path of the curl destination
 - modified `rebuild-master.sh` to include `sh custom.sh 2> /dev/null &&` - runs `custom.sh` if it exists. If it doesn't exist the error is hidden
