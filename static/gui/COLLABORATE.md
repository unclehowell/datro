# Collaborating (Platform Reception Page)

## Summary

This is DATRO's 'Release to Web Extra' branch e.g. RTWX.
It's used like gh-pages to host a website, except we use Netlify for this branch instead.

## Introduction

We needed a way to give each website its own url.
And we needed to keep all those websites inside a single mono repo.

Initially we hoped to have all this work on one branch too.
But the closest we came to this goal, was to use url and mask forwarding, which was ugly.
Visitors lose trust if they're re-directed from the url they visited, or if there's no chain of trust with the ssl.

We also want a way to preview development build of the websites, before merging them over the live websites source-code.
Netlify came to the rescue, since you can preview any branch by visiting a url with it,
but hidden fees crept in each time we made changes to the websites source-code,
since Netlify would detected and performed automoated re-builds of the static websites on their CDN.

So what we did was made this sister branch, to the gh-pages branch.
This branch/ websites uses a version of the HotspotBnB Dashboard/ GUI to navigate to any of the websites.
This is less likely to be changes much, so we can use Netlify now, without fear of any fees creeping in.
And we can point all the domain for each of the websites, to this kind of reception webpage.
And since the websites are loaded inside of the website, the security certificate doesn't brake, like with url/ mask forwarding.

In the case of the software branches e.g. hotspotBnB (rpi-os, linksys-os etc), we use git hubs normal collaborate methods.
But in the case of the platform (the websites), the gh-pages branch, the Release-to-Web (RTW) ... whatever you like to call it,
We use our own method. We don't have a development branch for the gh-pages (and this netlify sister branch).
Instead we just copy the directories and add '-dev' to the end of the name of the duplicates.
So we don't have a separate branch for development, just separate folders.
But only in the case of gh-pages/netlify branches (rtw/rtwx) aka the 'platform'.
In the case of the software branches, we use corresponding development branches, like normal.

If we used dev branches for the platform, we'd be back to needing to use netlify to preview them, and that would incur costs.
So we think our beskpoke methodology will do for now. We're open to better suggestions, just none received so far.

## Getting Started

1. Git pull the 'dev' folder in this branch, using sparse-checkout.
2. Make your changes locally, using your own branch name. Then submit changes back (for the sys-admin/moderator(s) to review).
3. Enter any of the websites url to arrive at the platform reception page. Where you can preview the -dev folder/ webpages.

The current methodology of collaborating in exchange for a share of our networks royalties has more steps:
1. Create your own repo, to keep your copy in. And use gh-pages to preview it.
2. Include your cryptocurrency wallets in your repo and generate royalty tokens from our main website, for those wallets.
3. Then instead of modifying our source code to include your changes, you must create a sub-repo pointing to your repo.
4. When you submit your changes this way, if accepted, our networks smart contracts will pay you autonomously.
5. When you want to make changes in future, most likely to try to increase your royalties from our network,
you simply make those changes in your public repo, and our repo will be altered of your changes automatically.

## Semantic Version Extensions (Important)

The monorepo branches are given different semantic version tag extensions:
- source code on the `rpi-os` branch = version x.x.x-rc.x (Release Candidate) e.g. v0.0.1-rc.1
- source code on the `live-usb` branch = version x.x.x-rtm.x (Release to Market) e.g. v0.0.1-rtm.1
- source code on the `gh-pages` branch = version x.x.x-rtw.x (Release to Web) e.g. v0.0.1-rtw.1
- source code on the `netlify` branch = version x.x.x-rtwx.x (Release to Web extra) e.g. v0.0.1-rtwx.1

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
- gh-pages (all the websites (static & server-side) and documents, in html/pdf form)
- live-usb & live-usb-dev (to-go persistent live usb disk image)
- cacher & cacher-dev (a solution for doing the self-build rpi-os upgrade entirely offline, using proxy cache/ redirects)
- DAS & das-dev (our decentralized autonomous organization & smart contracts)

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


      ## Handy Commands

      ### Change permission of all files in the repo.
      Handy when you want to use Atom instead of Notepad C++

      ` find ./ -type f -exec chown user:user {} \; `

      ### When you just need a bunch of files in a repo (no pull, sparse-checout - just files, quick and dirty)
      ` svn co --depth files https://github.com/unclehowell/hbnb/branches/gh-pages/static/splashpage/img/ `

      ### Something weird happened with RST files, where they had to be recoverd from build/html/_source/
      ### This code bulk changes the extension on multiple files  

      #!/bin/sh
      #

      ` for i in *.txt
	do
      mv -- "$i" "${i%.txt}"
      done `
 
      ## Modify apache2 page to show directory in full side on mobile
      ## add this to /etc/apache2/apache2.conf 

      ` IndexHeadInsert "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" `

### Command for finding text in all files in a specific directory

      grep -rnw '/path/to/somewhere/' -e 'pattern'
