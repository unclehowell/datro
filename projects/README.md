# projects.bucklerfamily.estate — PRINCE2 site (cloned from fcg)

Branch `projects` of unclehowell/datro was cloned from `fcg` on 19 Oct 2026. The fcg Edge CMS engine (`fcg/`) is kept as-is for reference;
this site is the static export in `projects/public/`, served by Cloudflare Pages project `bucklerfamily-projects`
(build command `node projects/check.mjs`, output directory `projects/public`).

Content: every PRINCE2 / project-management page of greathousefarmwiki.wordpress.com, copied unchanged (relative links made absolute
to the wiki; EV / GHF-E evidence ids linked to the wiki's evidence pages). Each page links back to its wiki original.
`check.mjs` fails the build on personal contact details or banned phrases.

Theme (20 Oct 2026): dark, Starlink-style look (black background, thin uppercase headings, ghost buttons, fixed nav that turns solid on scroll).
Shared files: `projects/public/assets/theme.css`, `theme.js`, self-hosted Barlow font (SIL OFL, `assets/fonts/OFL.txt`).
`projects/theme/apply.mjs` swaps each page's old inline `<style>` for the shared stylesheet and adds the nav/hero/footer wrappers; it never changes content, headings, titles or links, and is idempotent. `check.mjs` runs it first, so any page regenerated in the old plain format is themed at build.
