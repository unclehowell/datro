# Collaborating (websites)

## Summary

HotspotBnB's entire software and website source-code (everything) is held in a single monorepo.
The main online location of this monorepo is github.com/unclehowell/HBnB (it can also be discovered elsewhere online and offline).

This repo (repository) features four seperate branches.
'master' is for the software source-code. 'gh-pages' is for the websites source-code.
The remaining 2 branches have a '-dev' on the end of their names and are used to preview latest changes (what we call 'beta'):

## Introduction

If not already clear, this file and its surrounding folder/branch, contains only source-code for the websites:
- hotspotbnb.com is the url corresponding to the 'gh-pages' branch
- beta.hotspotbnb.com is the url corresponding to the 'gh-pages-dev' branch

If you enter a directory at the end of the url e.g. /demo or /docs , you'll be navigated to entirely seperate websites (with consistent themes).
Each websites php files and databases are contained in hidden folders (their names have a '.' (dot) at the beginning of the filename e.g. .docs, .demo etc)
So you'll need to run the websites on a webserver to work on them. Once you've made changes, you simply export them as static html websites.
The exported static html websites are then placed into their corresponding sub directories e.g. /demo, /docs etc

## Getting Started

1. Download the gh-pages-dev branch using either of the 'download methods' described below (sparse-checkout is recommended)
2. Make your changes locally, then submit changes back to the gh-pages-dev branch (for the systems administrator(s) to review).
3. The sys-admin regularly reviews code changes and if inclined, will merge 'gh-pages-dev' into the 'gh-pages' main branch e.g. hotspotbnb.com

## GitHub 'mono' Repo
This collaboration guide focuses on 2 know ways of interacting with this monorepo branch:

### 1. Sparse-checkout:
  - 'apt install git' doesn't currently install a late enough version of git to support sparse-checkout (use PPA)
  - since the monorepo is so big and diverse, collaborators must only checkout and push files they're actively working on
  - the sparse-checkout method is designed for this purpose, making it the ideal choice

### 2. Git Pull
  - standard practice with github. But remember, the monorepo is huge. So better use Sparse-checkout to checkout only what you need

## Points to Note
* There's other methods of getting files from this project into other working projects, called Submodules and Sub Repo's.
  - Sub Repo is explained below, since we use it in this monorepo to pull in other projects source code.
  - This allows changes we make to source code in our repo, to get back to the origin (notify the origional developers of our changes).
  - Vice versa, if developers make changes to their source code, which we have forked as a sub repo in our monorepo, we can pull changes in, instantly.

* This monorepo's branches can also be retrieved (download only, in its entirety, via github.com) or using a command-line method called Subversions:
  - Subversions are used in the scripts in the firmware (v0.0.1-rc.6+). Depends on the 'subversion' package being installed
  - svn (or `svn co` subversion checkout) appears to be the cleanest way of downloading (download-only) specific folders

* If you're a super freak when it comes to github, you can grab earlier commits, which may exclude developments you may not wish to build upon

## Semantic Version Extensions (Important)

The monorepo branches are given different semantic version tag extensions:
- source code on the `rpi-os` branch = version x.x.x-rc.x (Release Candidate) e.g. v0.0.1-rc.1
- source code on the `live-usb` branch = version x.x.x-rtm.x (Release to Market) e.g. v0.0.1-rtm.1
- source code on the `gh-pages` branch = version x.x.x-rtw.x (Release to Web) e.g. v0.0.1-rtw.1

Why do this ? It's so we can release newer compiled software/ versions of the different technologies in our monorepo,
at different stages, without having to wait to bring everything in the monorepo up to the latest version release.

