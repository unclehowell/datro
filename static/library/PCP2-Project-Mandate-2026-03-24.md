Project Mandate: Fix PCP2 Enquiry Form Payload Delivery

Date: 2026-03-24
Owner: Engineering Team (PCP2 webapp)
Sponsor: Product Owner / datro

Purpose
- Restore reliable delivery of enquiry payloads from datro/static/pcp2 webapp to upstream (r2r.theclaimsystem.co.uk) so user enquiries complete and funnel into claims flow.

Background
- The enquiry form on /static/pcp2 appears to submit a FormData POST to /api/submit-claim in the Cloudflare Pages Functions layer. Users report that payloads are not arriving at the upstream affiliate endpoint.

Objectives
- Investigate and fix the root cause preventing outbound POSTs to the upstream API.
- Ensure payloads follow upstream schema (JSON payload with signature/device_session_id, addresses array, etc.).
- Add robust logging and unit/integration steps to detect regressions.

Scope (In-scope)
- Inspect frontend /src/components/ClaimForm.tsx submission logic and network calls.
- Inspect serverless function at functions/api/submit-claim.ts for parsing, header handling, formatting, and upstream request.
- Test end-to-end deployment on staging and confirm successful upstream delivery.
- Add acceptance tests and monitoring (log entries, failed-delivery alert) where possible.

Out-of-scope
- Changes to upstream API behavior or contract beyond payload format updates required for compatibility.

Success criteria
- Submissions from the Claim form reach the upstream endpoint with status 200 and success body (or redirect for authentication-required flow) in 95% of manual test runs.
- Error handling surfaces actionable logs in Functions logs and the site shows a meaningful message to users for failures.

Constraints & Assumptions
- Access to VITE_API_KEY / affiliate credentials is available to the deployment environment.
- Cloudflare Pages Functions are used as serverless runtime.

Stakeholders
- Owner: Engineering Team
- Sponsor: Product / Ops
- QA: Testing Team

Deliverables
- Fixed submit-claim function and/or frontend changes
- Project Plan & Highlight reports in datro/static/library
- Tests and deployment notes

Approval
- Proceed with investigation and fix. If changes require secrets or infra-level changes, seek approval before applying in production.
