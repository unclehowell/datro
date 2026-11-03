Record
======

**Page ID:** 3334 · **Title:** Brand & Developer Guidelines · **Evidence status:** Not yet labelled — see the Editing Protocol · **Version:** 1.0.1 · `Editing Protocol <https://research.bucklerfamily.estate/editing-protocol/>`__

**Purpose:** This page is the implementation reference for human editors and AI agents maintaining the Great House Farm Wiki. Read it before creating or changing pages, HTML, navigation, evidence entries, or expandable sections. It describes the observed site behaviour and the conventions to follow; it does not claim that all conventions are already implemented site-wide.

1. Current expandable-triangle behaviour
----------------------------------------

The expandable triangles currently come from native HTML disclosure markup: ``<details>`` contains a ``<summary>`` label followed by the content that opens when the reader taps the label. These sections are explicitly authored in page content. The site does not currently inspect paragraph length and automatically turn long paragraphs or bullet points into expandable sections.

**Example: short visible label**

Put the complete paragraph, list, evidence description, links and any relevant interpretation inside this element. When the reader opens the section, the full content is available; closing it hides the content again without deleting it.

Ordinary paragraphs outside a ``<details>`` block remain visible. CSS can style existing blocks, but styling alone does not create disclosure behaviour or automatically wrap ordinary paragraphs. The legacy ``.ghf-rm`` CSS rules only apply to elements marked with that class; they are not a site-wide length detector.

2. Preferred information-density convention
-------------------------------------------

The editorial preference is to collapse substantial text to reduce information overload. As a working guide, content longer than about ten words should normally be considered for an expandable triangle, including long bullet points. This is an editorial target, not an existing automatic rule and not an absolute mechanical threshold.

- Keep the summary label concise, specific and useful on a mobile screen—usually one short line, at most two where necessary.
- Place the complete original text inside the disclosure section; do not replace it with a summary, truncate it, or discard links.
- Short labels, navigation, essential warnings and brief standalone facts may remain visible where doing so helps readers understand the page.
- Use judgement: avoid a separate triangle for every tiny sentence if that makes the page harder to navigate. Group related material under a meaningful label when appropriate.
- Do not claim a page has been converted until the saved page has been checked.

3. Evidence-page structure and wording
--------------------------------------

Preserve the wiki’s evidence hierarchy and make it clear what kind of statement the reader is seeing. Do not blur source material, description, family evidence, interpretation, allegation, inference or unresolved question into one undifferentiated claim.

**Evidence entry pattern**

**Evidence / source:** Identify the document, record, image, correspondence or other item accurately, including its catalogue identifier and date where known.

**Evidence description:** State what the source itself contains or shows, without adding unsupported conclusions.

**Interpretation and context:** Explain what the source may mean, identify whose interpretation it is, and distinguish inference or allegation from established fact. State material limitations and uncertainty.

**Links and provenance:** Preserve links to the source, catalogue entry, related evidence and relevant chronology. Do not invent links, citations, document contents or retrieval status.

Use third person for public-facing case narrative. Keep factual corrections consistent across the site. For Great House Farm case material, keep Parcel A (the house/buildings and associated house parcel) distinct from Parcel B (the eastern agricultural fields) wherever the evidence requires that distinction. Attribute contested propositions to the family or other relevant source rather than presenting them as judicially established findings.

4. HTML and WordPress implementation rules
------------------------------------------

**Native disclosure markup**

::

   <details>
     <summary>Concise descriptive label</summary>
     <p>Complete original paragraph goes here.</p>
     <ul>
       <li>Complete list item goes here.</li>
     </ul>
   </details>

Use a real ``<summary>`` as the first child of ``<details>``. Put all content that should be hidden when collapsed inside the same details element. Keep the markup valid and simple. Do not put the entire page inside one giant disclosure.

Before making bulk edits, inspect the actual saved content and identify the boundaries of each paragraph, list, evidence section and existing disclosure. Preserve wording, links, media, headings, identifiers, page hierarchy and the order of evidence. Do not blindly wrap existing ``<details>`` blocks inside other details blocks or alter existing summary labels without a reason.

After editing, fetch or preview the published page and verify that the triangles work on desktop and mobile, the labels are readable, the full content opens, and no text, links or media have disappeared. WordPress may sanitize unsupported markup, so inspect the saved result rather than relying only on the submitted content.

5. Rules for AI agents and maintainers
--------------------------------------

- Read this page before implementing a site-wide design or content transformation.
- Distinguish the current implementation from desired future behaviour; never describe the length-based preference as an automatic feature unless it has actually been implemented and tested.
- Make small, reversible, page-aware changes. Test a representative page before applying a pattern broadly.
- Do not silently remove, paraphrase, merge or relocate evidence. Preserve source links and the difference between evidence description and interpretation.
- Report exactly which pages were changed and which were checked. Do not claim a site-wide rollout from a test-page edit.
- Do not invent a successful rendering test. A successful save confirms that WordPress accepted the update; it does not alone confirm the rendered mobile experience.

6. Status of this guideline
---------------------------

This page documents the observed native disclosure mechanism and the preferred editorial standard. The preference for considering content over about ten words for collapse is not yet an automatic site-wide feature. Existing pages may use triangles inconsistently; each page must be inspected before any conversion. Update this guideline when the actual implementation changes, and keep the documented behaviour aligned with what has been verified on the live site.

Change history is maintained on the `Master Change Log <https://research.bucklerfamily.estate/master-change-log-october-2026/>`__; no separate page-local version footer is maintained.

Change history is maintained on the `Master Change Log <https://research.bucklerfamily.estate/master-change-log-october-2026/>`__; no separate page-local version footer is maintained.
