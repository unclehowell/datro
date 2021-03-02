# Collaborating

## Summary
DATRO's website, document, software and training video source-code (everything) is held in a single public repository ("monorepo")
The primary location online is `github.com/unclehowell/datro`.
This monorepo can also be discovered elsewhere online and offline - just ask around.
There's a few branches in the monorepo e.g. gh-pages, subrepos, netlify etc
This branch of our monorepo is entitled 'net-installer' (see README.md for more info on its content)

## Why Collaborate
Unlike other open source projects, it's worth collaborating since DATRO's networks revenue is autonomously divided between developers.
So you don't get paid for a job well done with DATRO. Your contribution is democratically elected a beneficial interest.
Since you maintain own and control of the contributing source code, you receive the beneficial interest as an ongoing royalty. 

## Basic Concept
1. You make your own github repository (name it with relivance to the content). Your contribution, so you'll maintain ownership and control. 
2. You make a seperate branch and entitle it 'hotspotbnb', then add your cryptocurrency wallets (so our blockchain smart contracts know who to pay).
3. Next you propose a small modification to our source code to included your repo as a subrepo within ours:
  - Without this method of subrepos payment to the owners of valid, concurrent software dependancies can't be automated or assured. 
  - We'd also otherwise risk successful autonomous system builds and user experience, if the 3rd party deletes their repo on any given sunday.   
4. If your proposed changes are accepted by our moderator(s) you'll see your source code in the next release.
5. Any changes you want to make to your source code thereafter, you make it your repo and the subrepo link will notify us. 
6. Vice versa, any changes made to your sub-repo in our source code, notifies you via your repo.

This whole method of collaboration and payment helps us carefully migrate towards becoming a DAO.
Assessing each risk and tackling each challenge one step at a time to avoid exposures to modern cyber-threats and other vunerabilities. 

## Branch Nomenclature (this branch only)
 - 'net-installer' refers to our Net-installers (autonomous self-building, self-configuring disk images for MicroSD Cards and USB). 

### Symantic Version Control
See the CHANGELOG file for more information

#### Exceptions when COLLABORATING
1. CHANGELOG - Self explanitory when you look at the changelog. But look carefully as we combine Prince2 and Semver.
2. Semantic Versioning (this branch only)

  - 'net-installer' branch gets the mighty RC (Release Candidate) suffix in its version release number e.g. x.x.x-rc.x
  - the other branches are all websites and docs. This branch contains the actual (uncompiled) software e.g. software source code. 
  
## Get Started
1. Although you can clone the monorepo to your local machine, it's massive. So we suggest sparse-checkout - instructions to follow.
2. We suggest you make your proposed changes locally, on your own branch name, then submit changes accordingly.

## GitHub 'mono' Repo
This collaboration guide focuses on two key ways of interacting with this monorepo branch:

### 1. Sparse-checkout:
  - since the monorepo is so big and diverse, collaborators should only checkout and push back directories they're actively working on
  - the sparse-checkout method is designed for this purpose, making it the ideal choice

### 2. Git Pull
  - standard practice with github, but in light of how massive the monorepo is huge you're better off getting familiar with method 1

### Before Getting Stuck-In
This monorepos branches can be retrieved (download only, in its entirety, via github.com) or using a command-line method called Subversions:
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

      #!/bin/sh
      #

      for i in *.txt
	do
      mv -- "$i" "${i%.txt}"
      done

      ### Command for finding text in all files in a specific directory

      grep -rnw '/path/to/somewhere/' -e 'pattern'
