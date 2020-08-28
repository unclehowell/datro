# DATRO websites

This directory contains the DATRO websites.

### Static

The static subdirectory contains all of the static websites.

Some websites maybe static exports of wordpress websites, which means you'll the CMS to manage them.  
To install the CMS (wordpress), see the dynamic section below. 

This website source code is hosted on github and the 'github-pages' feature is used as a webserver.
This means when you visit https://datro.xyz you can preview the websites. 

For this reason an index.html splashpage exists in the top-level directory. 
The corresponding files for this index.html file can be found in static/datro. 

All the websites should be accessible from the splashpage website e.g. datro.xyz/static/demo
Alternatively a subdomain may point to them for direct access e.g. demo.datro.xyz (points to datro.xyz/static/demo)

Currently the domain is on GoDaddy, with nameservers pointing to Cloudflare. 
In cloudflare the domain points to gh-pages. The subdomains and subdomain redirects are also managed in cloudflare. 

### Dynamic

- The dynamic websites

1. The DATRO websites are mainly all administered in wordpress on a localhost.
   They're then published by exporting them (from a wp plugin) directly into a subdirectory of a public github repo (the gh-pages development branch).

2. The repo containing all the static websites is the equivalent of our software source-code monorepo e.g. everything in one big directory

3. There's a simple website in the top level directory, which is designed to be a super fast loading (well SEO'd) minimal landing page. 
   From this main page, visitors can navigate deeper into the websites in the subdrectories of the repo e.g. docs, store,blog etc  

4. Netlify enables us to view the development branch using a subdomain e.g. beta.DATRO.com (and the 'gh-pages'(the main) branch) with DATRO.com (and .co.uk)
   Once a development milestone is reached, the gh-pages-dev branch is merged into the gh-pages branch (the main one). 

5. The source code for the wordpress websites and databases can be found in the master repo (sprase-check them out). 
   After exporting changes to wp websites (to the gh-pages-dev branch, using the wp2static plugin) the source of the db and fileserver should be updated.
   To update the source of the database and fileserver, the 2 should be downloaded, stripped of security credentials and pushed to the master-dev branch. 

6. This is an 'ouroborus' eco-system, since the client can be used to host the websites (as applications). And export changes to the public website, as well as updating the source code.
   Once the source for the website application has been updated on the public repo, the clients on the whole network can be alerted to update. 

7. Developers working on DATRO can benefit greatly from the webGUI (dashboard) of DATRO and the devices command terminal (which we don't disable).
   A reguar DATRO user has equal access to the resources for developers. However, when it comes to submitting changes to github, they may get a bit stuck without simplicity.
   This simpler it is to collaboate on the development of DATRO. the more regular users should participate in the technological and business development.   
  

### Tip when working on this branch offline

1. Make a folder called `datro` in your webserver:
   e.g. `/var/www/html/datro`
  
   Then run the command: 
   `git init && git add remote origin github.com/unclehowell/datro.git && git pull origin gh-pages`
   
   Now when you visit your web browser you can preview any changes you make offline 
   e.g. `http://localhost/datro`

2. To use atom for code editing you'll need to run this command 
   `find /var/www/html/datro -type f -exec chown username:username {} \;`

3. Bulk find replace comes in handy on static websites with multiple pages and no cms:
   `find ./ -type f -exec sed -i 's/old-word/new-word' {} \;`

4. Navigating between git repository directories with zsh can be slow. This command solves that:
   `git config --add oh-my-zsh.hide-dirty 1`
   Alternatively you can make the flag change global:
   git config --global --add oh-my-zsh.hide-dirty 1
      

