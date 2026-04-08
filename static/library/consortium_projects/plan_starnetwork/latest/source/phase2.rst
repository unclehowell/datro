Phase 2: Documentation and Publication
========================================

**Duration:** 20 minutes
**Executor:** Local AI Agent
**Status:** In Progress

Task Breakdown
---------------

+------+-------------------------------------------------------------+---------+----------+
| Task | Description                                                 | Time    | Status   |
+======+=============================================================+=========+==========+
| 2.1  | Write Mandate RST files                                    | 3 min   | Complete |
|      | index + purpose + background + objectives + constraints     |         |          |
|      | + scope + quality + approval                               |         |          |
+------+-------------------------------------------------------------+---------+----------+
| 2.2  | Write Brief RST files                                      | 3 min   | Complete |
|      | index + executive_summary + proposed_solution               |         |          |
|      | + work_packages + timeline + deliverables + risks + approval |         |          |
+------+-------------------------------------------------------------+---------+----------+
| 2.3  | Write Plan RST files                                       | 3 min   | In Prog  |
|      | index + intro + phase1 + phase2 + progress + success       |         |          |
|      | + issues                                                    |         |          |
+------+-------------------------------------------------------------+---------+----------+
| 2.4  | Write Highlight Report RST files                           | 2 min   | Pending  |
|      | index + summary + outcomes + issues + lessons + approval    |         |          |
+------+-------------------------------------------------------------+---------+----------+
| 2.5  | Build HTML (English) for all 4 documents                   | 5 min   | Pending  |
|      | Sphinx make html for each document                          |         |          |
+------+-------------------------------------------------------------+---------+----------+
| 2.6  | Build PDF (English) for all 4 documents                    | 5 min   | Pending  |
|      | Sphinx make latexpdf for each document                     |         |          |
+------+-------------------------------------------------------------+---------+----------+
| 2.7  | Update .treeview.json in consortium_projects               | 1 min   | Pending  |
+------+-------------------------------------------------------------+---------+----------+
| 2.8  | Commit docs to autosync branch, create PR with preview URL | 2 min   | Pending  |
+------+-------------------------------------------------------------+---------+----------+

Deliverable Paths
------------------

Each document compiles to:

- **HTML:** ``consortium_projects/{doc}_starnetwork/latest/build/html/en/``
- **PDF:** ``consortium_projects/{doc}_starnetwork/latest/build/pdfs/en/``

Preview will be available at:
``https://library.datro.xyz/consortium_projects/{doc}_starnetwork/latest/build/html/en/``
(after Cloudflare Pages builds the PR)
