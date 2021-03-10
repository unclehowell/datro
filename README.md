# DATRO Consortium ('Gh-Pages' Branch) 

Welcome to the DATRO Consortium MonoRepo.
Our MonoRepo contains 4 branches (You are viewing the 'gh-pages' Branch). The other 3 branches include: 

[Net-Installer](https://github.com/unclehowell/datro/tree/net-installer "DATRO Net-Installer Branch")/ # source code and autonomous compiler scripts (which output the self-building disk image .img file) e.g. HotspotBnB, To-Go USB etc

[Netlify](https://github.com/unclehowell/datro/tree/netlify "DATRO Netlify Branch")/ # this is a version of the HBnB Dashboard, used to showcase our websites, in a similar way to how apps are on the Dashboard

[SubRepos](https://github.com/unclehowell/datro/tree/subrepos "DATRO SubRepos Branch")/ # this branch contains all the subrepos, giving us a sort of staging server to mediate between our end-users and developers

Content of this branch mainly includes all the websites, the dashboard (gui), the technical documents and media e.g. academy videos:
    
### Detailed Structure

| Path                      | Details                                                                             |
|---------------------------|-------------------------------------------------------------------------------------|
|gh-pages/                  | Top level directory - mainly stuff to make things to work e.g. CNAME, index etc     |
|gh-pages/static/gui        | Serves as both the online demo and the end-users (localhost) dashboard              |
|gh-pages/static/files      | All the documents, this is our document library                                     |
|       /static/datro       | The [DATRO Consortium](https://datro.world "DATRO Consortium") Homepage             |
|       /static/hbnb        | The [Hotspotβnβ Software](https://hbnb.datro.world "Hotspotβnβ Software") Homepage  |
|       /static/slides      | All the slides, this is our slideshow library                                       |
|       /static/wave        | The Wave DApp website (JSECoin + Althea.net = Free Internet)                        |
|       /static/evr-network | The [EVR-Network](https://evr-network.datro.world "EVR-Network") Homepage           |


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


