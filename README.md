# Netlify branch Readme


### Nomenclature
'netlify' (this branches name) is commonly refered to as "the platform reception page" or the "gh-pages sister branch". 
    The reason we have this branch is to hack our way to a achieving a few desired goals:
    - we have a main website `datro.xyz`, then a few seperate urls for each of the solutions we're developing.
    - all the websites are contained in this single monorepo (the gh-pages branch). And hosted using GitHub Pages.
    - Github only allow one url and one webpage per repository. Netlify gets around this, but the charge per each website change e.g. build>
    - We tried to 'url/ mask -forward' our urls to the various seperate sites in our gh-pages subdirectories, where they're held.
    - Sadly the visitor is either redirected to a link they didn't enter and/or presented with the site, but no ssl/ browser safety.
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




