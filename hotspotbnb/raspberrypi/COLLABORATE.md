# Collaborating

HotspotBnB exists entirely within this single GitHub 'Monorepo' (MIT Licence).
This GitHub 'mono' Repository includes all firmware, apps, server services and websites.

This collaboration guide focuses on 2 must-know ways of interacting with this monorepo: 

### The first method is called Sparse-checkout: 
  - 'apt install git' doesn't currently install a late enough version of git to support sparse-checkout (use PPA)
  - since the monorepo is so big and diverse, collaborators must only checkout and push files they're actively working on 
  - the sparse-checkout method is designed for this purpose, making it the ideal choice

### The first method is called Subversion:
  - used in the scripts in the firmware (v0.0.1-rc.6 and higher). Depends on the 'subversion' package being installed
  - svn (or `svn co` subversion checkout) appears to be the cleanest way of downloading (download-only) specific folders
  - suits all our requirements e.g. initial build script, updates, upgrades, applications to be installed etc

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

## Getting Started with Subversions

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

2. 
