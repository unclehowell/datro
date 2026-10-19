# projects.bucklerfamily.estate — independent estate-wide PRINCE2 site

Branch `projects` of unclehowell/datro was cloned from `fcg` on 19 Oct 2026. The fcg Edge CMS engine (`fcg/`) is kept as-is for reference;
this site is the static export in `projects/public/`, served by Cloudflare Pages project `bucklerfamily-projects`
(build command `node projects/check.mjs`, output directory `projects/public`).

Scope (20 Oct 2026): PRINCE2 planning for the whole bucklerfamily.estate digital estate. Estate pages live under `/estate/` (mandate & brief,
business case, PID, roles, PBS, asset register + `asset-register.json`, stage plans, risk/issue/quality registers, communication plan,
highlight reports, lessons log). The 51 Great House Farm case pages (copied from the hosted wiki on 19 Oct 2026) keep their addresses and are
grouped under `/workstreams/evidence-recovery/`.

Independence: `projects/estate/build.mjs` (run by check.mjs after the theme) turns every link to the hosted wiki into a link to the local copy
of that page, or into plain text (e.g. "EV-0249"), rewrites the shared nav/footer, and the check fails the build on any remaining link to it.
`check.mjs` fails the build on personal contact details or banned phrases.

Theme (20 Oct 2026): dark, Starlink-style look (black background, thin uppercase headings, ghost buttons, fixed nav that turns solid on scroll).
Shared files: `projects/public/assets/theme.css`, `theme.js`, self-hosted Barlow font (SIL OFL, `assets/fonts/OFL.txt`).
`projects/theme/apply.mjs` swaps each page's old inline `<style>` for the shared stylesheet and adds the nav/hero/footer wrappers; it never changes content, headings, titles or links, and is idempotent. `check.mjs` runs it first, so any page regenerated in the old plain format is themed at build.
