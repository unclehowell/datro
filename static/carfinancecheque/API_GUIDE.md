# R2R API Guide - PCP2 Form Submission

## Overview

This guide documents the R2R (Right to Recall) Affiliate Submission API requirements based on PDF documentation and live testing.

## API Endpoint

```
POST https://r2r.theclaimsystem.co.uk/api/v1/affiliate/{affiliate_id}
```

### Test Credentials

| Field | Value |
|-------|-------|
| Affiliate ID | `a4429cda-e36a-472a-8291-ae01a49349d8` |
| API Key | `8714de54-a64d-441b-8ef9-4a64318380b0` |

## Headers

```http
Content-Type: application/json
API-KEY: 8714de54-a64d-441b-8ef9-4a64318380b0
```

## Request Payload

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| title | string | Person title | "Mr", "Mrs", "Miss" |
| first_name | string | First name | "John" |
| last_name | string | Last name | "Doe" |
| email | string | Email address | "john@example.com" |
| phone | string | UK phone number (with +44 prefix) | "+447503456789" |
| date_of_birth | string | ISO date format | "1985-06-20" |
| address | object | Single Address object | See below |
| signature | object | Signature object with payload array and base64 signature | See below |
| ip_address | string | Client IP address (from cf-connecting-ip) | "203.0.113.42" |
| user_agent | string | Browser user agent | "Mozilla/5.0..." |
| session_id | string | Session identifier | "session_001" |

### Address Object Format

The `address` field is a **single object** (per API-update.pdf):

```json
"address": {
  "line1": null,
  "line2": null,
  "line3": null,
  "line4": null,
  "buildingName": null,
  "buildingNumber": "12",
  "thoroughfare": "High Street",
  "townOrCity": "London",
  "district": null,
  "postcode": "EC1A 1AA"
}
```

### Signature Object Format

The `signature` field is an **object** with payload array and raw base64 (NO data: prefix):

```json
"signature": {
  "payload": ["first_name", "last_name", "date_of_birth", "phone", "email", "address", "postcode"],
  "signature": "iVBORw0KGgo..."  // Raw base64, no data:image prefix
}
```

Each address object supports these fields:

| Field | Type | Description |
|-------|------|-------------|
| line1 | string | Address line 1 |
| line2 | string | Address line 2 |
| line3 | string | Address line 3 |
| line4 | string | Address line 4 |
| buildingName | string | Building name |
| buildingNumber | string | Building/house number |
| thoroughfare | string | Street name |
| townOrCity | string | Town or city |
| district | string | District |
| postcode | string | UK postcode |

**Note:** `example.json` shows addresses as a plain object (missing array brackets `[]`) - this is a typo. The correct format per R2R spec is an array.

### Signature Format (CRITICAL)

The signature MUST use the `data:image/png;base64` prefix:

```json
{
  "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAl...",
  "signature_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAl..."
}
```

**Common Error:** Using raw base64 without the prefix results in "Invalid signature format" error.

**How to generate:**
```bash
# Get base64 without line wrapping
SIG=$(base64 -w0 notes/example.png)

# Use in payload with prefix
"signature": "data:image/png;base64,$SIG"
```

## Complete Example Payload

This matches what `submit-claim.ts` sends to the R2R API:

```json
{
  "title": "Mr",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1985-06-20",
  "phone": "+447503456789",
  "email": "john.doe@example.com",
  "client_ip": "203.0.113.42",
  "user_agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
  "session_id": "session_001",
  "device_session_id": "uuid-here",
  "account_creation_url": "https://car.financecheque.uk/claim",
  "ip_address": "203.0.113.42",
  "address": {
    "line1": null,
    "line2": null,
    "line3": null,
    "line4": null,
    "buildingName": null,
    "buildingNumber": "12",
    "thoroughfare": "High Street",
    "townOrCity": "London",
    "district": null,
    "postcode": "EC1A 1AA"
  },
  "signature": {
    "payload": ["first_name", "last_name", "date_of_birth", "phone", "email", "address", "postcode"],
    "signature": "iVBORw0KGgo..."  // Raw base64, NO data: prefix
  },
  "opt_in": true
}
```

## Response - Success (OTP Challenge)

```json
{
  "timestamp": "2026-03-27 02:47:47",
  "message": "Please validate via OTP.",
  "challenge_id": "1a67c82a-72a1-4061-87c1-861cf35355f6",
  "status": "CHALLENGE"
}
```

## Response - Validation Error

```json
{
  "message": "Validation failed.",
  "errors": {
    "email": "Invalid email format"
  }
}
```

## Response - Signature Error

```json
{
  "error": "Invalid signature format"
}
```

## Response - API Key Error

```json
{
  "error": "Invalid API Key"
}
```

## Common Errors

### "Invalid signature format"

**Cause:** Signature base64 missing `data:image/png;base64,` prefix

**Fix:** Ensure signature field includes the full data URL prefix

### "Validation failed"

**Cause:** Missing required fields or invalid format

**Fix:** Ensure all required fields present with correct data types

## Testing Commands

### Test Directly to R2R API

