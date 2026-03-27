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
|-------|------|--------------|---------|
| title | string | Person title | "Mr", "Mrs", "Miss" |
| first_name | string | First name | "John" |
| last_name | string | Last name | "Doe" |
| email | string | Email address | "john@example.com" |
| phone | string | UK phone number | "07503456789" |
| date_of_birth | string | ISO date format | "1985-06-20" |
| addresses | array | Address objects | See below |
| signature | string | PNG signature with data URL prefix | See below |
| client_ip | string | Client IP address | "203.0.113.42" |
| user_agent | string | Browser user agent | "Mozilla/5.0..." |
| session_id | string | Session identifier | "session_001" |

### Addresses Array Format

```json
"addresses": [
  {
    "buildingNumber": "12",
    "thoroughfare": "High Street",
    "townOrCity": "London",
    "postcode": "EC1A 1AA"
  }
]
```

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

```json
{
  "title": "Mr",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1985-06-20",
  "phone": "07503456789",
  "email": "john.doe@example.com",
  "addresses": [
    {
      "buildingNumber": "12",
      "thoroughfare": "High Street",
      "townOrCity": "London",
      "postcode": "EC1A 1AA"
    }
  ],
  "signature": "data:image/png;base64,iVBORw0KGgo...",
  "signature_image": "data:image/png;base64,iVBORw0KGgo...",
  "client_ip": "203.0.113.42",
  "user_agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
  "session_id": "session_001"
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

### HTTP 500 from Worker

**Cause:** Worker cannot parse request body (FormData vs JSON mismatch)

**Fix:** Update worker to use `request.formData()` for multipart/form-data requests

## Testing Commands

### Test with JSON (bypasses worker FormData issue)

```bash
# Get signature base64
SIG=$(base64 -w0 notes/example.png)

# Create payload
cat > /tmp/payload.json << EOF
{
  "title": "Mr",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1985-06-20",
  "phone": "07503456789",
  "email": "john.doe@example.com",
  "postcode": "EC1A 1AA",
  "buildingNumber": "12",
  "thoroughfare": "High Street",
  "townOrCity": "London",
  "client_ip": "203.0.113.42",
  "user_agent": "Mozilla/5.0",
  "session_id": "session_001",
  "signature": "data:image/png;base64,$SIG"
}
EOF

# Submit
curl -X POST "https://r2r.theclaimsystem.co.uk/api/v1/affiliate/a4429cda-e36a-472a-8291-ae01a49349d8" \
  -H "Content-Type: application/json" \
  -H "API-KEY: 8714de54-a64d-441b-8ef9-4a64318380b0" \
  -d @/tmp/payload.json
```

### Test via Worker (after FormData fix)

```bash
curl -X POST "https://vehicle.financecheque.uk/api/submit-claim" \
  -H "Content-Type: application/json" \
  -H "API-KEY: 8714de54-a64d-441b-8ef9-4a64318380b0" \
  -d @/tmp/payload.json
```

## Notes

- The R2R API has a 2-minute rate limit per IP
- Always use `data:image/png;base64,` prefix for signature
- Both `signature` and `signature_image` fields should contain the signature
- Session IDs should be unique per submission
- Client IP should be the actual visitor IP (not server IP)