Progress Tracking
==================

Method
-------

Progress is tracked via this document. Each task status is updated as work
proceeds. Completion criteria are defined per phase.

Progress Table
---------------

+------+--------+--------------+----------+----------+
| Task | Phase  | Dependencies | Progress | ETA       |
+======+========+==============+==========+==========+
| 1.1  | 1      | None         | 100%     | Done     |
| 1.2  | 1      | None         | 100%     | Done     |
| 1.3  | 1      | 1.1, 1.2     | 100%     | Done     |
| 1.4  | 1      | 1.3          | 100%     | Done     |
| 1.5  | 1      | 1.1          | 100%     | Done     |
| 1.6  | 1      | 1.1          | 100%     | Done     |
| 2.1  | 2      | Phase 1      | 100%     | Done     |
| 2.2  | 2      | Phase 1      | 100%     | Done     |
| 2.3  | 2      | Phase 1      | 80%      | In Prog  |
| 2.4  | 2      | 2.3          | 0%       | Next     |
| 2.5  | 2      | 2.1-2.4      | 0%       | Pending  |
| 2.6  | 2      | 2.5          | 0%       | Pending  |
| 2.7  | 2      | 2.5          | 0%       | Pending  |
| 2.8  | 2      | 2.5-2.7      | 0%       | Pending  |
+------+--------+--------------+----------+----------+

Overall Project Progress: **52%** (7/13 tasks complete, 1 in progress)
