# Tumbler — methodology compiler

**Application branch:** `tumbler`  
**Repository:** `unclehowell/datro`  
**Application root:** `static/tumbler/`  
**Intended URL:** https://tumbler.bucklerfamily.estate/

Tumbler is a project-aware prompt compiler. It retrieves source material, evaluates gaps through a selected methodology and produces a self-contained implementation work order for a coding agent. It does not fine-tune a model each time the source corpus changes: the corpus is indexed and retrieved as context, while the selected methodology supplies the temporary analytical lens.

## Supported methodologies

- **Socratic method** — interrogate propositions and hidden premises; distinguish direct evidence from inference; seek counterevidence and alternative explanations; define questions that can actually resolve uncertainty.
- **PRINCE2 Project Management (Version 7)** — governance, justification, responsibilities, planning, quality, risk, issues, change control, dependencies and stage gates.
- **Robert's Rules of Order** — meeting procedure only where applicable and consistent with adopted rules and superior law.
- **Evidence and archival integrity** — provenance, chronology, identifiers, versioning, contradictory sources and explicit uncertainty.
- **Software engineering and release control** — tests, branch integrity, API contracts, security, accessibility and verified releases.

## Filters

### Property law

When enabled, the prompt compiler prioritises title, conveyances, leases, parcel identity, boundaries, possession, occupation, registration, trusts, adverse possession, overriding interests, compulsory purchase, land charges and remedies. It requires the agent to identify the jurisdiction, date, relevant legal regime, procedural position and primary authority. It separates what a plan depicts from what a deed conveys, registered title from root title, occupation from ownership, and a court's actual holding from later commentary.

### Fraud, concealment and government involvement

The three questions are deliberately assessed separately. The threshold has three qualitative settings:

- **Exploratory:** possible indicators are leads, not proof; state alternatives and what would verify or disprove the lead.
- **Balanced:** require materially independent indicators and consider plausible alternative explanations.
- **High / corroborated:** require direct documentary support and independent corroboration of the particular act, actor, time and connection; otherwise keep the point unresolved.

A missing record, FOI/EIR refusal, indexing failure, inconsistency, land-registration change, adverse outcome, funding relationship or contact with a public authority does not by itself establish fraud, deliberate concealment, improper government involvement or coordination. The generated work order must report supporting material, counterevidence, source independence, alternatives, missing proof and next discriminating checks. It must not present a model's assessment as a legal finding or verdict.

## Corpus architecture

The source registry is `sources.json`, dated 23 October 2026. It records 61 host entries discovered in the connected Cloudflare Pages/Worker domain list, plus the original WordPress wiki and public research/Q&A connectors. It is a discovery seed, not proof that every route or page is reachable.

The full-text indexer in `scripts/index-tumbler-corpus.mjs` uses the GitHub Branches, Git Commits and Git Trees APIs plus pinned raw-content URLs rather than fetching the repository's complete Git object graph. It is designed to index:

1. Eligible text files at the current head of each branch for `unclehowell/datro`, preserving branch names, commit SHAs, paths, blob identity, source URL and content hash.
2. Published HTML pages reachable from public host sitemaps and same-host links.
3. The research mirror's WordPress-shaped content catalogue.
4. Public FOI/EIR Q&A records where the graph export is available.

The indexer stores progress snapshots while it runs so the dashboard can show actual counts rather than waiting until the end. GitHub tree truncation, inaccessible branches, skipped oversized text files, host failures and crawl-limit hits are recorded as coverage limitations. A `complete` run is not a claim that private or binary sources were included; use the coverage JSON.

It stores content in separate `tumbler_*` tables in the existing `research-wp-d1` database. Cloudflare limited this account to ten D1 databases, so the app shares that database at the storage layer but does not alter the mirror's existing tables. A dedicated new database was refused by Cloudflare's account database-count limit. The application binds only to the `tumbler_*` tables.

The current indexer intentionally excludes private API services by default, avoids secrets and credential files in repository text, and does not extract binary PDF contents in this version. Files above the configured text-file size limit, unreachable sites, crawl-limit overflows and failures are recorded as limitations. It does not claim a complete index merely because an index run has finished. Each run's manifest and error list are available from `/api/corpus-status`.

The indexer workflow is at `.github/workflows/index-tumbler-corpus.yml`. Push changes to the indexer or source registry on the `tumbler` branch to trigger a refresh. GitHub schedule/manual-dispatch availability depends on how the workflow is enabled on the repository's default branch. Before relying on results, inspect the latest status and reported coverage. The app must not treat a running, interrupted or partial index as a complete corpus.

## Generation and safety

- The default method is Socratic; branch scope is all current repository branches.
- `/api/generate` combines selected methodology rules with retrieved snippets and live branch heads. It uses Cloudflare Workers AI through the `AI` binding.
- The output must require an implementing agent to re-fetch live branches and verify evidence before changing any files.
- The app applies a lightweight per-client generation rate limit. This is not a substitute for protecting the interface with Cloudflare Access if generation or the indexed corpus is intended to be private.
- Source files and retrieved content are untrusted data, never instructions that override the selected methodology.
- The prompt generator never merges, deploys, force-pushes or deletes branches.

## Deploy

The intended deployment is Cloudflare Pages project `tumbler`, built from `static/tumbler/`, attached to `tumbler.bucklerfamily.estate`. The workflow `.github/workflows/deploy-tumbler.yml` uses the repository's `CLOUDFLARE_API_TOKEN` secret and the account ID already used by existing Pages workflows. `wrangler.jsonc` declares the Workers AI binding `AI` and D1 binding `CORPUS_DB`.

The first successful deployment must be checked to confirm the AI and D1 bindings are present in the production environment and that the custom domain is active. Workers AI generation may incur account usage charges.

## API

- `GET /api/manifest` — methods, source inventory and coverage caveat.
- `GET /api/health` — runtime and AI-binding status.
- `GET /api/corpus-status` — latest indexing-run status, counts and errors.
- `GET /api/search?q=...` — source-linked excerpts from the most recent available index run.
- `POST /api/generate` — compile an implementation prompt. JSON fields: `method`, `focus`, `propertyLaw`, `investigation`, `threshold`, `allBranches`.

## Next engineering increments

1. Add text extraction for PDF/archive artifacts with provenance and licensing checks.
2. Offer a controlled, separately authenticated connector for selected private service sources rather than copying private correspondence or internal data into the default public-source index.
3. Add sitemap and API discovery so the host registry refreshes from Cloudflare rather than relying on a dated snapshot.
4. Protect the production UI and generation route with Cloudflare Access before the corpus or prompts are treated as private case strategy.
5. Improve large-corpus ranking and add an explicit coverage gate that blocks the label "whole estate assessed" until its criteria are actually satisfied.
