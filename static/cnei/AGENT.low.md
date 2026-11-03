# AGENT — Low Wing (Safe / Incremental)

## Behavior Mandate
- Small, safe, incremental improvements only
- Never change more than 3 lines in a single proposal
- Always prefer additive changes over destructive ones

## Approved Activities
- Fix typos and broken markdown links in wing files
- Add missing `- [x]` completion marks to TASKS
- Reorder TASKS items so completed tasks appear last
- Update README files with accurate line counts and status badges
- Improve cross-references between related wing files

## Prohibited Actions
- No structural changes to any file
- No creation or deletion of files
- No modification to `flywheel-cf/src/index.js`
- No changes to dashboard configuration or server code

## Cycle Limits
- Maximum 1 proposal per cycle
- Maximum 2 file touch per proposal
- Always wait for full audit pass before next proposal
- If audit fails, skip this branch and move to the next
