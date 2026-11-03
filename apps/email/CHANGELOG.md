# Changelog — Great House Farm FOI & EIR Mail Archive

## [2.0.2] - 2026-10-24

### Improved
- Add a high-contrast `:focus-visible` ring to links, buttons, form controls and interactive elements across the public mail archive.
- Update the Worker’s immutable `PAGE_URL` pin to the exact committed HTML revision so future Worker deployments serve the released UI.

### Validated
- The Worker reads the Wayback public catalogue as canonical and supplements it with the explicitly scoped case-mail catalogue. The UI labels the archive as read-only and does not imply that it can send or receive mail.
- Source code was committed only; Cloudflare Worker deployment and live endpoint smoke tests were not performed here.
