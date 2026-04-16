New function for netlify branch.  

Until Sep 2021 DATRO's primary domain was datro.xyz and the secondary was datro.world  
As of Sep 2021 we're attempting to put everything on one domain.  

This is challenging because the poin of the second domain in the first place was to overcome challenges.  
These challenges included:  

a) github pages only allows one url to point to one branch - and we wanted to spread content across 2 branches to keep the branch sizes from being too excessive  
b) netlify enabled us to overcome the github limitation, having a second domain point to a 2nd branch, but there was billing involved and we want to keep DATRO overhead free  
c) we managed to stay under netlify's billing threshold by only publishing content to the corresponding branch, which didn't update so frequently  
   the websites and source code for the software updates frequently, but archived documents and large media files didn't update so often and so they were the types of content on the 2nd branch  
d) netlify also overcame the issue of broken ssl certificates which happened when frame-forwarding was tried. 


Before explaining the plan moving forward it's important to lay out the objectives here e.g. the goal:  

1. everything on 1 domain name moving forward  
2. 2 branches containing all the website content remain in the github monorepo ('gh-pages' and 'netlify'),  
   and the content will need to remain accessible from two different urls, but this time these 2 urls will need to be on the same domain/tld (datro.xyz)  

(easily solved by introducing the subdomain world.datro.xyz to replace the function of datro.world,   
 and introducing sub-subdomains e.g. library.world.datro.xyz to replace existing subdomains e.g. library.datro.world (also gui.world.datro.xyz replaces gui.datro.world etc))  

 - The gui on the branch 1 (gh-pages), on the url datro.xyz/static/gui, already (serverlessly) serves 2 types of content depending on the url in the address bar  
 - a simple bit of javascript basically looks at the address in the address bar to determine the appropriate content to serve during pageload/ refresh   
 - the reason for this was so that demo data is served if the HotspotBnB GUI is accessed online (via the url datro.xyz/static/gui or gui.datro.world / soon to be gui.world.datro.xyz)  
 - but when the GUI is running on the raspberry pi locally, with the hostname .local in play, the GUI will serve the actual screens containing installed webapps, instead of demo data  
 - this allowed us to focus on 1 GUI instead of trying to maintain 2. Now we're basically going to have to make the GUI serve a 3rd load of content,   
 - performing the function of what the netlify GUI/wrapper did, when it was accessed from datro.world  
 - first it might be worth re-iterrating what the datro.world/GUI/wrapper did. It was a sister/custom version of hotspotBnB GUI that instead of displaying apps or demo's of apps, it showcased DATRO's assets.   
 - What was easy with this previous solution, which is about to become more complicated, was the navigation icons and titles, which were hardcoded, but will now need to become dynamic depending on the url in the address bar.  
 - Previously the two GUI's (datro.world's on the netlify branch and HotspotBnB's on the gh-pages) had hardcoded titles and icons and only the iframe content was dynamic. Now it all needs to be dynamic (and simultaniously serverless too).   
 - There's definately a growing and overdue need to migrate to ReactJS and make this all a progressive webapp, but this will need to wait for StartUp/Series A funding and a bigger army of code monkeys.  

In order to go a step further on what was, we plan to do the following (but this plan may evolve) since it's not tried and tested yet:  

1. Totally forget the second domain, that ideas the past. our goal is everything on 1 domain. Obviously.  
2. Start simple. Get world.datro.xyz to show the 2nd ("netlify) branch and wrapper (sister version of the HotspotBnB GUI)

#  Easy enough. Just updated the CNAME in the netlify branch to world.datro.xyz. Removed datro.world from netlify itself. Added a CNAME in cloudflare containing the subdomain world and target: datro.netlify.app
#  Now when you enter world.datro.xyz you end up seeing datro.netlify.app (the netlify branch) and a valid security certificate from cloudflare (netlify does however complain since it wants to be in charge of ssl) 

3. Netlify was good for DNS management, because it would allow multiple subdomains. But since we're now using subsub domains and cloudflare, we need to see if it's possible to point multiple urls to the datro.netlify.app. 
3. Next it's looking like we need the content of the netlify branch to look at the url in the address bar and respond accordingy. 
3. Next it's looking like we need the HotspotBnB GUI on the gh-pages branch (url: datro.xyz/static/gui) to check for a 3rd type of domain. 
