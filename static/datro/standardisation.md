# Finance Cheque UK — Naming Standardisation & Uniformity Policy

## Directory Structure

All content follows this structure:

```
{categoryID}_{subcategoryID}/{subcategoryID}_{documentID}/latest/source/
```

## File Naming Standard

All archived files (wayback, library, netlify) use this format:

```
YYYY-MM-DD_{Cat1-Cat2}_{Sub1-Sub2}__{Sub1-Sub2}_{Doc1-Doc2}_{lang}_vX.X.X.ext
```

### Components

1. **Date**: `YYYY-MM-DD` — publish date (first git commit), not archive date
2. **Category**: `Cat1-Cat2` — two words separated by hyphen
3. **Subcategory**: `Sub1-Sub2` — two words separated by hyphen
4. **Subcategory (repeated)**: `Sub1-Sub2` — must match component 3 exactly
5. **Document**: `Doc1-Doc2` — two words separated by hyphen
6. **Language**: `en`, `es`, `fr`, etc. (ISO 639-1 two-letter code)
7. **Version**: `vX.X.X` — semantic versioning
8. **Extension**: `md`, `pdf`, etc.

### Double-Barrelled IDs

Each ID (category, subcategory, document) **must** contain exactly two words separated by a hyphen.

- If an ID already has a hyphen (e.g., `finance-cheque`, `mem-zero`), use as-is
- If an ID is a single word (e.g., `longterm`, `honcho`), prefix with `fcuk-`

**FCUK** = Finance Cheque UK (brand acronym, used as filler)

### Examples

| Brain Directory | Wayback Filename |
|----------------|------------------|
| `finance-cheque_longterm/longterm_mem-zero/` | `2026-04-14_finance-cheque_fcuk-longterm__fcuk-longterm_mem-zero_en_v0.0.1.md` |
| `memory_car-finance/car-finance_lease-guide/` | `2026-04-14_fcuk-memory_car-finance__car-finance_lease-guide_en_v0.0.1.md` |
| `real-estate_property/property_rental-guide/` | `2026-04-14_real-estate_fcuk-property__fcuk-property_rental-guide_en_v0.0.1.md` |

### Separators

- **Single underscore `_`**: Separates major components (date, category, subcategory, document, language, version)
- **Double underscore `__`**: Separates the two middle quarters (subcategory appears twice)
- **Hyphen `-`**: Used within IDs for double-barrelled words

### Version Increments

- **Patch** (`0.0.X`): Content updates, typo fixes
- **Minor** (`0.X.0`): New sections, significant additions
- **Major** (`X.0.0`): Complete rewrites, structural changes

## Quality Requirements

1. **PDFs must have actual content** (not blank white pages)
2. **All documents must have a category/subcategory/document filepath**
3. **Publish date = first git commit date** (not archive date)
4. **Homepage shows categories**, documents appear inside categories
5. **All files must be reachable via API**

## Branches

- **`llmwiki`**: brain.financecheque.uk (LLM-classified knowledge base)
- **`wayback`**: wayback.financecheque.uk (standardised archive)
- **`netlify`**: wayback.datro.xyz (netlify mirror)
- **`gh-pages`**: Other CF Pages projects

## Automation

- **Kiro/Hermes sessions** → compressed to mem0/Honcho every hour (`:55`)
- **Brain → Wayback** → archived every 3 hours (`:00` on 3rd hour)
- **Secrets redacted** from all archived chat sessions
