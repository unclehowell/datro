# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AdminLTE is a Bootstrap 5 admin dashboard template (v4.0.0-rc5). It provides responsive UI components for building admin panels and control dashboards.

## Build Commands

```bash
npm install          # Install dependencies
npm start            # Start dev server with file watching (http://localhost:3000)
npm run build        # Build all assets (CSS, JS, docs)
npm run production   # Full production build with linting and bundlewatch
npm run lint         # Run all linters (JS, CSS, docs, lockfile)
```

### Individual Build Tasks

```bash
npm run css          # Build CSS only (compile, prefix, rtl, minify)
npm run js           # Build JavaScript only (compile, minify)
npm run css-lint     # Lint SCSS files
npm run js-lint      # Lint TypeScript/JavaScript files
```

## Architecture

### Source Structure

- **src/ts/** - TypeScript source files compiled via Rollup to `dist/js/adminlte.js`
- **src/scss/** - SCSS source files compiled via Sass to `dist/css/adminlte.css`
- **src/html/** - Astro-based documentation/demo pages
- **src/config/** - Build tool configurations (rollup, postcss, astro, assets)
- **src/assets/** - Static images copied to dist

### JavaScript Components (src/ts/)

Entry point: `adminlte.ts` exports all components:
- `Layout` - Core layout management and hold-transition behavior
- `PushMenu` - Sidebar toggle functionality
- `Treeview` - Hierarchical menu navigation
- `CardWidget` - Card collapse/expand/remove actions
- `DirectChat` - Chat widget toggle
- `FullScreen` - Fullscreen toggle functionality
- `initAccessibility` - WCAG 2.1 AA accessibility features

### SCSS Structure (src/scss/)

Entry point: `adminlte.scss` imports Bootstrap then AdminLTE components:
- `_bootstrap-variables.scss` - Bootstrap variable overrides
- `_variables.scss` / `_variables-dark.scss` - AdminLTE theme variables
- `parts/` - Organized component groups (core, components, extra-components, pages, miscellaneous)
- Individual component files (`_cards.scss`, `_app-sidebar.scss`, etc.)

### Documentation (src/html/)

Built with Astro framework:
- `pages/` - Demo pages and documentation
- `components/` - Reusable Astro components and MDX content
- Output goes to `dist/html/` then flattened to `dist/`

### Build Output (dist/)

Production assets:
- `dist/js/adminlte.min.js` - Compiled and minified JavaScript (UMD format)
- `dist/css/adminlte.min.css` - Compiled and minified CSS
- `dist/css/*.rtl.css` - RTL (right-to-left) variants
- `dist/assets/` - Static assets

## Key Technologies

- Bootstrap 5.3.x - CSS framework base
- TypeScript - JavaScript source language
- Sass - CSS preprocessor
- Rollup - JavaScript bundler
- Astro - Documentation site generator
- PostCSS with Autoprefixer and RTLCSS - CSS post-processing
