Record
======

**Page ID:** 3290 · **Title:** Site Plan — Build Specification for Great House Farm Wiki · **Evidence status:** Not yet labelled — see the Editing Protocol · **Version:** 1.0.1 · `Editing Protocol <https://research.bucklerfamily.estate/editing-protocol/>`__

This document is the **build plan** for the Great House Farm Wiki. It describes the site as designed and constructed from this specification. Every page, hierarchy, and catalogue that exists on the site today is the realisation of this plan.

1. Purpose and Scope
--------------------

The wiki exists to document, preserve, and make publicly accessible the evidentiary record concerning Great House Farm (Tŷ Mawr), Llandough, Vale of Glamorgan — including title history, institutional correspondence, archival leads, and allegations of fraud and concealment. It serves three audiences: the Williams family and their representatives; public authorities and their FOI/EIR officers; and any future court, tribunal, or oversight body.

2. Site Structure (Hierarchy)
-----------------------------

The site is organised as a single hierarchical tree of pages. Parent pages define workstreams; child pages hold the granular record. The top-level structure is as follows:

- **Case Overview and Key Records** (site-hierarchy-tree-view-expand-collapse) — the master index and navigation hub.
- **Top-level Working Theory** (top-level-understanding-williams-parcel-a-title-sabotaged-severed-and-buried-while-a-synthetic-mimic-estate-was-forged) — the governing narrative: Williams Parcel A title severed and obscured beneath a synthetic-mimic estate.
- **Allegations** — discrete, testable claims, each on its own page with a stable slug (e.g. allegation-land-registry-1983-registration-of-parcel-a-kept-from-the-williams-family-until-after-mary-williamss-death; allegation-sas-undercover-personnel-bp-bailiffs-1988-unverified; claim-parcel-a-parcel-b-distinct-histories-1987-amalgamation; claim-repeated-attempts-to-make-mary-williams-occupancy-of-parcel-a-appear-permissive).
- **Evidence Acquisition & Recovery** (evidence-acquisition-recovery) — the methodology and live workstream for obtaining records.
- **Negative Search Log** (negative-search-log) — searches performed that returned nothing, recorded so absence of evidence is itself documented.
- **Record Retention / Destruction / Transfer Matrix** (record-retention-destruction-transfer-matrix) — what records existed, who held them, and what happened to them.
- **Fraud / Concealment Evidence & Referral** (fraud-concealment-evidence-referral) — the compilation of indicators pointing to fraud or concealment.
- **Public Authority Action & Accountability** (public-authority-action-accountability) — the conduct of public bodies in response to requests and complaints.
- **Institutional Remedy & Pre-Action** (institutional-remedy-pre-action) — the route toward formal remedy.
- **Counter-Evidence & Disconfirmation** (counter-evidence-disconfirmation) — material that tests or weakens the working theory, recorded in good faith.
- **Who Knew What, When?** (who-knew-what-when) — the chronology of knowledge across institutions and individuals.
- **Institutional Reviews** (parent: institutional-review-coverage-register) — one forensic review page per institution (e.g. bp-archive-forensic-institutional-review, parliamentary-archives-forensic-institutional-review, dcms-forensic-institutional-review, ico-forensic-institutional-review, hm-land-registry pages, south-wales-police pages, welsh-government-and-cadw pages, vale-of-glamorgan-council pages, llandough-community-council pages, and others), each child of the coverage register.
- **Email Correspondence Catalogues** (parent: a correspondence hub) — one catalogue per institution or correspondent, capturing metadata of every email exchanged.
- **Evidence Items (GHF-E series)** — individual evidence records numbered GHF-E001 onward, each on its own page with a stable slug, filed under the relevant parent workstream.
- **Family Pages** (family-pages) — with a copyable template (template-your-family-page-copy-this) for contributors.
- **Friends of the Farm** (friends-of-the-farm) — community and supporter presence.
- **The Tightrope** (the-tightrope) — reflective/narrative piece.
- **Legal Notices, Copyright and Disclaimer** (legal-notices) — the legal footer for the whole site.
- **Highlight Reports** (parent: a reports hub) — periodic summaries (e.g. October 2026 Highlight Report, weekly highlight reports), published and draft.

3. Content Strategy
-------------------

