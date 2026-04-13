# Library Standardisation Analysis

Document management standards identified in `/home/unclehowell/datro/static/library/`

---

## Standardized Patterns (Ranked by Compliance)

| Rank | Pattern | Standard | Compliance |
|------|---------|----------|------------|
| 1 | Directory naming | `prefix_category` (e.g., `consortium_contracts`) | ~90% |
| 2 | Version folders | `latest/` or `0-0-N` semantic versioning | ~85% |
| 3 | File naming | lowercase_with_underscores | ~80% |
| 4 | Build scripts | `rebuild.sh` with Sphinx workflow | ~75% |
| 5 | Navigation files | `_treeview.json` + `index.html` | ~70% |
| 6 | Sphinx config | `conf.py` with standard structure | ~65% |
| 7 | Language structure | ISO 639-1 (`en/`, `de/`, `es/`, `fr/`) | ~60% |

---

## Directory Structure Convention

### Standard Two-Level Depth
```
doc_category/
├── _treeview.json
├── index.html
├── subcategory_document/
│   ├── latest/
│   │   ├── source/       # .rst source files + conf.py
│   │   ├── build/      # Compiled output (html/latex)
│   │   ├── rebuild.sh
│   │   └── auto-rebuild.sh
│   └── older_versions/    # Previous releases (0-0-1, 0-0-4)
```

### Directory Naming Format
- **Standard:** `prefix_category` (underscore separator)
- **Example:** `consortium_contracts`, `consortium_finance`
- **PDF naming:** `category-document.pdf` (dash for PDF names)

---

## File Extension Standards

| Type | Extensions |
|------|------------|
| Source | `.rst`, `.md`, `.py` (conf.py) |
| Build output | `.html`, `.pdf`, `.doctree`, `.pickle` |
| Assets | `.png`, `.jpg`, `.svg`, `.woff`, `.woff2` |
| Data | `.csv` (issues.csv, olderversions.csv) |

---

## Build Process Standard

1. **Source:** RST files in `source/` directory
2. **Build:** `make html` → HTML output
3. **PDF:** `make latexpdf` → PDF output
4. **Theme:** Apply post-processing theme script
5. **Script:** Custom `rebuild.sh` with progress bar
6. **Config:** `conf.py` defines project, version, theme

### Sphinx Configuration Template
```python
project = u'DATRO Document'
version = u'0.0.1'
release = u'0.0.1-XX.1'
html_theme = 'sphinx_rtd_theme'
```

---

## HTML Theme Standard

### Theme Application Pipeline

The theme is applied as a **post-processing step** after Sphinx HTML build using `sed` scripts in `_theme-docs/`:

```
make html → copy theme.sh → sed/path substitution → apply per language
```

### Available Themes

| Theme | File | Color Palette |
|-------|------|------------|
| **Blue** | `blue.sh` | darkslateblue (`#33368C`), darkpurple (`#29808A`) |
| **Grey** | `grey.sh` | darkgrey (`#2C2C2C`), charcoal (`#454545`) |

### Theme Application Process

1. **Copy theme script:** Copy `blue.sh` or `grey.sh` to `theme.sh`
2. **Path substitution:** Replace `build/html/` with `build/html/{lang}/`
3. **Apply per language:** Run `en.sh`, `es.sh`, `de.sh`, `fr.sh` sequentially
4. **Cleanup:** Remove temporary theme scripts

### Theme Modifications (blue.sh example)

**CSS Color Replacements:**
```bash
# Primary brand color
sed -i 's/#33368C/darkslateblue/g' build/html/_static/css/theme.css

# Background gradients
sed -i 's/#fcfcfc/-webkit-gradient(radial,50% 50%,450,50% 55%,60,from(#333650),to(#333666))/g'

# Text colors
sed -i 's/#4e4a4a/#333569/g' build/html/_static/css/theme.css
sed -i 's/#4d4d4d/grey/g' build/html/_static/css/theme.css
```

**HTML Modifications:**
```bash
# Remove breadcrumbs aside
sed -i '/\<li class\="wy-breadcrumbs-aside">/,+6d' build/html/*.html

# Add version label
sed -i 's/<div class="version">/<div class="version"> Document Version : /g'

# Add custom scrollbar CSS
sed -i 's/<\/head>/<style>html{overflow-y:scroll;} ::-webkit-scrollbar{width:0px;background:transparent;}<\/style><\/head>/g'
```

**Layout Adjustments:**
```bash
# Fixed navigation
sed -i 's/.wy-nav-top{/.wy-nav-top{width:100vw!important;position:fixed!important;/g'

# Scroll padding
sed -i 's/body{/body{scroll-padding-top: 70px!important;/g'

# Text alignment
sed -i 's/body{/body{text-align:justify;/g'
```

### Theme Script Location