We may even be inclined to extend the semantic versioning tags in the release notes within each sub directory. For example:
- demo (v0.0.1-rtw.2--rc.1) to indicate the interactive website demo corresponds to software release v.0.0.1-rc.1 (e.g. it's behind)
- docs/live-usb (v0.0.1-rtw.2--rtm.2) to indicate the docs for the live-usb is ahead of the software release

At the time of writing there's also around 6 different technologies in the portfolio (and 1 for the docs and websites).
So we can expect as many as 7 branches (plus 7 corresponding ones for development e.g. 'rpi-os-dev', so 14 in total).
Furthermore, the rpi-os is the hotspotbnb software for the raspberry pi's only, so we may see separate releases for other supported hardware.  As too does the live-usb, (only supports) a select range of laptop hardware devices (at the moment).
These branches are to look something like this:
- rpi-os & rpi-os-dev (raspberry pi (hotspotbnb) operating system)
- gh-pages & gh-pages-dev (all the websites (static & server-side) and documents, in html/pdf form)
- live-usb (to-go persistent live usb disk image)
- cacher (a solution for doing the self-build rpi-os upgrade entirely offline, using proxy cache/ redirects)
- DAO Society (our decentralized autonomous organization & smart contracts)

## Getting Started with Sparse Checkout

1. Make sure your version of Git is up to date (2.25.0+), or sparse-checkout will fail:

      ````bash

      sudo apt update && apt upgrade -y

      add-apt-repository ppa:git-core/ppa

      apt update

      apt install git
      ````


2. Create a local directory to store your copy of this monorepo:

      ````bash
      # xxx symbolises the name of your local copy

      mkdir xxx

      # enter into the directory you just created

      cd xxx
      ````


3. Initiate the folder as a new, empty, local git repository:

      ````bash
      # rm -rf .git undoes the following command (useful after you've got a subdirectory you don't plan on modifying or uploading back to GitHub)

      git init
      ````

4. Stage the repo ready for fetching, but remotely:

      ````bash
      # leave the *.git off the end to get the README.md and CHANGELOG.md files

      git remote add origin https://github.com/unclehowell/HBnB.git
      ````

5. Checkout files and give your branch a name:

      ````bash
      # create a branch name to summarise your changes

      git checkout -b 'BRANCH-NAME'
      ````

6. Restrict git to only get the directory/subdirectory you need. Here you have two choices:

 - Option A: Simple/ automated configuration method:

      ````bash
      # get our shell script, set the permissions and run it

      wget https://raw.githubusercontent.com/unclehowell/HBnB/master/checkout.sh && chmod +x checkout.sh

      ./checkout.sh # followed by the name of the topleveldirectory you want e.g. web, service, client or docs

      # remove this file once you've run in or the next step will fail
      # don't worry, as soon as you pull (next step) the file comes back

      rm -r checkout.sh
      ````


 - Option B: Custom configuration method:   

      ````bash
      # enable sparse-checkout

      git config core.sparsecheckout true

      # specify directory/subdirectory you want to work on (in lowercase)

      git sparse-checkout set TOPLEVELDIRECTORY/SUBDIRECTORY

      # e.g. web/ makes .git/info/sprase-checkout look like this:
        /*
        !/*/
        /web/
      ````

7. Now proceed to actually get the files you want onto your local machine:

      ````bash
      # git fetch maybe more appropriate than git pull - be wise!

      git pull origin master
      ````

8. Make your edits, bug fixes, enhancements etc ... TAKE NOTE: Here's how you checkout extra folders you may need, while you're working:

      ````bash

      git read-tree -mu HEAD
      git pull origin master
      git config core.sprasecheckout true
      git pull origin master
      git sparse-checkout set FOLDER1 FOLDER2 FOLDER3 etc
      ````

9. Once completed with your changes, you'll want to run 'git add'

      ````bash
      # first run a pull again, incase there's been some changes

      git pull origin master

      git add ./
      ````

10. Next commit with a brief summary of your changes

      ````bash
      #
      git commit -m "BRIEF SUMMARY OF YOUR CHANGES"     
      ````


11. Then 'git push' to push your branch to GitHub

      ````bash
      #
       git push -u origin 'YOUR-BRANCHES-NAME'
      ````


12. Finally make a pull request, so the administrator of the project can review your changes and merge your branch into the master branch of this proje

 - visit the repo address in your web browser e.g. https://github.com/unclehowell/HBnB
 - find and click the **Compare & pull request** button
 - to complete the process select the **Create pull request**

GitHub will notify you if there's a comment to respond to or when the administrator has processed the merge.

## Getting Started with Sub Repo

1. Create and execute a script to install the subrepo command:  

      ````bash
      # make a file called install-git-subrepo.sh
       touch install-git-subrepo.sh

      # use nano to edit the file `sudo nano` and past the following and save the file:
      sudo apt-get update \
        && apt-get install -y --no-install-recommends \
           less \
           git

      git clone --depth=1 --branch=0.3.1 https://github.com/ingydotnet/git-subrepo.git /tmp/git-subrepo \
         && cd /tmp/git-subrepo \
         && make install \
         && cd - \
         && rm -rf /tmp/git-subrepo

      # make the file executable and run it
      sudo chmod +x install-git-subrepo.sh && ./install-git-subrepo.sh

      # any issues, look for support here https://github.com/ingydotnet/git-subrepo
      ````
