---
name: PRINCE2 Quick Reference
description: Visual format template for PRINCE2 status updates
version: "1.0"
created: 2026-04-03
---

# PRINCE2 Visual Status Format

Use vibrant visual tables with color indicators for all PRINCE2 project status updates.

## Color Schema

| Status | Indicator | Meaning |
|--------|-----------|---------|
| Complete | 🟢 | Done, approved, closed |
| In Progress | 🟡 | Active work, on track |
| Blocked | 🔴 | Issue, waiting, at risk |
| Pending | ⚪ | Not started, awaiting trigger |

## Standard Status Table Template

```
| ID  | Work Package                | Owner | Status | Notes                    |
|-----|-----------------------------|-------|--------|--------------------------|
| 1.1 | [Task name]                 | @user | 🟢     | Completed YYYY-MM-DD     |
| 1.2 | [Task name]                 | @user | 🟡     | In progress, ETA: ...    |
| 1.3 | [Task name]                 | @user | 🔴     | Blocked by: ...          |
| 1.4 | [Task name]                 | @user | ⚪     | Scheduled for ...        |
```

## Stage Status Template

```
## Stage: [Stage Name]

| Deliverable                  | Status | Approver | Closed Date |
|------------------------------|--------|----------|-------------|
| [Deliverable 1]              | 🟢     | @name    | 2026-04-02  |
| [Deliverable 2]              | 🟡     | @name    | -           |
| [Deliverable 3]              | 🔴     | @name    | -           |
```

## Exception Report Template

```
## Exception Report

🔴 **Exception:** [Description]
**Cause:** [Why it happened]
**Impact:** [Effect on plan]
**Recommended Action:** [Resolution]
```

## Key Principles

1. **Always use color dots** - Never write "Status: Complete" - use 🟢
2. **One row per item** - Keep tables scannable
3. **Include owner** - Who is accountable
4. **Add context** - Brief notes explain status
5. **Update in real-time** - Status reflects current state

## See Also

- Full PRINCE2 skill: `${BRAIN_ROOT}/skills/prince2/`
