Project Plan: PCP2 Enquiry Form Fix

Objectives
- Identify and fix the payload delivery failure from PCP2 enquiry form to upstream affiliate.

Tasks
1. Triage (1-2 hours)
   - Confirm reproduction locally and in staging.
   - Check Cloudflare Function logs for errors and inspect recent commits.
2. Patch function (2-4 hours)
   - Ensure FormData parsing, field normalization, and JSON body formation are correct.
   - Redact sensitive env values from logs.
   - Ensure content-type header is application/json when posting to upstream.
3. Update frontend if needed (1-2 hours)
   - If upstream requires JSON instead of FormData, convert submission to JSON, or set explicit field names.
4. Test & QA (2-4 hours)
   - Run 20 submissions across typical browsers and devices.
   - Confirm upstream returns expected success responses and Cloudflare logs show successful delivery.
5. Deploy & Monitor (1 hour)
   - Deploy to production and monitor logs for 24 hours.
6. Documentation & Papertrail (ongoing)
   - Publish mandate, brief, plan, and highlight reports to datro/static/library.

Acceptance Criteria
- 20 successful submissions in staging with upstream 200 and expected body.
- No sensitive keys in function logs.

Owner: Assigned Engineer
Timeline: 2 working days
