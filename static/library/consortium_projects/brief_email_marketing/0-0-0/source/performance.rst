Performance & Observations
===========================

Throughput
~~~~~~~~~~~

Under the Resend.com free tier, the system is constrained to **100 emails per day**. At the current send rate of one email per 2-minute cron trigger, the theoretical maximum is 720 sends per day — well above the quota. In practice, the daily quota is the binding constraint.

At 100 emails/day against a list of 6,369 recipients, a full cycle completes in approximately **64 days**.

+----------------------------+------------------+
| Metric                     | Value            |
+============================+==================+
| Send rate (scheduled)      | 1 per 2 minutes  |
+----------------------------+------------------+
| Daily quota (free tier)    | 100 emails/day   |
+----------------------------+------------------+
| Effective rate             | ~100/day         |
+----------------------------+------------------+
| List size                  | 6,369            |
+----------------------------+------------------+
| Full cycle duration        | ~64 days         |
+----------------------------+------------------+
| Progress tracking          | Per-send (index) |
+----------------------------+------------------+

Logging
~~~~~~~~

Every send attempt is appended to ``/home/ubuntu/email_send.log`` with an ISO 8601 timestamp:

.. code-block:: text

   # Successful send:
   2026-04-12T09:38:01.234Z: SENT recipient@example.com (342/6369) ID:abc123

   # Quota exceeded:
   2026-04-12T09:38:02.327Z: FAILED recipient@example.com (348/6369) \
     - daily_quota_exceeded: You have reached your daily email sending quota.

   # Cycle reset:
   2026-04-12T09:38:03.000Z: Cycle complete - restarting

Quota Reset
~~~~~~~~~~~~

The Resend.com free tier quota resets at **midnight UTC** daily. The cron job continues running through the quota period; sends during quota exhaustion are logged as ``daily_quota_exceeded`` and automatically resume when quota refreshes.

Server Load
~~~~~~~~~~~~

The system imposes negligible load on the EC2 instance. Node.js spawns, sends one HTTP request, and exits within ~1 second. The server load average at time of observation was 2.25/2.52/1.79 (primarily driven by other workloads on the machine).
