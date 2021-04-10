# Collaborating (websites)

## Summary

DATRO's websites, documents and softwares source-code ... everything, is held in a single source-code repository e.g. "monorepo"
The primary location of this MonoREAPo is `github.com/unclehowell/datro`,
But its content can also be discovered elsewhere online and offline.

## Why Collaborate ? 
If you're looking to earn an income from the DATRO's network (as a web developer), our solution is awesome:  
  - Firstly you'll need to make your own repository for the source code you wish to contribute.  
  - Then you add to it, all your cryptocurrency wallets (so our blockchain smart contracts know who to pay).  
  - Next you propose a small modification in our source code - to link your repo as a subrepo.  
  - If your proposed changes are accepted by our moderator(s) you'll see your source code in the next release.  
  - Any changes you want to make to your source code thereafter, you make it your repo and the subrepo link will notify us.   
  - Vice versa, any changes made to your sub-repo in our source code, notifies you via your repo.  

We expect a lot of activity while developing the DATRO network and platform, so Github will be used to handle this chaos.  
When things settle and the network/technology has stabalized, we seek to move to this entire MonoREAPo to the blockchain.  
In technology there's something called a bathtub effect, which we're in the early stages of.   
e.g. on a graph issues are high, then in time they lower, then as the technology gets old the issues rise again.  
As the MonoREAPo evolves e.g. good housekeeping, completed solutions and minimal possible filesizes, we can become fully-decentralized    
Once the source code is on the blockchain, we can use tokenized, majority voting to suggest and auth changes e.g. fully-democratized  


## Branch Nomenclature  
 - the 'gh-pages' branch is auto-named with GitHub Pages (free website hosting). We refer to this branch and its content as "the platform".  
   content primarily includes all the websites ('static' & 'dymanic'/ 'server-side' files) and technical documents, how-to videos etc   
 - 'netlify' refers to the popular Netlify service. We refer to this branch as "the platform reception page".   

The reason we have this second website related branch, is to hack our way to a few desired goals:   
    - we have a main website `datro.xyz`, then a few seperate urls for each of the solutions we're developing.  
    - all the websites are contained in this single MonoREAPo (the gh-pages branch). And hosted using GitHub Pages.   
    - Github only allow one url and one webpage per repository. Netlify gets around this, but the charge per each website change e.g. build/ deploy.  
    - We tried to 'url/ mask -forward' our urls to the various seperate sites in our gh-pages subdirectories, where they're held.  
    - Sadly the visitor is either redirected to a link they didn't enter and/or presented with the site, but no ssl/ browser safety.  
    - So we made this 'netlify' branch, to host a basic reception website, with Netlify, and we now point all our domains to it.  
    - So when the visitor enters any of our urls, they're presented a choice of which website they're trying to reach.  
    - When vistors chose a website, this reception page loads the gh-pages branch subdirecty (containing the page), but in the same screen.   
    - So the security certificate doesn't break and Netlify costs are zero, because the reception page is simple and rarely changed.   
    - Furthermore, this "platform reception page" lets us access and preview pre-production websites and it's ideal for upselling/ crosselling.       
    - Not using Netlify to its full ability, to remain "overhead-free" - means we can't preview a `gh-pages-dev` (development) branch.   
    - That said, we can still have a `gh-pages-dev` branch, but it's not as fun without being able to preview it, on say beta.url.tld.  
    - So instead we've made a development directory within the 'gh-pages' branch, containing duplicates, but with `-dev` after their names.    
    - Now developers can checkout the development copy of the files, make changes and propose them back, as oppose to a -dev branch.   
    - And instead of the moderator(s) merging the `gh-pages-dev` branch over the top of the main branch,   
    - the moderator simply overwrites the website directory with the corresponding/ approved "development" website directory.  
    - This bastardised methodology is only for the two above "platform" branches, the software branches use GitHub's recommended methodology.    
    - the url for the aformentioned 'Netlify'/ Platform reception page is https://datro.world  

 - 'rpi-os' refers to our HotspotBnB Netinstaller, for the Raspberry Pi.   

 - 'linksys-os' refers to our HotspotBnB 'flash' installer solution, for Linksys wireless access points.  

( this trend continues for all of the different types of installers for the various makes and models of wireless access points. )  

 - 'live-usb' refers to   

The remaining 2 branches have a '-dev' on the end of their names and are used to preview latest changes (what we call 'beta'):  

### Symantic Version Control

We adhear closely to [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).  

#### Exceptions

1. Extensions: DATRO doesn't just use the 'Release Candidate' (RC) or 'Release to Web' (RTW) semantic version extensions.  
And we don't use them in the usual way. Here's a list of our branch names and the Symantic Version Extension we give each one:  

  -  'gh-pages' branch uses RTW in the version e.g. version x.x.x-rtw.x  
  -  'netlify' branch uses RTWX in the version e.g. Release to Web Extra/ x.x.x-rtwx.x  
  -  'rpi-os' branch gets the mighty RC e.g. version x.x.x-rc.x  
  -  'linksys-os' branch (and the branches for D-Link, Xiaomi etc) use RC + Romain numerals e.g. x.x.x-rcI.x, rcII.x etc    
  -  'live-usb' branch is using RTM (Release to Market) version x.x.x.rtm.x  
  -  'cacher' branch will be considered RTM Extra e.g. x.x.x.rtmx.x   
      if we come up with more like cacher/ live-usb, we'll use roman numerals, and 'cacher' inherently evolves to become RTM(TEN).   

