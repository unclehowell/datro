# DATRO Library Documentation Skill

## Purpose
This skill defines the complete process for creating documents in the DATRO Consortium Document Library. It ensures all documents follow the exact structure, build process, and standards used throughout the library.

## When to Use
Use this skill whenever creating new documents in `/home/unclehowell/datro/static/library/`. This applies to:
- Project Mandates
- Project Briefs/Whitepapers
- Project Plans
- Any other document type in the library

## Prerequisites

### Required Tools
- Sphinx (for building HTML/PDF from RST)
- latexmk (for PDF generation)
- texlive-latex-extra (for LaTeX packages)
- Theme scripts (blue.sh or grey.sh from `_theme-docs/`)

### Required Structure
Each document MUST follow this exact folder structure:

```
document_folder/
├── index.html              # Menu wrapper (loads _treeview.json)
├── _treeview.json          # Language navigation
└── latest/
    ├── rebuild.sh          # Build script (MUST be from working doc)
    ├── Makefile           # Sphinx Makefile
    ├── source/
    │   ├── conf.py        # Sphinx configuration
    │   ├── index.rst      # Main document content
    │   ├── releasenotes.rst
    │   └── locales/      # Translation files (de, es, fr)
    └── build/
        ├── html/
        │   ├── index.html    # Redirect to ./en/
        │   └── en/            # English HTML output
        │       └── index.html # Document content
        └── latex/
            └── en/            # PDF output
                └── index.html # Redirect to PDF file
```

## Step-by-Step Process

### Step 1: Set Up Folder Structure

Create the document folder under the appropriate library category:
```bash
cd /home/unclehowell/datro/static/library/[category]/
mkdir -p document_name/latest/source
```

### Step 2: Copy Working Build Scripts
CRITICAL: Always copy `rebuild.sh` and `Makefile` from an existing working document. Never create new ones from scratch.

```bash
cp /path/to/working_doc/latest/rebuild.sh latest/
cp /path/to/working_doc/latest/Makefile latest/
```

Working reference documents:
- `/home/unclehowell/datro/static/library/consortium_projects/mandate_guide/latest/`
- `/home/unclehowell/datro/static/library/consortium_projects/brief_bloculus/latest/`

### Step 3: Create Sphinx Configuration (conf.py)

Copy from working doc and update these variables:
```python
project = u'Document Title'
copyright = u'2026, DATRO Consortium'
author = u'Document Author'

version = u'0.0.0'
release = u'0.0.0'

# IMPORTANT: Output filename base (used for PDF)
htmlhelp_basename = 'consortium_projects-document_name'

latex_documents = [
    (master_doc, 'consortium_projects-document_name.tex', u'Document Title',
     u'Author(s): DATRO Consortium', 'manual'),
]
```

### Step 4: Create Document Content (RST)

Create comprehensive content in `source/index.rst`. Include:
- Executive Summary
- Background/Purpose
- Objectives
- Scope/Deliverables
- Work Packages (with tables showing tasks, percentages, owners)
- Timeline (with phases)
- Risks and Mitigations
- Quality Expectations
- Approval Requirements

Use RST features:
- Tables (using `====` syntax)
- Section headings
- Lists (bullet and numbered)
- Code blocks if needed
- toctree for additional sections

### Step 5: Create Menu Wrapper (index.html)

Create at document root level (`document_name/index.html`):
```html
<!DOCTYPE html>
<html>
  <head>
  <meta charset="UTF-8">
  <meta content="DATRO Library" name="description">
  <meta content="DATRO Consortium" name="author">
  <title>Document Title</title>
  <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, shrink-to-fit=no" name="viewport">
  <!-- FAVICONS - Always use ../../_theme-explorer/ paths -->
  <link href="../../_theme-explorer/favicons/apple-icon-57x57.png" rel="apple-touch-icon" sizes="57x57">
  <!-- ... more favicons ... -->
  <link rel="stylesheet" href="../../_theme-explorer/style.css">
  <link rel="stylesheet" href="../../_theme-explorer/glyphicon.css">
  <style>
    html { overflow-y: scroll; overflow-x: hidden; }
    ::-webkit-scrollbar { width: 0px; background: transparent; }
  </style>
  </head>
  <body>
    <script>
      (async () => {
        const response = await fetch('_treeview.json');
        const data = await response.json();
        let htmlString = '<ul>';
        htmlString += `<a href="../" class="up-active"><<</a>`;
        htmlString += `<p class="main-title"><img class="main-logo ml-datro"><br>Document Title</p>`;
        for (let file of data) {
          htmlString += `<li class="li"><a href="${file.path}">${file.name}</a></li>`;
        }
        htmlString += '</ul>';
        document.getElementsByTagName('body')[0].innerHTML = htmlString;
      })()
    </script>
  </body>
  <script src="../../_theme-explorer/jquery.min.js"></script>
</html>
```

### Step 6: Create Treeview Navigation (_treeview.json)