- **Evidence-first, narrative-second.** Every claim page is anchored to numbered evidence items (GHF-E series). Narrative pages cite evidence; evidence pages stand alone.
- **Stable slugs.** Every page has a permanent, descriptive slug. Slugs are never renamed after publication, because external citations and FOI references depend on them.
- **Status discipline.** Pages are published only when the underlying record is sourced or explicitly flagged as pending/unconfirmed. Draft status is used for work in progress (e.g. weekly highlight reports).
- **Provenance on every record.** Each evidence item records: source institution, date obtained, reference number, and any conditions of disclosure.
- **Negative results are content.** The Negative Search Log is a first-class section, not an afterthought.
- **Updates are dated.** Highlight reports and correspondence catalogues carry explicit dates so the record shows when each fact entered the site.
- **No deletion of history.** Corrections are made by adding a dated amendment note, never by silently rewriting.

4. Evidence Catalogue Schema (Metadata Only)
--------------------------------------------

Every evidence item on the site conforms to the following metadata schema. Page bodies carry the substance; this schema defines the fields that must be present for the item to be a valid catalogue entry.

::

   EVIDENCE_ITEM_SCHEMA
   ─────────────────
   item_id:        GHF-E{nnn}          — sequential, zero-padded, never reused
   slug:           ghf-e{nnn}-{short-description}
   title:          "GHF-E{nnn} — {one-line description}"
   parent:         {workstream page id}
   status:         publish | draft
   date_obtained:  YYYY-MM-DD
   source:         {institution or correspondent}
   reference:      {FOI/EIR/ATISN number or archive ref}
   description:    {what the item is}
   provenance:     {how and from whom obtained}
   verification:   sourced | pending | unverified
   related_items:  [GHF-E{nnn}, ...]
   related_pages:  [slug, ...]
   tags:           none used site-wide; categorisation is by parent hierarchy

Institutional review pages follow a parallel schema:

::

   INSTITUTIONAL_REVIEW_SCHEMA
   ─────────────────────────
   institution:    {name}
   slug:           {institution-slug}-forensic-institutional-review
   parent:         institutional-review-coverage-register
   coverage:       {what was requested / reviewed}
   responses:      [{date, reference, outcome}]
   outstanding:    {open requests or refusals}
   assessment:     {forensic summary}

Email correspondence catalogues follow:

::

   CORRESPONDENCE_CATALOGUE_SCHEMA
   ─────────────────────────────
   correspondent:  {institution}
   slug:           {institution-slug}-email-correspondence-catalogue
   parent:         {correspondence hub}
   entries:       [{date, direction (in/out), subject, reference, outcome}]

5. Toolkit Websites (bucklerfamily.estate)
------------------------------------------

Alongside this wiki, the project is supported by a small family of websites under the domain **bucklerfamily.estate**. Together they form the toolkit for navigating the project. The root domain presents as a visual campus map: each building on the map represents one of the subdomains below.

5.1 dartboard.bucklerfamily.estate
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

A visual dartboard overview showing progress in obtaining evidence from the different institutions. Each institution occupies a slice of the dartboard; the rings represent phases of the evidence-acquisition pipeline — GDPR, FOI, SAR, complaints, and internal review.

5.2 bpvsbuckler.bucklerfamily.estate
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

A museum-style presentation of the whole story as a cinematic, tour-like experience. Visitors move through the evidence as they would on a guided tour, with interactive stations covering the history and heritage of the site.

5.3 wayback.bucklerfamily.estate
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

A catalogue of the evidence, hosted on the Wayback branch of the GitHub repository **UncleHowell/datro** (D-A-T-R-O). This is the durable, version-controlled copy of the evidence catalogue.

6. Archival Redundancy
----------------------

The WordPress wiki (bucklerfamilywiki.wordpress.com) is regularly archived to the public Wayback Machine (Internet Archive) as a safeguard in case the site goes down. In that event, the wiki remains viewable via the Internet Archive, and the evidence catalogue remains available in the GitHub repository’s Wayback branch. Evidence is therefore backed up in two independent places: the Internet Archive copy of the website, and the GitHub repo.

7. PRINCE2 Evidence Recovery Framework
--------------------------------------

This section finalises the plan as a managed project using PRINCE2 principles, adapted to the goal of recovering the maximum possible information and evidence. The framework governs every acquisition activity and is the standard against which progress on dartboard.bucklerfamily.estate is measured.

7.1 Business Case and Objectives
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