- **Master themes:** `_theme-docs/blue.sh`, `_theme-docs/grey.sh`
- **Usage:** Called during `rebuild-master.sh` at Step 4 (after HTML build, before PDF)

### Calling Theme in rebuild.sh

```bash
# Select theme (blue default)
cp -r ../../../_theme-docs/blue.sh blue.sh 2> /dev/null && mv ./blue.sh ./theme.sh &&

# Apply to each language
sed 's|build\/html/|build\/html\/en/|g' ./theme.sh > ./en.sh && bash ./en.sh && rm ./en.sh
sed 's|build\/html/|build\/html\/es/|g' ./theme.sh > ./es.sh && bash ./es.sh && rm ./es.sh
sed 's|build\/html/|build\/html\/de/|g' ./theme.sh > ./de.sh && bash ./de.sh && rm ./de.sh
sed 's|build\/html/|build\/html\/fr/|g' ./theme.sh > ./fr.sh && bash ./fr.sh && rm ./fr.sh

rm ./theme.sh
```

---

## Known Anomalies / Exceptions

1. **Inconsistent folder depth** - Some docs at depth 3+ (breaks 2-level limit)
2. **Missing rebuild.sh** - Several directories lack build scripts - FIXED
3. **PDF naming variations** - Underscores vs dashes inconsistently applied
4. **Older version handling** - Not all have `older_versions/` structure
5. **Custom CSV location** - Business data scattered without standard path
6. **Translation files** - Partial i18n coverage (not all dirs have locales)

---

## Version Numbering

- **Format:** `{major}-{minor}-{revision}` (e.g., `0-0-1`, `0-0-4`)
- **Current:** `latest/` symlink or directory
- **Archive:** `older_versions/` subdirectory

---

## Navigation Standard

Each directory MUST contain:
- `_treeview.json` - Navigation tree metadata
- `index.html` - Web navigation page

### _treeview.json Schema
```json
{
  "name": "Category Name",
  "children": [
    {"name": "Document", "file": "doc.rst", "flags": ["new", "updated"]}
  ]
}
```

---

## Language Codes (ISO 639-1)

- `en/` - English
- `de/` - Deutsch
- `es/` - Español
- `fr/` - Français

---

## Agentic Workflow Targets

1. **Auto-fix rebuild.sh** - Create missing build scripts - ✅ DONE
2. **Standardize depth** - Enforce 2-level directory limit
3. **Normalize naming** - Apply lowercase_underscore convention - ✅ DONE
4. **Generate treeview.json** - Where missing - ✅ DONE
5. **Structure older_versions/** - Consistent version archive
6. **Complete translations** - Full i18n coverage
7. **Theme consistency** - Ensure theme.sh called in all rebuild scripts
8. **Color palette standardization** - Choose default theme (blue/grey)

---

## Completed Fixes (2026-04-13)

### Created Files
- 6x `_treeview.json` (consortium_das, scottishbay_whitepaper, consortium_exchange, consortium_financialforecast, brief_email_marketing, coming_soon)
- 3x `rebuild.sh` (scottishbay_whitepaper/latest, consortium_financialforecast/latest, brief_email_marketing/latest)
- 2x `conf.py` (scottishbay_whitepaper/source, consortium_financialforecast/source)

### Renamed Folders
- `scottishbay-whitepaper` → `scottishbay_whitepaper`
- `consortium-exchange` → `consortium_exchange`
- `consortium-financialforecast` → `consortium_financialforecast`
- `brief_email-marketing` → `brief_email_marketing`

---

## Agent Access Library (.agent/)

Complementary serverless API for agent interactions - works alongside existing HTML/PDF documentation.

### Architecture
```
.agent/
├── api/worker.js        # Cloudflare Worker (serverless API)
├── api/wrangler.toml   # Deployment config
├── schema/              # JSON schemas (project, change_request, interaction)
├── tokens/index.json   # Agent API keys
├── cli/agent-cli.js     # CLI tool for agents
├── data/                # JSON data storage
└── README.md           # Dual-access docs (human + agent)
```

### Access Methods
| Method | URL | Purpose |
|--------|-----|---------|
| Human Web | `/library/consortium_projects/` | HTML views, PDF downloads |
| Agent API | `/.agent/api/*` | REST endpoints |
| Agent CLI | `agent-cli` commands | CLI tool |

### API Endpoints
- `GET /.agent/api/projects` - List/create projects
- `GET /.agent/api/change_requests` - Submit/approve CRs
- `GET /.agent/api/interactions` - Log interactions
- `POST /.agent/api/auth` - Get access token

### Data Storage
- Projects: `.agent/data/projects/index.json`
- Change Requests: `.agent/data/change_requests/index.json`
- Interactions: `.agent/data/interactions/index.json`

### Agent Tokens
Register agents in `.agent/tokens/index.json`

---

*Generated: 2026-04-13*
*Updated: 2026-04-13*