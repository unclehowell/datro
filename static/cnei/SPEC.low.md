# SPEC — Low Wing (Low-Risk / Incremental)

## Safe Compliance Items
- [x] All wing files use consistent `##` heading structure
- [x] TASKS files use `- [ ]` / `- [x]` checklist format
- [ ] Every wing file stays under 30 lines
- [ ] No file exceeds 80-character line width

## Documentation
- [ ] Add inline comments to `flywheel-cf/src/index.js` tier boundaries
- [ ] Create a wing file style guide in dashboard help panel
- [ ] Document the bias/risk steering pad value ranges (-1 to +1)

## Incremental Wins
- Add wing-file last-modified timestamps to dashboard display
- Implement auto-save draft recovery for in-progress wing edits
- Add wing file word/line count to branch tree tooltips
- Highlight incomplete TASKS (`- [ ]`) in red in dashboard view

## Quality of Life
- Sort branches alphabetically in dashboard tree panel
- Add keyboard shortcuts: `Ctrl+S` save wing, `Ctrl+E` expand all
- Preserve scroll position when switching between wing files
