# Collaborating (websites)

## Google's Methodology

If you've ever contributed to Google's source code you'll know, it goes a little like this: 

1. You submit your idea to their issue tracker, so that Google can "help out and possibly guide you".
2. Next you "jump a couple of legal hurdles", what this means is you have to:
  -  sign this agreement [Google Individual Contributor License Agreement](https://cla.developers.google.com/about/google-individual)
  -  companies sign this [Software Grant and Corporate Contributor License Agreement](https://cla.developers.google.com/about/google-corporate).

3. These agreements "ensure you own the copyright to your changes ... even after contributing it to Google's codebase"
  -  at this point you've signed over permission for Google to use and distribute your code
  -  and you've been given the opportunity to tell Google if you're code infringing on others patents

No code gets into Google's codebase without this agreement first being signed.

## DATRO's Methodology

We do things a little differently here at DATRO. 

1. You put your source-code idea in your own public source code repo (GNU GPL Licence), so it's date/time stamped to you. 
   Similar to posting an idea to yourself in a sealed envelope, which the post office stamps (admissible evidence in court)

2. Next you include all your cryptocurrency wallets in your source-code repo, to collect royalties from its use.

3. You propose a change to DATRO, to include your source-code as a 'sub-repo' in ours. Which effectively links ours to yours. 
   - In future you can improve your idea, in your source-code repo, and DATRO will notice and consider the changes automatically. 

4. DATRO uses smart contracts to autonomously distribute revenue from our network to the packages we depend on
   - This ensures all of the dependancies of our platform and software are remunerated evenly and equitably.
   - The smart contracts are all public and transparent. So to are the transactions on the blockchain.  


## Details

DATRO's entire software and website source-code (everything) is held in a single repository ("repo"), called a monorepo.
The main online location of this monorepo is github.com/unclehowell/datro (it can also be discovered elsewhere online and offline).

The DATRO monorepo is broken down into seperate branches:
 - 'gh-pages' is for the websites source-code
 - The other branches generally correspond to different itterations of our software releases e.g. rpi-os, linksys-os (raspberry pi/ linksys etc)

These branches are then duplicated with a '-dev' on the end of their names e.g. gh-pages-dev, rpi-os-dev etc
 - This is so we can funnel/ sort/ preview & quality control contributions before the merge to the main branches they correspond to.

## gh-pages

The gh-pages branch ("GitHub-Pages") contains source-code for all the websites, hosted for free on GitHub:
- datro.xyz is the url corresponding to the 'gh-pages' branch

There's not a beta.datro.xyz yet for the corresponding '-dev' branch (netlify was great, but hidden fees (grrrr))
We may have a workaround which we're looking into now. Since we want to keep this overhead free:
  - The workaround intails putting the beta's next to the main sites e.g. /static/demo and /static/demo-dev
  - This will double the monorepo size on the remote end
  - but locally we just sprase-checkout the *-dev files to work on them until a moderator overwrites the main file with the -dev one
  - then in a software branch we can host a 2nd gh-pages site, which can have a splashpage to select sites and preview them in iframes
  - the iframes can quickly navigate visitors to the datro.xyz/static/website1, datro.xyz/static/website2
  - this means we can use netlify again without the build fees everytime a dev branch change is made ...
  - .. since the iframe/ selector page will seldom change
  - this ensures the security certificates on the dedicated urls for /static/website1, webiste2 etc are all valid (unlike mask forwarding)
  - we welcome any suggestions to improve on this, but this does kill a lot of birds with one stone for now
  - the downside is also an upside here. When visitors visit hotspotbnb.com/ .co.uk and arrive to the splashpage  ...
  - (prompting them to select one of datro's technologies dedicated websites e.g. hotspotbnb, wave etc  ...
  - (or selecting beta, to preview the beta), they maybe infuriated by the extra step to reach the website. 
  - there may also be issues with viewport and SEO etc using this method (although we figured out viewport in iframe with the demo) 
  - but the upside is that everyone visiting the url's are being upsold the other technologies in our consortium
  - the other upside is the fact we have the domain and the website for the corresponding software, in the even a purchase offer is made
  - the new owner of the software solution can then host the dedicated website on the dedicated domain, and take with it the backlinks
  - FYI - we did try frame forwarding to avoid having to chose between the dedicated websites after entering the decicated url for it ..
  - but frame forwarding is messy with ssl. And having a broken security certificate isn't reassuring for the visitor. 
  - subdomains with a page rule url forward (in cloudflare) was also considered, but redirecting after entering a url is just as dodgy.    


## dymanic CMS's (serverless)

The websites are in static html, but that isn't to say they can't be managed with a server-side CMS and compiled (static html export)
Some static websites may have a cms to manage them, files for themm can be found in dymanic e.g. datro.xyz/dynamic (as oppose to /static)
So you'll need to run a local webserver to work on them. Once you've made changes, you simply export them as static html websites.
The cms's (e.g. wordpress) includes php and a *.sql database, contained in the dymanic directory, can be source-code controlled too.  
* passwords for the server-side files e.g. wp-config.php etc - must all be 'default', 'default' in the public source code
Secure passwords on the localhost files isn't really purposeful, but set it if you want, just don't submit passwords to your repo. 
If you do submit a password to your repo, after it's been made a subrepo to the DATRO monorepo, there could be problems. 
At a glance GitHub can backtrack your repo to before you foolishly submitted your password to the public, but it could cause issues with the sub-repo connection. 
Let us cross that bridge when/ if we come to it.   
 
## Getting Started

1. Remote add the gh-pages branch and sparse-checkout the -dev folder you want to work on e.g. static/hbnb-dev (hotspotbnb website, dev-copy)
2. Make your changes locally, then submit changes back (for a tech lead to review).
3. Tech leads regularly review code changes and if inclined, will merge '-dev' file changes into the main files
   - (subrepo stores its metadata in .gitrepo (in the subrepo directory). So it's safe to move e.g. from static/hbnb-dev to static/hbnb

### 1. Sparse-checkout:
  - at the time of writing 'apt install git' doesn't currently install a late enough version of git to support sparse-checkout (use PPA)
  - since the monorepo is so big and diverse, collaborators must only checkout and push files they're actively working on
  - the sparse-checkout method is designed for this purpose, making it the ideal choice

### 2. Git Pull
  - standard practice with github. But remember, the monorepo is huge. So better use Sparse-checkout to checkout only what you need

### 3. svn co --depth files https://github.com/unclehowell/datro/hbnb/css/
  - Handy little command to grab a directory and its content
  - Say for example you bugger up your local copy of the css files only, delete the file and run the above command to start over
  - Also works with individual files (look into `svn co`, `co` stands for copy)

* If you're a super freak when it comes to github, you can grab earlier commits, 
which may exclude developments you may not wish to build upon, if you want to move in a different direction from an earlier date
Not everyone agrees with the direction a project is going or has gone. Like when Emby made iptv a paid feature and Jellyfin was born
But in our case you can propose to merge your new branch, from an old commit, and merge it back into ours, 
rather than branching off as your own re-branded version. 

## Semantic Version Extensions (Important)

The monorepo branches are given different semantic version tag extensions which you should know:

## Index (Sematic Version & SV Extension) 
- source code on the `linksys-os` branch = version x.x.x-lrc.x (Linksys Release Candidate) e.g. v0.0.1-rc.1 (raspberry pi version of our OS)
- source code on the `rpi-os` branch = version x.x.x-pir.x (Pi Release) e.g. v0.0.1-rc.1 (raspberry pi version of our OS)
- source code on the `live-usb` branch = version x.x.x-rtm.x (Release to Market) e.g. v0.0.1-rtm.1 (to-go persistent live disk image)
- source code on the `gh-pages` branch = version x.x.x-rtw.x (Release to Web) e.g. v0.0.1-rtw.1 (we call this 'platform' for short)

### A note about 'platform' (gh-pages branch)
This branch of our monorepo contains all the docs and websites - right now html and pdf is compiled within the source-code.
We wouldn't normally keep the compiled stuff in with the source-code, when it belongs as an attachment in 'release' in GitHub ...
But in the case of the websites, they're hosted directly from the source-code, so the compiled websites must be in the source code.
As for the compiled docs, we could look to attach all the docs to the 'platform' release, but this would mean agro.
 - At the moment we copy the '/latest/build/' to an archieved older version e.g. `/0-0-1/build/`
 - Then we re-compile the new document and version to here '/latest/build/latex/hotspobnb_user_guide.pdf' & `/latest/build/html/index.html`
 - All the websites then link to this url (always the latest doc release). So whenever a new version is published, the link to it remains valid. 
 - But if we were to attach the compiled PDF's to the release, we'd need to give it a differt name each time to avoid duplicate urls
 - e.g. https://github.com/unclehowell/datro/archive/latest-hotspot_user_guide.pdf is good once, but what about next release. 
 - You'd have to make a unique new name, to prevent duplicating an existing link. Which would mean updating all the backlinks in all the websites. 
 - I trust this sufficiently explains our methodology here.   
 - Also, we could use Read the Docs, which has it all. But keeping everything in house, in the monorepo, it our way here at DATRO. 

## Index (Sematic Version & SV Extension) ... continued 
### Why this method ?
The software solution being released/ re-released, particularly the OS for the routers, has many variations. 
There's a release for raspberry pi's and a seperate release for the linksys routers for example. And a seperate one for other router models etc etc
The re-released software for the pi's may not always be re-released in line (the same time) as the linksys release, for example. 
So we give the various types of effectively the same software solution, a differnt branch of its own.
- Also, we don't need to use the development branch hack methodology we do with the platform, with the software ...
- We can have seperate branches for development with the software e.g. rpi-os, rpi-os-dev or linksys-os, linksys-os-dev. 
- The only reason we use a different development-branch methodology with the platform (gh-pages), as stated above, is cost.
- If we didn't do this hack for the gh-pages branch (platform), previewing the development copy of the websites would mean big Netlify fees

There's more branches coming e.g:

- cacher (a proxy-redirect cache - for tricking the router software into believing it's online, so it can autonomously self-build offline)
- DAO Society (our decentralized autonomous organization & smart contracts)

### As for Wave, (the HotspotBnB app that gives you free internet)
All the apps & dapps are likely to be inside the HotspotBnB app store, which is inside the hbnb dashboard  ...
  which is inside the gh-pages branch (platform) - so Wave won't have its own branch of the monorepo.
  Instead it will be located inside the gh-pages branch (inside the dashboard>appstore).
  The reason why the dashbaord and app store are in gh-pages branch, is because they double up as a website demo ...
  the dashboard and app store is all static HTML front-end and cgi build-scripts on the backend. So for the user it works nicely. 
  And for the website visitors who want a demo, it works nicely. Since gh-pages has no server-side, the scripts won't run.
  So there's no concern that a website visitor previewing the demo will hit `install` and the app will install to GitHub Pages server.   
  But what the website visior can do is nagivate around to get a feel for the GUI, and view the app developers interactive demo.
  So you see, having the HotspotBnB Dashboard, AppStore, Apps and Dapps as a demo too (React web-framework soon, we hope), is not only possible, it's idea. 


That's the low down of DATRO and our monorepo.
To actually get hands-on, follow these next steps:

## Getting hands on

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

6. Restrict git to only get the directory/subdirectory you need. Here you have two choices (option A is in construction - Try B 1st):

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

      git pull origin gh-pages #or whatever branch you're looting
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

### Change permission of all files in the repo  Handy when you want to use Atom instead of Notepad C++

      `find /xxxx/xxxx -type f -exec chown user:user {} \;`

### When you just need a bunch of files in a repo (no pull, sparse-checout - just files, quick and dirty)
      `svn co --depth files https://github.com/unclehowell/hbnb/branches/gh-pages/static/splashpage/img/`
