# Changelog
It's expected that developers log all changes to this directory, in this CHANGELOG.md file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [pcp.01] - Q1/2026

### Changes
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

