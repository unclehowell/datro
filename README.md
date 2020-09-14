# Gh-pages Branch Readme 

### Nomenclature

 - this 'gh-pages' branch is auto-named with GitHub Pages (free website hosting). 
   We refer to this branches content by its nickname: the "platform".
   Other branches (with the exception of the 'Netlify' branch) are nicknamed "software" since they all hold software source-code. 

   content of this branch mainly includes all websites ('static' & 'dymanic'/ 'server-side' files), technical documents & how-to videos

 - 'netlify', the "platform reception pages" sister branch, is also worth a look to fully understand our website/ hosting methodology.

 - the websites contained within are primarily flattened html files and contained within the `/static' directory.
 - Corresponding server-side files e.g. cms's which can be used to manage them, like wordpress ... can be found in the `dynamic` directory.

  `datro.xyz
   | static
   | ├── datro    -- splashpage js & css
   | ├── gui      -- the user interface/ which also doubles up as an interative website demo
   | ├── files    -- source + compiled PDF's & HTML
   | dynamic
   | ├── ?????    -- php server-side file e.g. 'the docs cms' (for local use only e.g. serverless)
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


