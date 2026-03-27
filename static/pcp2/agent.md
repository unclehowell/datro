# Agent Methodology - PCP2 Form Submission Flywheel

## ⚠️ CRITICAL: 3 Pending PDF-vs-Code Mismatches (NOT YET FIXED)

The current `functions/api/submit-claim.ts` does NOT match the R2R API PDF specification.
**These three issues must be fixed before the form can submit successfully.**

| # | Field | PDF/R2R Spec Says | Current Code Does | File:Line |
|---|-------|-------------------|-------------------|-----------|
| 1 | `addresses` | **ARRAY** `[{...}]` | OBJECT `{...}` | submit-claim.ts:90 |
| 2 | `signature` | `data:image/png;base64,{base64}` | Raw base64 (no prefix) | submit-claim.ts:112 |
| 3 | `addresses` fields | Full schema (line1-4, buildingName, district, etc.) | Only 4 fields | submit-claim.ts:90-95 |

**Reference:** `/home/unclehowell/datro/static/pcp2/notes/R2R Affiliate Submission API Documentation_V2.21 (1).pdf`
**Quick fix template:** See `API_GUIDE.md` lines ~114-125 for correct payload structure.

---

## Overview

This document defines the flywheel methodology for debugging and fixing the PCP2 (car finance) form submission to the R2R upstream API at car.financecheque.uk.

## Architecture

The project uses **Cloudflare Pages Functions** (not a standalone Worker):

| Component | Location |
|-----------|----------|
| API Handler | `functions/api/submit-claim.ts` |
| Frontend Form | `src/components/ClaimForm.tsx` |
| Build Output | `dist/` (copies `functions/` + static assets) |
| Pages Config | `cloudflare-pages.toml` |

**Build Process:**
1. `npm run build` copies `functions/` to `dist/`
2. Cloudflare Pages serves `dist/` as static + Functions

## The Problem

- **Domain:** car.financecheque.uk
- **Goal:** Form submissions must successfully reach R2R API and receive OTP challenge response
- **Current State:** Form submissions return 500 errors, never reach R2R API

## The Flywheel Methodology

### Definition

The flywheel is a systematic debugging process that iterates through:
1. **IDENTIFY** - Analyze real-time Cloudflare logs for errors
2. **FIX** - Apply code change to local repo
3. **LOG** - Document in DETAILED_CHANGELOG.md with log captures
4. **CITE** - Add summary entry in main CHANGELOG.md with reference
5. **PUSH** - Commit and push to GitHub
6. **WAIT** - 60 seconds for Cloudflare deployment
7. **TEST** - Start real-time log tail
8. **SUBMIT** - Use actual form OR curl with proper payload
9. **CAPTURE** - Copy log output to DETAILED_CHANGELOG.md
10. **LOOP** - Repeat until success

### Timing Requirements

| Step | Action | Duration | Notes |
|------|--------|----------|-------|
| PUSH | Git push to main | 5s | Triggers Cloudflare Pages build |
| WAIT | Cloudflare deployment | 60s | **MINIMUM** - may take longer |
| TEST | Start log tail | 5s | Use `wrangler pages project tail` |
| CAPTURE | Review logs | 30s | Wait for request to complete |

### Timing Critical Rule

> **ALWAYS wait minimum 60 seconds after push before testing.**
> Cloudflare Pages deployments can take 30-120 seconds.
> Testing before deployment completes gives false negatives.

## Testing Methods

### Method A: Browser Form (Primary)

```bash
# 1. Start real-time log tail
npx wrangler pages project tail carfinancecheque

# 2. Navigate to form
# https://car.financecheque.uk

# 3. Fill form and submit
# - Fill all required fields
# - Sign in signature pad
# - Click submit

# 4. Check logs for response status
# - Success: status 200 with OTP challenge
# - Failure: status 500 (check logs for error)
```

### Method B: Curl with FormData (Secondary)

```bash
# Get signature base64 (without wrapping)
SIG=$(base64 -w0 notes/example.png)

# Submit as multipart/form-data (matches browser behavior)
curl -X POST "https://car.financecheque.uk/api/submit-claim" \
  -F "title=Mr" \
  -F "first_name=John" \
  -F "last_name=Doe" \
  -F "date_of_birth=1985-06-20" \
  -F "phone=07503456789" \
  -F "email=john.doe@example.com" \
  -F "buildingNumber=12" \
  -F "thoroughfare=High Street" \
  -F "townOrCity=London" \
  -F "postcode=EC1A 1AA" \
  -F "signature=$(echo '{}' | base64)" \
  -F "signature_image=data:image/png;base64,$SIG" \
  -F "user_agent=Mozilla/5.0" \
  -F "session_id=test-session-001"
```

