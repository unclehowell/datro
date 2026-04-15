# Finance Cheque UK — Naming Standardisation & Uniformity Policy

**CRITICAL**: This document defines the ONLY acceptable structure for brain.financecheque.uk and all archives. Deviations are bugs that must be fixed immediately.

---

## Directory Structure (MANDATORY)

All content MUST follow this two-level structure:

```
{Cat1-Cat2}_{Sub1-Sub2}/{Sub1-Sub2}_{Doc1-Doc2}/latest/source/
```

### Examples

| Correct Structure | Wrong (Flat) |
|-------------------|--------------|
| `fcuk-memory_fcuk-longterm/fcuk-longterm_fcuk-honcho/` | ❌ `memory_longterm/` |
| `fcuk-agent_fcuk-soul/fcuk-soul_fcuk-soul/` | ❌ `agent_soul/` |
| `fcuk-agent_fcuk-memory/fcuk-memory_fcuk-memory/` | ❌ `agent_memory/` |
| `fcuk-agent_fcuk-skills/fcuk-skills_fcuk-autonomous/` | ❌ `agent_skills_autonomous/` |

**Rule**: Categories contain subcategories. Subcategories contain documents. Documents are NEVER at the root level.

---

## Double-Barrelled IDs (MANDATORY)

Every ID (category, subcategory, document) MUST have exactly two words separated by a hyphen.

### FCUK Filler Rule

**FCUK** = Finance Cheque UK (brand acronym)

- If ID already has hyphen (e.g., `finance-cheque`, `mem-zero`, `real-estate`): **use as-is**
- If ID is single word (e.g., `memory`, `longterm`, `honcho`, `agent`, `soul`): **add `fcuk-` prefix**
- If ID is empty or `-`: **use `fcuk-fcuk`**

### Examples

| Input | Output | Reason |
|-------|--------|--------|
| `memory` | `fcuk-memory` | Single word → add fcuk prefix |
| `longterm` | `fcuk-longterm` | Single word → add fcuk prefix |
| `honcho` | `fcuk-honcho` | Single word → add fcuk prefix |
| `agent` | `fcuk-agent` | Single word → add fcuk prefix |
| `soul` | `fcuk-soul` | Single word → add fcuk prefix |
| `finance-cheque` | `finance-cheque` | Already has hyphen → keep as-is |
| `mem-zero` | `mem-zero` | Already has hyphen → keep as-is |
| `real-estate` | `real-estate` | Already has hyphen → keep as-is |
| `car-finance` | `car-finance` | Already has hyphen → keep as-is |
| `-` or empty | `fcuk-fcuk` | Empty → double fcuk |

---

## File Naming Standard (Archives Only)

Wayback/library/netlify archives use this format:

```
YYYY-MM-DD_{Cat1-Cat2}_{Sub1-Sub2}__{Sub1-Sub2}_{Doc1-Doc2}_{lang}_vX.X.X.ext
```

### Components

1. **Date**: `YYYY-MM-DD` — publish date (first git commit), NOT archive date
2. **Category**: `Cat1-Cat2` — double-barrelled with fcuk if needed
3. **Subcategory**: `Sub1-Sub2` — double-barrelled with fcuk if needed
4. **Subcategory (repeated)**: `Sub1-Sub2` — MUST match component 3 exactly
5. **Document**: `Doc1-Doc2` — double-barrelled with fcuk if needed
6. **Language**: `en`, `es`, `fr`, etc. (ISO 639-1)
7. **Version**: `vX.X.X` — semantic versioning
8. **Extension**: `md`, `pdf`, etc.

### Separators

- **Single underscore `_`**: Separates major components
- **Double underscore `__`**: Separates quarters 2 and 3 (subcategory repeated)
- **Hyphen `-`**: Within IDs for double-barrelled words

---

## PDF Requirements (CRITICAL)

**PDFs MUST NOT be blank white pages.**

### Current Issue
- PDFs on brain.financecheque.uk are blank (no text, just white pages)
- This indicates Sphinx LaTeX build is broken

### Fix Required
1. Check Sphinx conf.py latex configuration
2. Verify LaTeX packages installed (texlive-full)
3. Test PDF generation locally before deploying
4. PDFs must contain actual rendered markdown content

