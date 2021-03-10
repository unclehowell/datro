# DATRO Consortium: 'gh-pages' Branch 

Welcome to the DATRO Consortium MonoRepo.
Our MonoRepo contains 4 branches.
You are viewing the [gh-pages branch](https://github.com/unclehowell/datro/tree/gh-pages "gh-pages branch". 
The other 3 branches include: 

| Branch                    | Details                                                                             |
|---------------------------|-------------------------------------------------------------------------------------|
|[Net-Installer](https://github.com/unclehowell/datro/tree/net-installer "DATRO Net-Installer Branch") | autonomous compiler source code for autonomous, self-building disk images e.g. Hotspotβnβ |
|[Netlify](https://github.com/unclehowell/datro/tree/netlify "DATRO Netlify Branch") | this is a version of the HBnB Dashboard, used to showcase our websites |
|[SubRepos](https://github.com/unclehowell/datro/tree/subrepos "DATRO SubRepos Branch") | this branch stores subrepos, giving DATRO a staging server of sorts, between users and developers |

### Detailed Structure

The table below shows the content of this branch includes all the websites, the Hβnβ Dashboard(gui), the technical documents and some media e.g. academy videos etc
    
| Path                      | Details                                                                             |
|---------------------------|-------------------------------------------------------------------------------------|
|gh-pages/                  | Top level directory - mainly stuff to make things to work e.g. CNAME, index etc     |
|gh-pages/static/gui        | Serves as both the online demo and the end-users (localhost) dashboard              |
|gh-pages/static/files      | All the documents, this is our document library                                     |
|gh-pages/static/datro      | The [DATRO Consortium](https://datro.world "DATRO Consortium") Homepage             |
|gh-pages/static/hbnb       | The [Hotspotβnβ Software](https://hbnb.datro.world "Hotspotβnβ Software") Homepage  |
|gh-pages/static/slides     | All the slides, this is our slideshow library                                       |
|gh-pages/static/wave       | The Wave DApp website (JSECoin + Althea.net = Free Internet)                        |
|gh-pages/static/evr-network| The [EVR-Network](https://evr-network.datro.world "EVR-Network") Homepage           |


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