```bash
# Get signature base64
SIG=$(base64 -w0 notes/example.png)

# Create payload (with address object and signature object format)
cat > /tmp/payload.json << EOF
{
  "title": "Mr",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1985-06-20",
  "phone": "+447503456789",
  "email": "john.doe@example.com",
  "ip_address": "203.0.113.42",
  "user_agent": "Mozilla/5.0",
  "session_id": "session_001",
  "device_session_id": "test-device-001",
  "account_creation_url": "https://car.financecheque.uk/claim",
  "address": {
    "line1": null,
    "line2": null,
    "line3": null,
    "line4": null,
    "buildingName": null,
    "buildingNumber": "12",
    "thoroughfare": "High Street",
    "townOrCity": "London",
    "district": null,
    "postcode": "EC1A 1AA"
  },
  "signature": {
    "payload": ["first_name", "last_name", "date_of_birth", "phone", "email", "address", "postcode"],
    "signature": "$SIG"
  },
  "opt_in": true
}
EOF

# Submit to R2R
curl -X POST "https://r2r.theclaimsystem.co.uk/api/v1/affiliate/a4429cda-e36a-472a-8291-ae01a49349d8" \
  -H "Content-Type: application/json" \
  -H "API-KEY: 8714de54-a64d-441b-8ef9-4a64318380b0" \
  -d @/tmp/payload.json
```

### Test via Local Server

```bash
curl -X POST "http://localhost:3000/api/submit-claim" \
  -H "Content-Type: application/json" \
  -H "API-KEY: 8714de54-a64d-441b-8ef9-4a64318380b0" \
  -d @/tmp/payload.json
```

## Notes

- **Affiliate ID:** `a4429cda-e36a-472a-8291-ae01a49349d8`
- **API Key:** `8714de54-a64d-441b-8ef9-4a64318380b0`
- The R2R API has a 2-minute rate limit per IP
- Signature must include `data:image/png;base64,` prefix
- Both `signature` and `signature_image` fields should contain the signature
- Session IDs should be unique per submission
- Client IP should be the actual visitor IP (not server IP)
- Phone numbers are formatted to include +44 prefix

---

# APPENDIX: Pre/Post-Fix Documentation

## FORENSIC ANALYSIS: Why It Took Days (Mar 26-28, 2026)

### The Truth

**The R2R API always worked.** The delay was caused by implementation bugs during architecture migration.

### Timeline

| Date | Time | Event | Result |
|------|------|-------|--------|
| Mar 26 | 20:12 | `_worker.js` with `data:image/png;base64,` prefix | ✅ API WORKING |
| Mar 27 | - | Migration to `functions/api/submit-claim.ts` | ❌ BROKE IT |
| Mar 27-28 | - | 6 flywheel iterations to re-discover fix | ✅ NOW WORKING |

### Pre-Fix (Broken Implementation)

```javascript
// WRONG: Missing data:image prefix
const signature = base64Data;  // Would fail with "Invalid signature format"

// WRONG: addresses as object instead of array
const addresses = { buildingNumber: "...", thoroughfare: "..." };  // Would fail

// WRONG: addresses as object in array
const addresses = [{ buildingNumber: "...", thoroughfare: "..." }];  // Still broken if array wrapping wrong
```

### Post-Fix (Working Implementation)

```javascript
// CORRECT: Signature WITH data:image prefix
const signatureWithPrefix = "data:image/png;base64," + base64Data;

// CORRECT: addresses as array of objects
const addresses = [{
  line1: null,
  line2: null,
  line3: null,
  line4: null,
  buildingName: null,
  buildingNumber: buildingNumber || null,
  thoroughfare: thoroughfare || null,
  townOrCity: townOrCity || null,
  district: null,
  postcode: formattedPostcode || null,
}];
```

### Root Cause

On March 27, the project migrated from `_worker.js` (Cloudflare Workers "Advanced Mode") to `functions/api/submit-claim.ts` (Cloudflare Pages "Functions Mode").

The signature prefix fix that was working in `_worker.js` was **NOT carried over** to the new Functions file.

### PDF Documentation Analysis

| Requirement | PDF Clearly Shows | Implementation Bug |
|------------|-------------------|-------------------|
| `addresses` as array `[]` | ✅ Yes | ❌ Was object |
| `signature` format | ⚠️ Ambiguous | ❌ Missing prefix |
| `date_of_birth` format | ⚠️ Ambiguous (DD-MM-YYYY) | ✅ Used ISO (worked anyway) |

The PDF was correct about `addresses` format. The signature format was shown as `"[base64 encoded image data]"` which was ambiguous.

### Key Lesson

**When migrating architectures, copy ALL code from the old implementation, not just the "important" parts.**

### Reference Commits

| Commit | Description |
|--------|-------------|
| `2b3f0121b` | First working signature prefix fix (Mar 26) |
| `8bc6eee98` | Migrated to Functions mode, forgot prefix |
| `00702d3c1` | FLYWHEEL #1 - Re-discovered fix |

---

# TESTED WORKING: Complete Form Submission Test

## curl Test (Verified Working)

```bash
SIG=$(base64 -w0 notes/example.png)

curl -X POST "https://car.financecheque.uk/api/submit-claim" \
  --form-string "title=Mr" \
  --form-string "first_name=John" \
  --form-string "last_name=Doe" \
  --form-string "date_of_birth=1985-06-20" \
  --form-string "phone=07503456789" \
  --form-string "email=john.doe@example.com" \
  --form-string "buildingNumber=12" \
  --form-string "thoroughfare=High Street" \
  --form-string "townOrCity=London" \
  --form-string "postcode=EC1A1AA" \
  --form-string "signature_image=data:image/png;base64,$SIG"
```

### Expected Response

```json
{
  "timestamp": "2026-03-28 07:50:05",
  "message": "Please validate via OTP.",
  "challenge_id": "3fac68d4-b98a-4349-b5b0-c499628e605c",
  "status": "CHALLENGE"
}
```

**"Please validate via OTP." is SUCCESS** - the form was accepted and requires OTP verification.