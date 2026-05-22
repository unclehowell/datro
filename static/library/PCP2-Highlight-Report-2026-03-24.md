Highlight Report: PCP2 Enquiry Form Fix - Initial Investigation

Date: 2026-03-24
Owner: Engineering Team

What happened
- Users reported that the enquiry form on the PCP2 webapp was not delivering payloads to the upstream affiliate endpoint.

Actions taken
- Inspected frontend ClaimForm submission: it builds a FormData payload and POSTs to /api/submit-claim.
- Inspected Cloudflare Pages Function submit-claim.ts: discovered parsing logic for FormData and JSON; upstream forwarding to R2R endpoint.
- Added enhanced logging and defensive parsing to the function; ensured VITE_API_KEY presence is checked and surfaced.
- Published Project Mandate, Brief, Plan to datro/static/library.

Current status
- Code patched in functions/api/submit-claim.ts to add logging and missing-env handling.
- Papertrail created in datro/static/library with mandate, brief, plan.

Next steps
- Reproduce end-to-end locally or in staging by running Cloudflare Pages dev or deploying to a staging Pages branch with environment variables.
- Run test submissions from the Claim form using developer tools (network tab) to capture request and function logs.
- If upstream rejects requests, adjust payload formatting or header set accordingly.
- After verification, deploy to production and monitor logs for 24 hours.

Risks
- API key absence in environment will block requests (now fails fast with clear error). Avoid logging secrets.

