Lessons Learned
==================

Technical
-----------

1. **Disk space awareness** -- Old Sphinx builds were consuming significant
   disk space on /home. Clearing them freed 375MB. Recommendation: run
   build cleanup as part of the sync process or add a cron job for periodic
   build artifact cleanup.

2. **Herd immunity for sync** -- Skipping repos with >500 changes proved
   effective. The sync continued working for all other repos rather than
   failing entirely due to one problematic repository.

3. **SSH key management** -- Using paperclip-hermes-nvidia-key.pem for AWS
   authentication worked reliably. No authentication failures during
   deployment.

4. **Package naming** -- The pip package for Honcho memory is ``honcho-ai``
   not ``honcho``. The ``honcho`` package on PyPI is a Process Manager
   (Foreman clone). This ambiguity caused an initial installation error.

Process
---------

5. **Documentation order** -- Writing documents in Mandate → Brief → Plan →
   Highlight order proved effective. Each document builds on the previous
   one and follows a logical flow from requirements to outcomes.

6. **Telegram as notification layer** -- Telegram delivered PR URLs reliably
   and quickly. HTML formatting makes messages clear with clickable links.
   This is a proven channel for agent-to-human communication.

7. **Agent fallback value** -- While not yet triggered, the architecture is
   sound. The ability for cron failures to automatically spawn an agent
   in YOLO mode means zero-touch recovery for most sync issues.

Recommendations
----------------

8. **Add build step to sync** -- Include Sphinx build as part of the sync
   script so doc changes are compiled automatically.

9. **Monitor disk usage** -- Add disk space check to the sync script and
   alert if /home exceeds 90% usage.

10. **Reach aws-ai** -- Resolve SSH connectivity to the AI AWS endpoint
    to complete the three-node star network.
