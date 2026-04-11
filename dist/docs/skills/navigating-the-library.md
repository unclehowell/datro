# Navigating the DATRO Library

This document outlines the conventions for generating and managing documents within the DATRO Consortium Document Library.

## Directory Structure

The library follows a hierarchical structure of categories and documents.

- **Categories:** Top-level directories represent document categories (e.g., `consortium_contracts`).
- **Documents:** Subdirectories within category directories represent individual documents (e.g., `patents_google`).

### Standard Directory Contents

- **`index.html`:** Every directory and subdirectory, from the library root down to the document level, must contain an `index.html` file. This file serves as the entry point for browsing that level of the hierarchy.
- **`_treeview.json`:**  Alongside `index.html`, each directory should have a `_treeview.json` file, which is used by the document explorer to render the directory tree.
- **`latest/` Directory:** Each document directory must contain a `latest` directory. This directory holds the most recent version of the document's source files, build scripts, and output.

### `latest/` Directory Contents

The `latest/` directory has a specific structure:

- **`source/`:** Contains the raw source files for the document, typically in reStructuredText (`.rst`) format for Sphinx.
- **`build/`:**  Contains the compiled output of the document, such as HTML and PDF versions.
- **`rebuild.sh`:** A shell script responsible for rebuilding the document from the source files.
- **`auto-rebuild.sh`:** A shell script that updates the `rebuild.sh` script and any theme-related files before triggering the rebuild process.
- **`Makefile`:** A Makefile may be present to assist with the build process.

## Naming Conventions

- **Directory Names:** All directory names should be in `snake_case`.
- **Category Directories:** Top-level category directories should follow the naming scheme `subsidiaryID_categoryID` (e.g., `consortium_contracts`).
- **Document Directories:** Document subdirectories should follow the naming scheme `subcategoryID_documentID` (e.g., `patents_google`).

## Exceptions

While the above conventions apply to the majority of the library, some exceptions exist:

- **Single-Document Directories:** Some top-level directories like `neodome`, `testnet`, and `togousb` appear to be single-document repositories and do not follow the category/document structure.
- **Theme Directories:** The `_theme-docs`, `_theme-explorer`, and `_theme-wiki` directories are special directories that contain theme files for the documentation and are not part of the document library itself.
- **Other Top-Level Directories:** Directories such as `coming_soon`, `dao`, and those prefixed with `hotspotbnb_` may have structures that deviate from the standard conventions. When working within these directories, it is important to first study their local structure.

## Building Documents

The DATRO library uses Sphinx to build RST (reStructuredText) files to HTML and PDF. To build a document:

1. Navigate to the document's `latest/` directory
2. Run `./rebuild.sh`
3. The script will:
   - Clean previous builds
   - Convert RST to HTML
   - Convert RST to PDF (requires latexmk and texlive-latex-extra)
   - Apply theme styling
   - Generate multilingual versions (en, es, fr, de)

### Theme

Documents use the standard Sphinx RTD theme with custom blue color modifications applied via `blue.sh` theme script. The theme is automatically applied during the build process.

## Generating New Documents

When generating a new document, please adhere to the following steps:

1.  **Create Directories:** Create the necessary category and document directories, following the naming conventions.
2.  **Add Standard Files:** Add `index.html` and `_treeview.json` files to each new directory.
3.  **Create `latest/` Directory:** Inside the document directory, create a `latest/` directory.
4.  **Populate `latest/`:** Add the `source/`, `build/`, `rebuild.sh`, and `auto-rebuild.sh` files to the `latest/` directory.
5.  **Add Content:** Place the document's source files in the `source/` directory.
6.  **Build:** Run the `rebuild.sh` script to generate the initial build of the document.

## Key Skills

- Use existing documents in `consortium_projects/` as templates
- Always check `mandate_guide` for correct structure reference
- Keep source files in RST format in `source/` directory
- Include `releasenotes.rst` with proper DATRO format
- Use separate RST files for each major section to populate the menu
- Use blue theme (not _theme-docs which is for bulk updates)