### Method C: Curl with JSON (Tertiary - for API testing only)

```bash
# Get signature base64
SIG=$(base64 -w0 notes/example.png)

# Create JSON payload
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

# Submit as JSON
curl -X POST "https://car.financecheque.uk/api/submit-claim" \
  -H "Content-Type: application/json" \
  -H "API-KEY: 8714de54-a64d-441b-8ef9-4a64318380b0" \
  -d @/tmp/payload.json
```

**Important:** Method C tests the R2R API directly but may bypass issues in the Functions handler. Always verify with Method A (browser) as the source of truth.

## Code Change Protocol

### Before Making Changes

1. Read current `functions/api/submit-claim.ts` code
2. Check real-time logs for error details
3. Identify root cause in DETAILED_CHANGELOG.md
4. Plan fix based on error type

### After Making Changes

1. Update `functions/api/submit-claim.ts`
2. Run `npm run build` to copy to `dist/`
3. Commit with descriptive message
4. Push to GitHub
5. Wait 60 seconds minimum
6. Test with browser form (Method A)
7. Document result in DETAILED_CHANGELOG.md

## Documentation Standards

### Main CHANGELOG.md Entries

Each flywheel loop should have:
- Date and loop number (e.g., "FLYWHEEL #1")
- Brief summary of fix
- Reference to DETAILED_CHANGELOG.md
- No technical details - just the summary

Example:
```
Mar-27 - 2026 - FLYWHEEL #2: Fix signature field extraction
  - FormData.get() returns string, need proper conversion
  - See DETAILED_CHANGELOG.md for log capture
```

### DETAILED_CHANGELOG.md Entries

Each issue must include:
- Main CHANGELOG reference
- Root cause analysis
- Real-time log capture (JSON from wrangler tail)
- Code snippets showing before/after
- Test results

## Cloudflare Pages Project Configuration

| Property | Value |
|----------|-------|
| Project Name | carfinancecheque |
| Domain | car.financecheque.uk |
| Preview URL | carfinancecheque.pages.dev |
| Mode | Cloudflare Pages Functions |
| Build Output | `dist/` |
| Config File | `cloudflare-pages.toml` |

### Real-time Log Command

```bash
npx wrangler pages project tail carfinancecheque
```

### Pages Project Commands

```bash
# List projects
npx wrangler pages project list

# List deployments
npx wrangler pages deployment list --project-name carfinancecheque

# Deploy locally (for testing before push)
npx wrangler pages deploy dist --project-name carfinancecheque
```

## Success Criteria

Form submission is successful when:
1. Browser receives HTTP 200 (not 500)
2. Response contains `"status": "CHALLENGE"` 
3. Response contains `"message": "Please validate via OTP."`
4. Response contains `challenge_id`

Until ALL four criteria are met, the flywheel continues.

---

## Quick Reference

```bash
# Start log tail
npx wrangler pages project tail carfinancecheque

# Build and deploy (local)
npm run build

# Push to GitHub
git add . && git commit -m "pcp2: FLYWHEEL #N - description" && git push

# Wait and test
# (60 second minimum wait required)
```

## Related Files

- `/home/unclehowell/datro/static/pcp2/functions/api/submit-claim.ts` - API handler
- `/home/unclehowell/datro/static/pcp2/src/components/ClaimForm.tsx` - Frontend form
- `/home/unclehowell/datro/static/pcp2/notes/example.png` - Test signature image
- `/home/unclehowell/datro/static/pcp2/notes/example.json` - Example payload
- `/home/unclehowell/datro/static/pcp2/CHANGELOG.md` - Main changelog
- `/home/unclehowell/datro/static/pcp2/DETAILED_CHANGELOG.md` - Detailed technical log
- `/home/unclehowell/datro/static/pcp2/cloudflare-pages.toml` - Pages configuration
- `/home/unclehowell/datro/static/pcp2/wrangler.toml` - Wrangler configuration
