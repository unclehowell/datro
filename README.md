# Netlify Branch ReadMe

## Nomenclature
Whereas the GitHub branch is entitled `gh-pages`, since it depends on gh-pages, 
this branch depends heavily on the Netlify service - so we've entitled it `netlify`. 

## Intro
A single website portal to act as a reception page, from which to nagigate between all the websites contained in the gh-pages branch.
Hosted on the domain `datro.world`. Futhermore, if you enter any of the url's for any of the DATRO Consortium websites,
You will be directed to this reception page first, then this reception page will present the corresponding website within a container (iframe). 
Using the Hotspotβnβ dashboard gui concept, website visitors can access a hidden 'top bar' menu, from which to navigate between websites.


## Purpose
The reason this webpage is on a seperate branch to gh-pages, is part of an ethical hack to achieving a few desired goals.
    - All websites for the DATRO Consortium must be hosted on GitHub Pages
    - User must be directed to the corresponding website for the url they've entered 
      e.g. hotspotbnb.com > datro.xyz/static/hbnb/
           datro.xyz > datro.xyz/static/datro/
           surfonwave.com, wavetele.com, makeitwave.com etc > datro.xyz/static/wave/ 
           etc etc etc

## Issue 
    - GitHub Pages is only really for one website and URL
    - Netlify allows multiple urls and branches etc to be used, but there's a fee charged upon each compile
    - GoDaddy and Cloudflare allow frame & mask forwarding, but the security is compromised

## Policy 
    - Zero overheads - This means no hosting fees, no exceptions, no nada - EVER! 
    - No half ass hacks, where the security certificate fails for the website visitor etc. 
    - Stay within the bounds of the user agreements/ terms of service with the providers e.g. netlify, cloudflare, github etc

## Background
    - we have a main website `datro.xyz`, then a few seperate urls for each of the solutions we're developing.
    - all the websites are contained in this single monorepo (the gh-pages branch). And hosted using GitHub Pages.
    - Github only allow one url and one webpage per repository. Netlify gets around this, but the charge per each website change e.g. build>
    - We tried to 'url/ mask -forward' our urls to the various seperate sites in our gh-pages subdirectories, where they're held.
    - Sadly the visitor is either redirected to a link they didn't enter and/or presented with the site, but no ssl/ browser safety.

### Our Solution
    - So we made this 'netlify' branch, to host a basic reception website, with Netlify, and we now point all our domains to it.
    - So when the visitor enters any of our urls, they're presented a choice of which website they're trying to reach.
    - When vistors chose a website, this reception page loads the gh-pages branch subdirecty (containing the page), but in the same screen.
    - So the security certificate doesn't break and Netlify costs are zero, because the reception page is simple and rarely changed.
    - Furthermore, this "platform reception page" lets us access and preview pre-production websites and it's ideal for upselling/ crossell>
    - Not using Netlify to its full ability, to remain "overhead-free" - means we can't preview a `gh-pages-dev` (development) branch.
    - That said, we can still have a `gh-pages-dev` branch, but it's not as fun without being able to preview it, on say beta.url.tld.
    - So instead we've made a development directory within the 'gh-pages' branch, containing duplicates, but with `-dev` after their names.>
    - Now developers can checkout the development copy of the files, make changes and propose them back, as oppose to a -dev branch.
    - And instead of the moderator(s) merging the `gh-pages-dev` branch over the top of the main branch,
    - the moderator simply overwrites the website directory with the corresponding/ approved "development" website directory.
    - This bastardised methodology is only for the two above "platform" branches, the software branches use GitHub's recommended methodolog>




