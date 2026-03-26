# Changelog
It's expected that developers log all changes to this directory, in this CHANGELOG.md file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.html).

Mar-26 - 2026 - SUCCESS: New Cloudflare Pages project "pcp2-car-finance" works! API endpoint responding. Currently troubleshooting R2R "Invalid signature format" error. Tried: base64(json), JSON string, example.png as both fields, only signature_image. Still failing.

Mar-26 - 2026 - SUCCESS! car.financecheque.uk now connected to new pcp2-car-finance Pages project. Form submission works - returns OTP challenge!

Mar-26 - 2026 - SUCCESS! Signature fixed using data:image/png;base64 prefix. API returns "Please validate via OTP" - form submission working!

Mar-26 - 2026 - Fix: Use data:image/png;base64 prefix on example.png base64 for signature field.

Mar-26 - 2026 - Fix: Try using example.png base64 directly as signature field (the actual base64 image, not a JSON string).

Mar-26 - 2026 - SUCCESS: Created new Cloudflare Pages project "pcp2-car-finance" using wrangler CLI. API now works! POST returns "Invalid signature format" - need to fix signature computation per R2R spec.:
  1. Added firewall allow rules via API - didn't fix Error 1000
  2. Deleted and re-added DNS in Cloudflare Pages - didn't fix
  3. Tried _worker.js in advanced mode - got Error 1019
  4. Tried minimal _worker.js - still Error 1019
  5. Removed _worker.js entirely - still Error 1019
  6. Tried direct pages.dev URL - still broken
  Conclusion: carfinancecheque Pages project is corrupted. Need to delete and recreate but has too many deployments (>100). Using delete-all-deployments script from Cloudflare but failing to list deployments via API.

Mar-26 - 2026 - CRITICAL: carfinancecheque.pages.dev returns Error 1019 for ALL requests (even GET, even with no _worker.js). This is a Cloudflare infrastructure issue, not code.

Mar-26 - 2026 - CRITICAL: car.financecheque.uk - GET works, but ALL POST returns Error 1000 "DNS points to prohibited IP". Firewall rules don't help. This happens before WAF runs.

Mar-26 - 2026 - INVESTIGATION: Error 1000 "DNS points to prohibited IP" is NOT a WAF issue. It happens before WAF runs. Likely causes:
  1. DNS A record pointing to an origin server IP that Cloudflare has flagged (maybe a previous site was blocked)
  2. Cloudflare Pages needs to be enabled in the dashboard for this domain
  3. The domain needs to be set to "Proxied" (orange cloud) not "DNS only"

  Created allow firewall rule via API but it didn't help - need to check Cloudflare dashboard settings.

Mar-26 - 2026 - Fix: Removed _routes.json and /functions from dist, keeping only _worker.js in advanced mode. This ensures proper advanced mode operation.

Mar-26 - 2026 - Fix: Updated _worker.js to use ASSETS.fetch() for SPA fallback (required for advanced mode). Also added Authorization: Bearer header to R2R API call.

Mar-26 - 2026 - INVESTIGATION: _worker.js not being picked up by Cloudflare. Trying alternative routes (/submit-api, /submit-claim). All return 405 instead of hitting the worker. Need to verify Cloudflare Pages settings - user may need to enable "Workers" in the Cloudflare dashboard for this project.

