# Great House Farm Wiki — mobile Read more enhancement

Branch: `ghf-mobile-read-more`

## What this does
A Cloudflare Worker proxy prototype that fetches the public WordPress wiki and injects an accessible mobile-only two-line clamp with Read more / Read less controls. It does not rewrite WordPress evidence text or save changes to the source pages.

## Required before public deployment
1. Create a Worker named `ghf-mobile-read-more` from `worker.js`.
2. Set Worker variable `WP_ORIGIN=https://greathousefarmwiki.wordpress.com`.
3. Enable a `workers.dev` preview or attach a dedicated custom hostname.
4. Test pages containing long paragraphs, evidence quotations, lists, tables, images, embedded video, and the mobile navigation.
5. Fix URL/canonical/navigation behaviour before replacing or redirecting any existing public URL.

## Prototype visibility
The Worker sends `X-Robots-Tag: noindex, nofollow` on responses so a test proxy is not indexed as a duplicate of the original source. This does not change the existing WordPress site and is not evidence that the proxy is ready for production.

## Important limitation
This is not yet a production-ready mirror. WordPress-generated links may navigate to the original WordPress domain, some pages/assets may depend on cookies or origin checks, and a custom hostname requires an available domain/zone and a Cloudflare route. Do not replace the current wiki URL until those checks pass.
