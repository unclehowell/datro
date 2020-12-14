# Hotspotβnβ websites

## This directory contains the Hotspotβnβ websites

1. The Hotspotβnβ websites are mainly all administered in wordpress on a localhost.
   They're then published by exporting them (from a wp plugin) directly into a subdirectory of a public github repo (the gh-pages development branch).

2. The repo containing all the static websites is the equivalent of our software source-code monorepo e.g. everything in one big directory

3. There's a simple website in the top level directory, which is designed to be a super fast loading (well SEO'd) minimal landing page. 
   From this main page, visitors can navigate deeper into the websites in the subdrectories of the repo e.g. docs, store,blog etc  

4. Netlify enables us to view the development branch using a subdomain e.g. beta.Hotspotβnβ.com (and the 'gh-pages'(the main) branch) with Hotspotβnβ.com (and .co.uk)
   Once a development milestone is reached, the gh-pages-dev branch is merged into the gh-pages branch (the main one). 

5. The source code for the wordpress websites and databases can be found in the master repo (sprase-check them out). 
   After exporting changes to wp websites (to the gh-pages-dev branch, using the wp2static plugin) the source of the db and fileserver should be updated.
   To update the source of the database and fileserver, the 2 should be downloaded, stripped of security credentials and pushed to the master-dev branch. 

6. This is an 'ouroborus' eco-system, since the client can be used to host the websites (as applications). And export changes to the public website, as well as updating the source code.
   Once the source for the website application has been updated on the public repo, the clients on the whole network can be alerted to update. 

7. Developers working on Hotspotβnβ can benefit greatly from the webGUI (dashboard) of Hotspotβnβ and the devices command terminal (which we don't disable).
   A reguar Hotspotβnβ user has equal access to the resources for developers. However, when it comes to submitting changes to github, they may get a bit stuck without simplicity.
   This simpler it is to collaboate on the development of Hotspotβnβ. the more regular users should participate in the technological and business development.   
  

      