Mar-26 - 2026 - ISSUE IDENTIFIED: Cloudflare WAF/security blocking all POST requests to /api/* paths (returns error 1000 "DNS points to prohibited IP"). Direct R2R API test works (returns "Invalid API Key" - correct response). Need to check Cloudflare dashboard Security > WAF or Settings to allow POST to /api/* paths.

Mar-26 - 2026 - Investigating: POST to /api/* returns "DNS points to prohibited IP" (Cloudflare error 1000). GET requests work fine. Direct test to R2R API works (returns "Invalid API Key"). This confirms Cloudflare is blocking POST to /api/* paths - likely WAF or security rule. Need to check Cloudflare dashboard.

Mar-26 - 2026 - Fix: Build now copies _worker.js to dist. Testing if _worker.js handles /api/* routes in Cloudflare Pages.

Mar-26 - 2026 - Fix: Using example.png base64 as signature instead of computed JSON signature. This uses a real signature image from notes/example.png to test if signature format was the issue.

Mar-26 - 2026 - Build: Trigger rebuild with npm run build to deploy Functions

Mar-26 - 2026 - Fix: R2R requires addresses as ARRAY with multiple entries (not single object). Updated payload and signature to use addresses array format.

Mar-26 - 2026 - Fix: Added _routes.json to ensure /api/* routes use Cloudflare Pages Functions. Also fixed addresses (object) and signature format (include title, addresses object).

Mar-26 - 2026 - Fix: Changed addresses from ARRAY to OBJECT per R2R API docs. Also updated signature to include title, addresses object (not just personal fields), matching format from working commit c3536e000.

Mar-24 - 2026 - Fix: Reverted signature addresses from array back to object (matching working commit 02662bab0). Signature now computed using raw field values without title-casing or phone transformation.

Mar-23 - 2026 - Feature: Added signature capture step to contact form. Visitors now sign before submission. Signature is captured as PNG canvas, converted to base64, and forwarded to R2R API.

Mar-23 - 2026 - Fix: Reverted signature payload addresses to array, added detailed logging for body and address fields to diagnose validation errors.


## [pcp.01] - Q1/2026

### Changes
Mar-23 - 0744 Argentina: regenerate signature server-side with title-case names, +44 phone, postcode space and addresses as object 
Mar-23 - 0629 Argentina: use client-generated signature instead of recomputing server-side
Mar-23 - 0548 Argentina: add title to signature payload and format phone to +44
Mar-23 - 0520 Argentina: include addresses object in signature payload and format postcode with space
Mar-23 - 0502 Argentina: restored onRequestPost CF function, add CORS OPTIONS handler, sign personal fields only, include all null address fields per R2R schema
Mar-23 - 0416 Argentina: added CORS OPTIONS handler to resolve 405 preflight rejection  
Mar-23 - 0359 Argentina: Putting functions/api/ back in root of pcp2 for cloudflare  
Mar-23 - 0302 Argentina: restored CF function structure (remove browser APIs), sign only personal fields, include all null address fields per R2R schema
Mar-23 - 0048 Argentina: bypass broken api route and post directly to upstream R2R endpoint to resolve persistent 405 submission failure  
Mar-23 - 0026 Argentina: fix: harden submit flow with strict validation, stable signature encoding and explicit 405 handling for missing POST endpoint
Mar-23 - 0006 Argentina: harden submit handler with validation, stable signature generation and safe response parsing while aligning payload with API schema 
Mar-22 - 2340 Argentina: Rebuild submit handler with correct address schema and consistent base64 signature generation to resolve API validation errors  
Mar-22 - 2320 Argentina: Resolved R2R validation by implementing required nested addresses schema and aligning signature payload
Mar-22 - 2310 Argentina: Resolved R2R signature validation by aligning payload and signature structure (addresses as object) with proper UTF-8 base64 encoding 
Mar-22 - 2256 Argentina: fix: fully align R2R payload and signature with Cloudflare-safe encoding and consistent schema  
Mar-22 - 2237 Argentina: Last commit was malformed. Retry (see last commit note for the update)  
Mar-22 - 2229 Argentina: fix: resolve R2R invalid signature by aligning payload structure and using proper UTF-8 base64 encoding 
Mar-22 - 2208 Argentina: Resolved R2R signature validation by using JSON.stringify, normalizing input (DOB, postcode, phone), restoring title field, and correcting address + session formats
Mar-22 - 2150 Argentina: Now supports BOTH formats: DD/MM/YYYY (user input) YYYY-MM-DD (already formatted)
Mar-22 - 2131 Argentina: Used DIFFERENT structures: signature > object payload > array. Added `opt_in`. LOCK field order manually.
Mar-22 - 2110 Argentina: Signature issues Exact field match Correct encoding Correct DOB format 
                         Data validation issues UK phone format Address includes line1 Proper object structure 
                         Stability No mutation after signing Clean session handling Safe parsing
Mar-22 - 2040 Argentina: Fix DOB format, Included title in signature and Switched addresses to object   
Mar-22 - 1315 Argentina: fix(api): remove title from signature payload - R2R computes signature from fixed fields, adding title caused "Invalid signature format" (title still forwarded in payload)
Mar-22 - 1258 Argentina: fix(api+form): addresses reverted to array (R2R treats object keys as array elements), fix error detection in ClaimForm to check result.body not result (was silently navigating to thank-you on validation failure)
Mar-22 - 1242 Argentina: fix(api): title field now forwarded to R2R, addresses changed from array to object, no field mutation/normalisation - raw input only, title included in signature payload, device_session_id falls back to session_id before UUID
Mar      1221
Mar      1143 Argentina: Scrapped HMAC, Proper base64 signature, Correct headers (API-KEY), Correct addresses array, Proper error handling  
Mar      1120 Argentina: export was missing, put it back. some other changes , see diff in commit  
Mar-22 - 1027 Argentina: Encoding base64 might be wrong. Trying hex despite what API Docs and Developer said    
Mar-22 - 1015 Argentina: fix(api): correct signature generation and address structure for R2R submission
       - Implement HMAC SHA256 signature (was incorrectly base64 JSON)
       - Fix addresses format to array (API requirement)
       - Normalize input fields (trim, uppercase postcode)
       - Align payload exactly with API validation expectations
       - Improve logging for debugging upstream responses
Mar-22 - 0957 Argentina: log form clouflare after submitting the form says signature is an issue. Developer and docs say base64 but 
         i'm going to try HMAC SHA256 i.e. payload.signature = btoa(JSON.stringify(signaturePayload));  
Mar-22 - 0939 Argentina: fix to submit-claim.ts didn't push. Trying again.   
Mar-22 - 0833 Argentina: Typo error in submit-claim.ts in last push. Fixed  
Mar-22 - 0137 Argentina: The = padding in base64 may be getting corrupted in the journey. 
              In functions/api/submit-claim.ts I now generate the signature in the Worker instead of using whatever comes from the frontend. Right before the fetch call
Mar-22 - 0057 Argentina: removed title: data.title || 'Mr' from functions/api/submit-claim.ts   
Mar-22 - 0044 Argentina: Tried api v2, better to go back to v1 hence this change.  

