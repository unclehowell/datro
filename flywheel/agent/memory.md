# Agent Memory — Learnings & Patterns

## Prompt Engineering

- Asking for "the single biggest bug" produces better results than "list all bugs"
- Including branch context (purpose, URL, last fix) produces more relevant fixes
- UX prompts should explicitly ask for improvement to the deployed website, not just code cleanup
- Timeout of 60s is sufficient for most AI sources

## Fix Type Effectiveness

| Fix Type | Success Rate | Notes |
|----------|-------------|-------|
| console.log removal | Medium | Branches are mostly clean |
| Commented code removal | Medium | Some branches have legacy comments |
| Trailing whitespace | High | Almost always finds something |
| Duplicate blank lines | High | Almost always finds something |
| DOCTYPE/charset | Low | Most HTML files already have these |
| Viewport/lang | Low | Already applied to most branches |

## Branch Patterns

- Many branches share a common `index.html` with iframe → changes to this file affect ALL branches
- Unique content is in `static/{branch}/` directories
- Python branches (dash, whitepaper) need different fix types than static sites
- React branches (dcc, pirateclaw, althea) have JSX files that need JSX-aware fixes

## What Broke

- Raw f-string `\{` in Python regex caused invalid escape `\c` → Python crash → flywheel stall
- `set -e` + `2>/dev/null` hid errors silently → took hours to diagnose
- Versioning with 99-wrap was confusing → simplified to N//100.N%100

## What Worked

- `|| true` guards on critical paths prevent cascade failures
- Guaranteed fallback passes ensure every release has content
- Separating UX variables from bug variables keeps release notes clean
- Single AI call with full branch context produces better fixes than multiple narrow calls
