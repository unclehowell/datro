# GEMINI.md - Workspace Mandates

## Project Overview
This project is a static web application for **PCP (Personal Campaign Portal)** and **Campaign CFC**, built using the **AdminLTE 4** framework. It features a dynamic menu system, a banner generator, and various support tools.

## Foundational Mandates
- **Global CSS:** Every page MUST include the following external stylesheet to ensure visual consistency:
  `https://primary.jwwb.nl/public/x/o/f/temp-wsxrnoswjwurulcytugx/style.css?bust=1768565966`
- **Component Integrity:** Maintain the AdminLTE structure for all UI components. Use `assets/css/adminlte.css` and `assets/js/adminlte.js` as the base.
- **Dynamic Menu:** Navigation is driven by `menu.json`. Any additions to the page structure must be reflected in this file.
- **Vendored Assets:** Use the `vendor/` directory for third-party libraries (Bootstrap Icons, OverlayScrollbars, etc.) to ensure offline/local reliability.

## Engineering Standards
- **HTML:** Use semantic HTML5. Follow the sidebar-layout pattern seen in `index.html`.
- **CSS:** Prefer vanilla CSS for custom styling. Store project-wide styles in `assets/css/theme.css`.
- **JavaScript:** 
  - Modularize logic where possible (e.g., `assets/js/menu-loader.js`).
  - Use `assets/js/app.js` for main initialization.
  - Adhere to the `theme-toggle.js` mechanism for dark/light mode support.

## Core Workflows
- **Research:** Always check `menu.json` before creating new pages.
- **Strategy:** Map UI changes to AdminLTE's existing utility classes before writing custom CSS.
- **Archiving:** When preparing a release, zip the webapp files and store them in the `archive/` directory. The filename must follow semantic versioning (e.g., `v1.0.0.zip`).
- **Execution:** 
  - Use `replace` for surgical updates to existing HTML/JS.
  - Update `menu.json` immediately when adding or removing pages.
- **Validation:** Verify layout responsiveness and theme toggle compatibility after any UI change.

## Project Structure
- `/pages/`: Main application content.
- `/assets/`: Project-specific CSS, JS, and images.
- `/vendor/`: External dependencies.
- `/archive/`: Zipped webapp releases named by semantic version.
- `/miscellaneous/`: Backup files and development templates.
