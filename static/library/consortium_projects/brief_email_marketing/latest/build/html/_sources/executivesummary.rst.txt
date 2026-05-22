Executive Summary
==================

DATRO Consortium operates an automated outbound email marketing system on a dedicated AWS EC2 Ubuntu 24.04 server. The system targets UK-based consumers with information about the FCA car finance mis-selling claim process, directing recipients to the DATRO-affiliated portal at ``car.financecheque.uk``.

The system uses the `Resend.com <https://resend.com>`__ transactional email API as its delivery backbone, driven by a Node.js script executed on a scheduled basis via the Linux ``cron`` daemon. Emails are dispatched one at a time at randomised intervals, cycling through a curated list of recipient addresses, with full progress tracking and logging.

**Key characteristics:**

- Fully automated, zero-intervention delivery pipeline
- Resend.com API for reliable transactional email delivery
- Progress-resumable: survives restarts without re-sending
- Randomised send intervals to avoid rate-limit bursts
- Comprehensive per-send log with timestamps and Resend message IDs
- Domain: ``car.financecheque.uk`` with custom SSL certificate

**Campaign Details:**

+--------------------+-----------------------------------------------+
| Subject Line       | Car Finance Cheque UK                         |
+--------------------+-----------------------------------------------+
| From Address       | noreply@car.financecheque.uk                  |
+--------------------+-----------------------------------------------+
| Delivery Method    | Resend.com API (transactional)                |
+--------------------+-----------------------------------------------+
| Send Rate          | 1 email per cron trigger (every 2 minutes)    |
+--------------------+-----------------------------------------------+
| Daily Limit        | 100 emails/day (Resend free tier)             |
+--------------------+-----------------------------------------------+
| List Size          | 6,369 recipients                              |
+--------------------+-----------------------------------------------+
