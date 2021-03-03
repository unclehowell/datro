# Welcome to the DATRO Consortium GitHub MonoRepo 

### Nomenclature

You're currently on the 'gh-pages' branch (which is auto-named as part of GitHub Pages e.g. free website hosting for us. 
Other branches include:

[Net-Installer](https://github.com/unclehowell/datro/tree/net-installer "DATRO Net-Installer Branch")/ # source code and autonomous compiler scripts (which output the self-building disk image .img file) e.g. HotspotBnB, To-Go USB etc 

[Netlify](https://github.com/unclehowell/datro/tree/netlify "DATRO Netlify Branch")/ # this is a version of the HBnB Dashboard, used to showcase our websites, in a similar way to how apps are on the Dashboard

[SubRepos](https://github.com/unclehowell/datro/tree/subrepos "DATRO SubRepos Branch")/ # this branch contains all the subrepos, giving us a sort of staging server to mediate between our end-users and developers

Content of this branch mainly includes all the websites, the dashboard (gui), the technical documents and media e.g. academy videos.
    
### Directory Structure

gh-pages/                       # the top level directory features a few files required for things to work e.g. CNAME, index.html etc
gh-pages/static/gui             # serves as both the online demo and the end-users (localhost) dashboard
gh-pages/static/files	        # all the documents, this is our document library
        /static/datro           # the [DATRO Consortium homepage](https://datro.world "DATRO Homepage")
        /static/hbnb            # the [Hotspotβnβ Homepage](https://hbnb.datro.world "Hotspotβnβ Homepage")
        /static/slides          # all the slides, this is our slideshow library
        /static/wave            # the wave website
        /static/evr-network     # the [EVR-Network (TestNet) Homepage](https://evr-network.datro.world "EVR-Network (TestNet) Homepage")


  - Everything above is hosted for free on github (gh-pages)
  - This branch, alongside other branches, means everyrthing can be stored in the same repo
  - Serverless: Makes the business very resilient to physical/ cyber attacks:
     - anyone wanting to collaborate on the website can easily grab a local offline copy and make changes
     - git pull/ sprase-checkout the directories/websites you want to work on:

         `mkdir /var/www/html` # if it doesn't already exist
         `git remote add origin https://github.com/unclehowell/datro.git`
         `git checkout -b my-custom-mods` # make new branch for your changes
         `git pull origin gh-pages'

  - the corresponding dynamic server-side files allow the cms for the website to be locally hosted e.g. run offline
  - the DATRO persistent-live USB disk image is also provided, to turn any PC into a fully-configured local workstation
  - Make changes, follow the sites COLLABORATE.md guide e.g. directly edit the source code or use the cms and its html export feature)
  - once you're done making changes, upload your changes to github and make a pull request to the `gh-pages-dev' branch.


