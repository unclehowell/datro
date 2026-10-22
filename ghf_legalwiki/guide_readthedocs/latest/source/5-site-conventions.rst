.. _site-conventions:

Site conventions and maintenance
================================

.. _expandable-content:

Expandable content and mobile readability
-----------------------------------------

The site uses explicitly authored native HTML disclosure elements, with a short summary label readers can open. Long text is not automatically converted into expandable sections site-wide. Use concise labels and collapse substantial secondary explanation where that improves scanning, but never hide essential findings or remove source material merely to shorten a page.

.. _editorial-standards:

Editorial standards
-------------------

Use clear, restrained third-person writing for public-facing case material. Do not explain a page’s purpose or repeat what it is about in the page body. Use one link sentence only: **What this page is about → Read the Docs**, linked to the closest matching anchor in this guide (for example, :ref:`evidence pages <evidence-pages>`, :ref:`catalogues and registers <catalogue-pages>`, :ref:`forensic assessments <forensic-assessments>`, :ref:`chronologies <chronology-pages>`, or :ref:`analysis pages <analysis-pages>`). Do not add a “Purpose” paragraph, generic introduction, or AI-written overview. Keep the body for substantive records, provenance, necessary caveats, scope tests, source descriptions and analysis; when removing redundant page-description text, preserve all evidence, links, quoted material and case-specific caveats.

.. _page-footer:

Page header and footer
----------------------

Header: Page ID · Title · Evidence status · Version. Footer, where present: “Page version & change log” table — version (MAJOR.MINOR.PATCH), date (UTC), editor, change, source; newest first.

.. _developer-agents:

Developer and AI-agent instructions
-----------------------------------

Before changing the site, read the `Brand & Developer Guidelines <https://research.bucklerfamily.estate/developer-guide/>`__. Inspect the actual page before editing; preserve evidence, links, media and hierarchy; test representative changes; and report exactly what changed and what was verified. Never claim a site-wide implementation from a single-page test.
