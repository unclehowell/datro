# hive-ingest — project mail in, reviewable HubSpot draft task out

Mail from the institutions the campaign writes to is forwarded to an address handled by this Cloudflare Worker. The Worker classifies each message, skips duplicates, and creates a HubSpot task for the hive to review. It never replies, sends or forwards anything. Review gates and sending stay as they are: draft, independent reviews, then the owner sends.

Part of the Hive Operating Framework v0.1 (loop A: inbound mail to versioned draft).

## What it does with each message

| Class | Trigger | Result |
|---|---|---|
| verify | Gmail's own forwarding confirmation | `[OWNER ACTION]` task holding the confirmation text |
| owner | form, ID, payment, signature, terms, health records, legal | `[OWNER ACTION]` task, high priority, no draft |
| routine | acknowledgement | logged in D1 only |
| noise | newsletter from an unknown sender | logged in D1 only |
| substantive | everything else | `[OTHER AGENT'S TURN v0.0.1]` draft task, medium priority |

Task text wraps the email excerpt (first 2,000 characters) in markers saying it is untrusted data. D1 stores only the message id, sender domain, class, body name and subject, never the message text.

Known limit: a real reply that contains acknowledgement wording and is short on anything else could be logged as routine. Loop E (disclosure tracker) should read the D1 log weekly.

## Safety properties

- Only mail carrying the owner's Gmail `X-Forwarded-For` header is processed. With no `OWNER_EMAIL` secret set, nothing is processed.
- No outbound mail from the Worker. Its only network call is `POST` to the HubSpot tasks API.
- Failed HubSpot calls remove the log row and fail the delivery, so the sender retries.
- Secrets live in GitHub secrets and Worker secrets. None are committed. Keep it that way: this repo may be public.

## One-time setup (owner)

1. **Cloudflare token.** Create an API token limited to this account with: Workers Scripts edit, D1 edit. Add GitHub secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
2. **HubSpot token.** Create a private app with scopes `crm.objects.contacts.read` and `crm.objects.tasks.write`. Add GitHub secret `HUBSPOT_TOKEN`.
3. **Owner details.** Add GitHub secrets `OWNER_EMAIL` (the Gmail address that forwards) and `OWNER_CONTACT_ID` (the HubSpot contact the tasks attach to).
4. **Deploy.** The workflow runs on a push to this branch and by hand under Actions. Until all five secrets exist it deploys nothing and says which are missing.
5. **Receiving address.** In Cloudflare Email Routing, add a **subdomain** for ingest (for example `ingest.<your domain>`) rather than the root, so existing mail on the root domain is untouched. Create a custom address `ingest@<subdomain>` with action "Send to a Worker" → `hive-ingest`.
6. **Gmail forwarding.** Settings → Forwarding: add `ingest@<subdomain>`. Gmail sends a confirmation; the Worker turns it into an `[OWNER ACTION]` HubSpot task so you can read the code there. Then create a filter that forwards matching mail (query below).

Filter query (edit `worker/classify.mjs` and this list together when adding bodies):

```
from:(landregistry.gov.uk OR hm.land.registry@notifications.service.gov.uk OR ico.org.uk OR museumwales.ac.uk OR heneb.org.uk OR sewbrec.org.uk OR rcahmw.gov.uk OR wales.nhs.uk OR companieshouse.gov.uk OR networkrail.co.uk OR nio.gov.uk OR spab.org.uk OR hbap.org.uk OR victoriansociety.org.uk OR georgiangroup.org.uk OR south-wales.police.uk OR hse.gov.uk OR cadw.gov.wales OR valeofglamorgan.gov.uk)
```

## Test

```
npm install
npm test        # 15 tests: classifier and a simulated Worker run
```

Verified here: unit tests pass; `wrangler deploy --dry-run` bundles the Worker with the D1 binding. Not verified: a live deploy, live Email Routing, or a live HubSpot call. If the first deploy cannot create the D1 database itself, run `npx wrangler d1 create hive` and add the `database_id` it prints to `wrangler.toml`.

## Files

- `worker/classify.mjs` rules, body list, task builder (pure, tested)
- `worker/index.js` email handler
- `worker/*.test.mjs` tests
- `migrations/0001_central_schema.sql` full central database schema, applied later by hand
- `.github/workflows/deploy.yml` test, deploy, set secrets

## Working in this repo

Follows the turn-taking rules in the `watch` branch (FLYWHEEL.md): signed commits (`Agent:` trailer), no force-push, small commits.