Create at document root level with exact format:
```json
[
  {
    "name": "<div><b class='greenish' title='Green = HTML'>HTML</b>|<b class='redish' title='Red = PDF'>PDF</b></div>",
    "path": "javascript:void(0)",
    "_links": { "html": "javascript:void(0)" }
   },
   {
     "name": "<div class='title-line title-disable'><div class='flag f-gb'></div>English</div>",
     "path": "javascript:void(0)",
     "_links": { "html": "javascript:void(0)" }
    },
   {
     "name": "<div class='language-subtitle-line enable-link gish' title=''>Latest</div>",
     "path": "./latest/build/html/en/index.html",
     "_links": { "html": "./latest/build/html/en/index.html" }
    },
   {
     "name": "<div class='language-subtitle-line enable-link rish' title=''>0.0.0</div>",
     "path": "./latest/build/latex/en/index.html",
     "_links": { "html": "./latest/build/latex/en/index.html" }
    },
   {
     "name": "<div class='title-line title-disable' ><div class='flag f-es'></div>Español</div>",
     "path": "javascript:void(0)",
     "_links": { "html": "javascript:void(0)" }
    },
   {
     "name": "<div class='language-subtitle-line subtitle-disable gish'>Reciente</div>",
     "path": "javascript:void(0)",
     "_links": { "html": "javascript:void(0)" }
    },
   {
     "name": "<div class='language-subtitle-line subtitle-disable rish'>x-x-x</div>",
     "path": "javascript:void(0)",
     "_links": { "html": "javascript:void(0)" }
    },
   {
     "name": "<div class='title-line title-disable'><div class='flag f-de'></div>Deutsch</div>",
     "path": "javascript:void(0)",
     "_links": { "html": "javascript:void(0)" }
    },
   {
     "name": "<div class='language-subtitle-line subtitle-disable gish'>Neueste</div>",
     "path": "javascript:void(0)",
     "_links": { "html": "javascript:void(0)" }
    },
   {
     "name": "<div class='language-subtitle-line subtitle-disable rish'>x-x-x</div>",
     "path": "javascript:void(0)",
     "_links": { "html": "javascript:void(0)" }
    },
   {
     "name": "<div class='title-line title-disable' ><div class='flag f-fr'></div>Française</div>",
     "path": "javascript:void(0)",
     "_links": { "html": "javascript:void(0)" }
    },
   {
     "name": "<div class='language-subtitle-line subtitle-disable gish'>Dernier</div>",
     "path": "javascript:void(0)",
     "_links": { "html": "javascript:void(0)" }
    },
   {
     "name": "<div class='language-subtitle-line subtitle-disable rish'>x-x-x</div>",
     "path": "javascript:void(0)",
     "_links": { "html": "javascript:void(0)" }
    },
   {
     "name": "<div class='page-scroll-fix'></div>",
     "path": "javascript:void(0)",
     "_links": { "html": "javascript:void(0)" }
    }
]
```

### Step 7: Build the Document

Run the rebuild script:
```bash
cd /path/to/document_name/latest/
./rebuild.sh
```

This will:
1. Clean old builds
2. Generate HTML (en, es, de, fr)
3. Generate PDF (en, es, de, fr)
4. Apply blue/grey theme to HTML
5. Update auto-rebuild scripts

### Step 8: Add to Parent Navigation

Update the parent `_treeview.json` to include the new document:
```json
{
  "name": "<div class='subtitle-line subtitle-enable'>Document Name</div>",
  "path": "./document_name/index.html",
  "_links": {
    "html": "./document_name/index.html"
  }
}
```

## Key Conventions

### Paths
- Always use relative paths from document root
- Theme paths use `../../_theme-explorer/`
- Build output paths are `./latest/build/html/en/` and `./latest/build/latex/en/`

### Versioning
- Semantic versioning (0-0-1, 0-0-2, etc.) only created when UPGRADING
- Development version is always `latest/`
- When upgrading: copy `latest/` to `0-0-X/` and update symlinks

### PDF Naming
The PDF filename in conf.py MUST match what the rebuild.sh produces:
- `consortium_projects-{document_name}.pdf`
- Example: `mandate_infrasync` → `consortium_projects-mandate_infrasync.pdf`

### Theme Application
The rebuild.sh automatically applies themes from `_theme-docs/`:
- `blue.sh` - Dark blue theme (default)
- `grey.sh` - Alternative grey theme
- Located at `../../../_theme-docs/` from document folder

### NEVER Do
1. Don't create rebuild.sh from scratch - always copy from working doc
2. Don't skip copying Makefile
3. Don't use different _treeview.json format
4. Don't skip installing latexmk for PDF generation
5. Don't create circular symlinks
6. Don't put version folders (0-0-X) in development - only at upgrade

### ALWAYS Do
1. Use PRINCE2 methodology (Mandate → Brief → Plan)
2. Elaborate documents with tables, sections, detailed content
3. Use the exact HTML wrapper format
4. Match existing library structure exactly
5. Test in browser after building

## Content Best Practices

### For Mandates
- Clear statement of what client wants
- Background on current issues
- Objectives (numbered list)
- Constraints (budget, time, resources)
- Quality expectations
- Approval required section

### For Briefs
- Executive summary
- Proposed solution (with work packages table)
- Timeline (phased approach)
- Deliverables
- Risks and mitigations

### For Plans
- Work packages with task breakdown
- Progress tracking tables
- Success criteria checklist
- Detailed timeline

## Troubleshooting

### Common Issues
- **404 on PDF**: Check latex/en/index.html exists and points to correct PDF filename
- **Wrong theme**: Ensure rebuild.sh runs blue.sh after HTML build
- **Missing translations**: Run sphinx-intl update after gettext
- **ELOOPS error**: Remove circular symlinks in latest/ folder
- **PDF not generating**: Install latexmk (`sudo apt-get install latexmk texlive-latex-extra`)

## Reference
This skill based on successful creation of:
- InfraSync Mandate (`mandate_infrasync`)
- InfraSync Brief (`brief_infrasync`)
- InfraSync Plan (`plan_infrasync`)
