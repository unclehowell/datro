# Detailed Changelog

This file contains extensive technical details about each issue, bug, and fix discovered during development. See main `CHANGELOG.md` for summary entries that reference this detailed log.

---

## REORG - Mar-27-2026

### Architecture Migration

**FROM:** Cloudflare Pages Advanced Mode with `_worker.js`
**TO:** Cloudflare Pages Functions Mode (`functions/api/`)

#### Why This Matters

| Aspect | Worker Mode (_worker.js) | Functions Mode (functions/api/) |
|--------|-------------------------|--------------------------------|
| Entry point | `_worker.js` in project root | `functions/api/*.ts` |
| Route handling | Manual in worker | Automatic file-based routing |
| Build output | Worker bundle in dist/ | Functions copied to dist/functions/ |
| Cloudflare config | Requires "Advanced" mode | Default Pages Functions mode |

#### Changes Made

1. **Removed:** `_worker.js` - No longer exists in project
2. **Removed:** `_routes.json` - Not needed for Functions mode
3. **Verified:** `build` script correctly copies `functions/` to `dist/`:
   ```json
   "build": "vite build && cp -r functions dist/"
   ```
4. **Current structure:**
   - `functions/api/submit-claim.ts` - Form submission handler
   - `functions/api/ping.ts` - Health check endpoint
   - `dist/` contains: `index.html`, `assets/`, `functions/`

---

## Mar-27-2026 - FLYWHEEL LOOP #1

### Issue: FormData vs JSON Mismatch

**Main CHANGELOG Reference:** See entry "Mar-27-2026 - FLYWHEEL #1: Fix FormData parsing"

#### Root Cause Analysis

The frontend `ClaimForm.tsx` sends form submissions using `multipart/form-data` (FormData API), but code assumed `application/json` content type.

**Frontend Code (ClaimForm.tsx):**
```javascript
const submissionData = new FormData();
submissionData.append('title', formData.title);
submissionData.append('first_name', formData.first_name);
// ... more fields ...
submissionData.append('signature_image', sigData);

const response = await fetch(`/api/submit-claim`, {
  method: 'POST',
  body: submissionData
  // Note: No Content-Type header - browser sets multipart/form-data automatically
});
```

**Expected Function Code:**
```javascript
// MUST handle FormData, not JSON
const body = await request.formData();
const title = body.get('title');
const firstName = body.get('first_name');
// etc.
```

#### Real-time Log Capture (Vehicle Subdomain)

```json
{
  "event": {
    "request": {
      "url": "https://vehicle.financecheque.uk/api/submit-claim",
      "method": "POST",
      "headers": {
        "content-type": "multipart/form-data; boundary=----WebKitFormBoundaryPg2i8Ylk7y0iGNOr"
      }
    },
    "response": {
      "status": 500
    }
  }
}
```

#### False Claims Documented

1. **"vehicle.financecheque.uk form submission working"** - FALSE
   - The curl test used JSON content-type which bypassed the FormData issue
   - Real browser form submission always returns 500
   - This was tested on: 2026-03-27 00:43:07 - returned 500

2. **"API returns OTP challenge"** - MISLEADING
   - Only achieved via curl with JSON payload, not actual form
   - Actual form submission never reaches R2R API due to parsing error

---

## Mar-27-2026 - FLYWHEEL LOOP #0 (Pre-Documentation)

### Issue: AI Hallucination - False Success Claims

**Main CHANGELOG Reference:** See "AI Hallucination / Deception / Error Log"

#### Summary

The session summary incorrectly claimed:
- "vehicle.financecheque.uk → carfinance-new.pages.dev (NOW WORKING)"
- "R2R API works via these domains - returns OTP challenge"

Both claims were false. The actual state:
- Form always returned 500 error
- Worker could not parse the request body
- R2R API was never successfully called from the form

#### Root Cause

- Used curl with manual JSON to test API (bypassing the actual form)
- Confirmed curl test worked but didn't verify actual form submission
- Failed to check real-time logs which showed 500 status

---

## Current Testing Methodology

### Curl Test (JSON - Works when Content-Type is set)
```bash
SIG=$(base64 -w0 example.png)
curl -X POST "https://vehicle.financecheque.uk/api/submit-claim" \
  -H "Content-Type: application/json" \
  -H "API-KEY: 8714de54-a64d-441b-8ef9-4a64318380b0" \
  -d "{\"title\":\"Mr\",\"first_name\":\"John\",\"last_name\":\"Doe\",\"signature\":\"data:image/png;base64,$SIG\"}"
```

### Browser Test (FormData - Must be tested)
- Navigate to https://vehicle.financecheque.uk/claim
- Fill in form fields
- Sign in signature pad
- Submit form
- Check real-time logs for response status

---

## API Documentation Notes

### R2R API Requirements (from testing)

1. **Endpoint:** `https://r2r.theclaimsystem.co.uk/api/v1/affiliate/{affiliateId}`
2. **Method:** POST
3. **Headers:**
   - `Content-Type: application/json`
   - `API-KEY: {api_key}`
4. **Signature Format:** Must use `data:image/png;base64,` prefix + base64 string
5. **Minimum Required Fields:**
   - title, first_name, last_name
   - email, phone, date_of_birth
   - addresses (array with buildingNumber, thoroughfare, townOrCity, postcode)
   - signature (PNG base64 with data URL prefix)
   - client_ip, user_agent, session_id

---

## Affiliate IDs

- **Test Affiliate:** a4429de54-a64d-441b-8ef9-4a64318380b0
- **API Key:** 8714de54-a64d-441b-8ef9-4a64318380b0

---

## Cloudflare Configuration

- **Pages Project:** carfinance-new (primary)
- **Functions Mode:** Yes (not Advanced/Worker mode)
- **Custom Domain:** vehicle.financecheque.uk (needs verification)
- **Deployment:** GitHub gh-pages branch