2. CHANGELOG: DATRO uses quarters in its changelog header and days and months before each entry. There's also multiple changelogs.  
  
  -  e.g. `QX/YYYY` not 'DD/MM/YYYY` in the header  
  -  e.g. `###Added / 09-Sep - lorum ipsum` not `###Added / - lorum ipsum` (the `/` is used to represent a line break)  
  -  as for numerous changelogs, this is a monorepo, so it's expected.   
     -  the top level directory changelog is restricted to changes to the branch, the filestructure, folder label changes etc  
     -  within each subdirectory e.g. /static/files or /static/gui, there's a changelog to account for changes within its specific directory    
     -  the top level directory changelog uses the aformentioned semantic version rtw e.g. `x.x.x-rtw.x`  
     -  the semantic versioning in the changelogs contained within the sub-directories use a simple `x.x.x` template  
     -  but each changelog in the individual subdirectories will make reference to the lastest release version of the branch e.g. x.x.x-rtw.x  
     -  there's no need to update the reference to each branch release version in each sub-directory changelog on a re-release.  
     -  but if you're working on a sub-directory and make an entry in its changelog, be sure to update the branch release to the current release.   

## Get Started

1. Download the gh-pages branch to your local machine using either of the 'download methods' described below (sparse-checkout is recommended)  
2. Make your changes locally, on a branch-name of your chosing, then submit your changes accordingly, for the moderator(s) to review.  

## GitHub 'mono' Repo
This collaboration guide focuses on 2 know ways of interacting with this MonoREAPo branch:  

### 1. Sparse-checkout:
  - 'apt install git' doesn't currently install a late enough version of git to support sparse-checkout (use PPA)  
  - since the MonoREAPo is so big and diverse, collaborators must only checkout and push files they're actively working on  
  - the sparse-checkout method is designed for this purpose, making it the ideal choice  

### 2. Git Pull
  - standard practice with github. But remember, the MonoREAPo is huge. So better use Sparse-checkout to checkout only what you need  


## Final Intro Note
* This monorepo's branches can be retrieved (download only, in its entirety, via github.com) or using a command-line method called Subversions:  
  - Subversions are used in the scripts in the firmware (v0.0.1-rc.6+). Depends on the 'subversion' package being installed  
  - svn (or `svn co` subversion checkout) appears to be the cleanest way of downloading (download-only) specific folders  

* If you're a super freak when it comes to github, you can even grab earlier commits,   
which may exclude developments and direction, you may not wish to build upon or follow  
A great example of this is when Emby made IPTV a paid feature, so developed branched off (using an earlier version), calling it Jellyfin   
Now all the cheapskates get to continue enjoying their media center, with free IPTV - it's just called Jellyfin now.   


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

6. Restrict git to only get the directory/subdirectory you need:

 - Custom configuration method:   

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

 - Some genius baked up a solution to automate the above step:

      ````bash
      # get our shell script, set the permissions and run it

      wget https://raw.githubusercontent.com/unclehowell/HBnB/master/checkout.sh && chmod +x checkout.sh

      ./checkout.sh # followed by the name of the topleveldirectory you want e.g. web, service, client or docs

      # remove this file once you've run in or the next step will fail
      # don't worry, as soon as you pull (next step) the file comes back

      rm -r checkout.sh


7. Now proceed to actually retrieve the files you want on your local machine:

      ````bash
      # git fetch maybe more appropriate than git pull - be wise!

      git chechout -b 'YOUR BRANCH NAME'
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

      git pull origin 'BRANCH NAME'

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
       git push origin 'YOUR-BRANCH-NAME'
      ````


12. Finally make a pull request, so the administrator of the project can review your changes and merge your branch into the master branch of this proje

 - visit the repo address in your web browser e.g. https://github.com/unclehowell/datro  
 - find and click the **Compare & pull request** button  
 - to complete the process select the **Create pull request**  

GitHub will notify you if there's a comment to respond to or when the administrator has processed the merge.  

## Getting Started with Sub Repos

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
      Handy when your text editor software (atom/ notepad C++) can't save changes  

      `find /xxxx/xxxx -type f -exec chown user:user {} \;` # f is folder, use d for directories  

      ### When you just need a bunch of files in a repo (no pull, sparse-checout - just files, quick and dirty)   
      svn co --depth files https://github.com/unclehowell/datro/branches/gh-pages/static/gui/dashboard/img/  

      ### This code bulk changes the extension on multiple files  

      ```bash
      #!/bin/sh
      for i in *.txt
	do
      mv -- "$i" "${i%.txt}"
      done
      ```

      ### Command for finding text in all files in a specific directory  

      grep -rnw '/path/to/somewhere/' -e 'pattern'
      

      ### Find and Replace
      
     grep -rl 'windows' ./ | xargs sed -i 's/windows/linux/g'
