Project Brief: PCP2 Enquiry Form Failure

Summary
- The PCP2 enquiry form at datro/static/pcp2 is not delivering payloads to the upstream affiliate endpoint r2r.theclaimsystem.co.uk. Investigate root cause and implement fix.

Key Issues Observed
- Frontend sends FormData to /api/submit-claim.
- Cloudflare Function parses request and forwards JSON to upstream.
- Logs show initial parsing but may not be mapping FormData keys as expected; additional logging inserted.

Approach
1. Reproduce locally using Cloudflare Pages dev or fetch to the functions endpoint.
2. Confirm frontend is actually calling /api/submit-claim (check Console network tab and logs) and that CORS and OPTIONS preflight are handled.
3. Inspect function environment variables: VITE_API_KEY and VITE_AFFILIATE_ID.
4. Validate that the payload matches upstream schema and content-type is application/json.
5. Add defensive parsing for both JSON and FormData and ensure signature field is base64 and device_session_id present.
6. Add logging and return upstream body to entrance logs for QA.

Risks
- Exposing API-KEY in logs must be avoided. Redact keys in logs.
- Upstream may reject missing fields or invalid formats.

Schedule (high level, 2-day plan)
- Day 1: Investigation, reproduce, small patch to function to handle FormData correctly and improve logging. Create acceptance tests.
- Day 2: QA, deploy to staging, run 20 test submissions, deploy to production, publish highlight report.

Required Resources
- Access to repository (present), Cloudflare Pages deploy credentials, environment secrets.

Next Steps
- Engineer to reproduce and produce a patch branch. 
- QA to run test matrix.

