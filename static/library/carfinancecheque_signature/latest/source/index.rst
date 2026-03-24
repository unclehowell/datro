Car Finance Cheque - Signature Feature Implementation
==================================================

:Date: March 2026
:Author: DATRO Development Team
:Project: car.financecheque.uk

.. toctree::
   :maxdepth: 2
   :numbered:

   overview
   technical
   implementation
   issues

Overview
--------

This project implemented a signature capture feature for the PCP (Personal Contract Purchase) claim form at car.financecheque.uk.

The signature pad allows visitors to sign electronically before submitting their claim, converting their signature into a base64-encoded PNG image.

Technical Details
----------------

The implementation uses:

- **Frontend**: React with react-signature-canvas
- **Backend**: Cloudflare Pages Functions
- **API**: R2R (The Claim System) affiliate submission API
- **Deployment**: GitHub Actions triggered by gh-pages branch

Implementation
-------------

The signature capture was added as Step 3 in the 4-step claim form:

1. Personal Details
2. Address
3. **Signature** (new)
4. Review

The signature is captured as a PNG canvas, converted to base64, and forwarded to the R2R API.

Issues Encountered
------------------

The R2R API consistently returns "Invalid signature format" regardless of the signature format tried:

- JSON with addresses as object
- JSON with addresses as array
- Personal fields only
- Pipe-separated values
- Dummy base64 strings
- Signature image base64

The R2R API provider needs to clarify the expected signature format.
