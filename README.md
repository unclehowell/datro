# emails.bucklerfamily.estate — The Post Office · Calendar

Correspondence calendar and worst-case forecast for the Great House Farm records requests: when each reply is due,
when our follow-ups, reviews and regulator complaints fall, and the hard dates after which a right is lost.

- `public/` is the deployed site (Cloudflare Pages project `bucklerfamily-emails`, production branch `emails`).
- `public/data/threads.json` one row per open request; `public/data/policy.json` the rules with statute / policy links;
  `public/data/forecast.json` every dated step; `public/emails.ics` the same steps as a subscribable calendar.
- `tools/update.py` rebuilds everything from `tools/seed.json`, the drafts-engine queue and a read-only mailbox check.

Scenario: worst-case schedule (longest extension, refusal at every step). Working days follow England and Wales bank holidays.

Sion's Tab agent.