- **Objective:** Identify, locate, obtain, and preserve every record relevant to Great House Farm and the Williams Parcel A title, regardless of holder or format.
- **Success measure:** The Negative Search Log and Record Retention Matrix together demonstrate that every plausible source has been approached by at least one route, and every obtained item is catalogued with full provenance.
- **Tolerance:** Cost and time overruns are acceptable where they demonstrably increase the volume or quality of recovered evidence; they are not acceptable where they merely repeat a completed search.

7.2 Four Work Packages (Identify → Locate → Obtain → Preserve)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

- **WP1 — Identify.** Build and maintain a master source register: every institution, archive, individual, and private holder with any plausible connection. Each entry carries a unique source ID cross-referenced to the Institutional Review Coverage Register.
- **WP2 — Locate.** For each source, determine what records exist, where they are held, in what format, and under what access regime. Output feeds the Record Retention / Destruction / Transfer Matrix.
- **WP3 — Obtain.** Acquire the record through the cheapest effective route first, escalating only when blocked. Routes, in order: (a) free online disclosure; (b) paid copy or reproduction fee; (c) physical inspection in a reading room or archive visit; (d) formal FOI/EIR/SAR/ATISN request; (e) complaint against refusal; (f) internal review; (g) referral to the Information Commissioner; (h) pre-action protocol letter; (i) court order compelling disclosure.
- **WP4 — Preserve.** Every obtained item is digitised where possible, assigned a GHF-E number, entered in the catalogue with provenance metadata, and backed up to both the Internet Archive and the GitHub Wayback branch before the working copy is relied upon.

7.3 Stages and Gates
~~~~~~~~~~~~~~~~~~~~

- **Stage 1 — Foundation:** source register complete, schemas agreed, toolkit sites live.
- **Stage 2 — First-pass acquisition:** all free and low-cost routes exhausted for every identified source.
- **Stage 3 — Formal requests:** FOI/EIR/SAR/complaint/internal-review pipeline running for every source that withheld or ignored Stage 2.
- **Stage 4 — Enforcement:** ICO referrals, pre-action correspondence, and preparation of court-order applications for persistently obstructive parties.
- **Stage 5 — Consolidation:** full catalogue, negative log, retention matrix, and forensic reviews signed off; residual gaps explicitly documented rather than ignored.

A stage gate review is held before advancing. The gate is passed only when the Negative Search Log shows a reasoned attempt at every route for that source, or a documented reason why a route does not apply.

7.4 Risk Register (Summary)
~~~~~~~~~~~~~~~~~~~~~~~~~~~

- **Obstructive or non-responsive parties** — mitigated by escalating through the full pipeline (7.2 WP3 d–i) and by recording every contact in the correspondence catalogues.
- **Destruction or loss of records** — mitigated by the Retention Matrix and by requesting preservation notices early.
- **Cost escalation** — mitigated by route ordering (free before paid) and by logging every fee in the catalogue metadata.
- **Single point of failure (WordPress site)** — mitigated by Section 6 redundancy.
- **Bias or incomplete searching** — mitigated by the Counter-Evidence section and by independent review of the Negative Search Log.

7.5 Court Orders and Compelled Disclosure
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Where a party refuses or ignores every administrative route, the project prepares an application for a court order compelling disclosure. This is treated as the final stage of WP3, not a separate project: the same evidence catalogue, provenance records, and correspondence history form the supporting bundle. Pre-action protocol letters are issued before any application is filed, and all related correspondence is catalogued under the Institutional Remedy & Pre-Action workstream.

8. Governance and Maintenance
-----------------------------

- This plan page is the single source of truth for site architecture. Structural changes are reflected here first.
- New workstreams are added as top-level pages and listed in Section 2.
- The schema in Section 4 is versioned implicitly by the date of this page; amendments are noted with a dated paragraph beneath the relevant section.
- Legal Notices (legal-notices) governs copyright, disclaimer, and liability for all content.
- Section 7 is reviewed at every stage gate; the risk register and route order are amended only with a dated note.

*Plan drafted on 16 October 2026 to match the site as built. Forward amendments will be dated and appended.*

Change history is maintained on the `Master Change Log <https://research.bucklerfamily.estate/master-change-log-october-2026/>`__; no separate page-local version footer is maintained.

Change history is maintained on the `Master Change Log <https://research.bucklerfamily.estate/master-change-log-october-2026/>`__; no separate page-local version footer is maintained.
