# DATRO Websites

## This directory contains all the DATRO Websites

This README.md refers to the gh-pages branch of the DATRO monorepo (containing all the online content e.g. websites, videos, docs etc) 

 - DATRO websites are primarily flattened html files and contained within the `/static' directory.
 - Corresponding server-side files e.g. cms's which can be used to manage them, like wordpress, can be found in the `dynamic` directory.

`datro.xyz
 | static
 | ├── datro    -- splashpage js & css
 | ├── demo
 | ├── files    -- source + compiled PDF's & HTML
 | dynamic
 | ├── files    -- php server-side file e.g. 'the docs cms'
 | index.html'
 
  - Everything can be hosted for free on github (gh-pages)
  - Everything can be stored in the same repo as the source-code
  - Serverless: Makes the business very resilient to physical/ cyber attacks:
  - anyone wanting to collaborate on the website can easily grab a local offline copy and make changes
  - git pull/ sprase-checkout the directories/websites you want to work on:

         `mkdir /var/www/html (if it doesn't already exist)
          git remote add origin https://github.com/unclehowell/datro.git
          git checkout -b my-custom-mods (make new branch for your changes)
          git pull origin gh-pages'

  - the corresponding dynamic server-side files allow the cms for the website to be locally hosted e.g. run offline
  - the DATRO persistent-live USB disk image is also provided, to turn any PC into a fully-configured local workstation
  - Make changes, follow the sites COLLABORATE.md guide e.g. directly edit the source code or use the cms and its html export feature)
  - once you're done making changes, upload your changes to github and make a pull request to the `gh-pages-dev' branch. 
  
If you're looking to earn an income from the DATRO network as a web developer, the process is a little more extensive.
  - Firstly you'll need to make your own repository for the source code you wish to contribute.
  - Then you must add within it your cryptocurrency wallets (so the smart contracts know who to pay).
  - Then you have to follow the process above, but only to sync your repo into ours through way of a sub-repo:
       - so your basically modifying our source code, to include a sub-repo, which is effectively point to yours.
       - make sure the two integrate together nicely, then submit your modified version of this branch (pull request)
       - if your proposed changes are accepted by our moderator(s), the pull request will be accepted and merge will be done
       - once the development branch is merged into the master branch and the next symantic verison shifts up one, you're in!
       - any changes you make to your source code in your repo, can be reviewed by anyone working on our monorepo.
       - vice versa, anyone making changes to your sub-repo in this branch, can push those changes to propose changes back to you. 

We expect a lot of activity while developing the DATRO network and platform, so Github will be used to handle this chaos.
When things settle and the network/technology has stabalized, we will seek to move to the monorepo to the blockchain.
Once the source code is on the blockchain, we will use liquid democracy to collectively vote on proposed changes to the source code. 
We suspect the move to the blockchain won't happen until at least 2025. Which gives us plenty of time to prep for the migration.   