---

## Footer Requirements (CRITICAL)

**All pages MUST have correct branding.**

### Current Issue
Footer says: `© datro.xyz | 2012-2026 DATRO Consortium`

### Required Footer
```
© financecheque.uk | 2012-2026 Finance Cheque UK
```

### Fix Locations
1. `conf.py` (Sphinx configuration): `copyright = u'Finance Cheque UK'`
2. `_theme-explorer/` templates: Update footer HTML
3. `index.html` templates: Update copyright text
4. Any hardcoded "datro.xyz" references → change to "financecheque.uk"
5. Any "DATRO Consortium" references → change to "Finance Cheque UK"

---

## Homepage Structure (CRITICAL)

**Homepage MUST show categories, NOT documents.**

### Current Issue
- Documents appear directly on homepage (flat structure)
- Example: `agent_soul`, `agent_memory`, `memory_longterm` all visible at root

### Required Structure
Homepage shows:
1. **Categories** (e.g., "Agent", "Memory", "Skills")
2. Click category → see **subcategories**
3. Click subcategory → see **documents**

### Implementation
- `_treeview.json` must have hierarchical structure
- Categories group related subcategories
- Documents never appear at root level

---

## Quality Checklist

Before deploying to brain.financecheque.uk:

- [ ] All directories follow `{Cat1-Cat2}_{Sub1-Sub2}/{Sub1-Sub2}_{Doc1-Doc2}/` structure
- [ ] All IDs are double-barrelled (fcuk prefix added where needed)
- [ ] PDFs contain actual content (not blank pages)
- [ ] Footer says "© financecheque.uk | 2012-2026 Finance Cheque UK"
- [ ] Homepage shows categories (not documents)
- [ ] All files reachable via API
- [ ] Publish dates from first git commit (not archive date)

---

## Automation Schedule

| Job | Schedule | Purpose |
|-----|----------|---------|
| Session compression | Hourly (`:55`) | Kiro/Hermes → mem0/Honcho |
| Brain → Wayback | Twice daily (06:00, 18:00) | Archive to wayback.financecheque.uk |
| Mem0/Honcho → Brain | Twice daily (00:00, 12:00) | Sync to brain intray |

---

## Branches & Deployments

| Branch | Domain | Purpose |
|--------|--------|---------|
| `llmwiki` | brain.financecheque.uk | LLM-classified knowledge base |
| `wayback` | wayback.financecheque.uk | Standardised archive |
| `ui-prod` | ui.financecheque.uk | UI project |
| `financecheque-prod` | financecheque.uk | Main site |
| `datro-prod` | datro.xyz | DATRO site |
| `carfinance-prod` | carfinancecheque.uk | Car finance site |
| `bpvs-prod` | bpvsbuckler.com | BPVS site |
| `ccan-prod` | ccan.datro.xyz | CCAN site |
| `dcc-prod` | dcc.datro.xyz | DCC site |
| `ceo-prod` | ceo.datro.xyz | CEO site |

---

## Common Mistakes (DO NOT REPEAT)

### ❌ Wrong
```
agent_soul/                          # Flat structure
agent_memory/                        # Single-word IDs
memory_longterm/                     # Document at root level
Footer: © datro.xyz                  # Wrong branding
PDFs: blank white pages              # Broken build
```

### ✅ Correct
```
fcuk-agent_fcuk-soul/fcuk-soul_fcuk-soul/           # Two-level, double-barrelled
fcuk-agent_fcuk-memory/fcuk-memory_fcuk-memory/     # Proper nesting
fcuk-memory_fcuk-longterm/fcuk-longterm_fcuk-honcho/ # Category → subcategory → document
Footer: © financecheque.uk | 2012-2026 Finance Cheque UK
PDFs: actual rendered content
```

---

## Version History

- **2026-04-14**: Added PDF requirements, footer requirements, homepage structure requirements
- **2026-04-14**: Clarified fcuk filler rule with examples
- **2026-04-14**: Added quality checklist and common mistakes section
- **2026-04-14**: Updated automation schedule (twice daily instead of every 3 hours)
