# Great House Farm Mail Archive

Public, read-only, serverless archive for email and correspondence records related to Great House Farm (Tŷ Mawr), Llandough and BP v Buckler.

## Deployment

- Repository: `unclehowell/datro`
- Source branch: `email-archive`
- Worker name: `email`
- Public hostname: `https://email.bucklerfamily.estate`
- Worker source: `apps/email/worker.js`
- UI: `apps/email/index.html`
- Catalogue: `apps/email/data/mail-index.json`

This Worker serves the UI and catalogue from this repository branch via GitHub's raw-content endpoint. It retrieves individual source texts from the existing public DATRO archive only after a reader opens a conversation. The Worker has no Gmail sign-in, no inbox credentials, no send/receive endpoint, and no write API.

## Catalogue scope

The initial catalogue was built from the existing `bpvsbuckler/text/_treeview.json` listing on `gh-pages`. It includes entries whose filenames indicate Great House Farm / Tŷ Mawr / Llandough / BP v Buckler and an email/correspondence/request/response record. It is a reproducible initial set, not a claim that every historical email is already preserved in the public source archive.

## Updating the archive

1. Add or correct records in `data/mail-index.json`, using a stable `id`, exact upstream `path`, descriptive `subject`, `category`, and `evidenceVersion`.
2. Increment `manifestVersion` when the catalogue changes.
3. Increment an individual `evidenceVersion` when that record's public evidence representation changes; use semantic versioning such as `1.0.0` → `1.1.0` for a backward-compatible addition/correction or `2.0.0` for a breaking representation change.
4. Keep a public source URL for every record. The Worker only proxies URLs on `https://wayback.datro.xyz/text/` that are present in the catalogue.

## Reader features

- Gmail-inspired three-panel layout with subject search and folder/category filters.
- Full-text search over the indexed public source texts.
- Vertically scrollable reading pane for the entire archived text of each conversation group.
- Collapsed thread description, preserved source list, and semantic evidence version.
- Links to original archived text and a targeted Great House Farm wiki search.
- Read-only and public by design; no Gmail connection and no private account data.

## Licence and accuracy

The interface is software for navigating a public documentary index. Original message content remains attributed to the linked public archive. Subject-based grouping is a finding aid and is not proof that every message in an original thread is present. Review each original record before relying on it.
