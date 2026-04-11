# FCUK / Datro Web UI Architecture & Design Notes

## Project Status: LOCAL SOURCE
- As of 2026-04-10, this server is the primary source of truth for the FCUK/Datro project.
- GitHub repository synchronization (unclehowell/FCUK) is paused to allow local development.

## Implementation Requirements (Design Notes)

### 1. Logo & Responsive Layout
- **Logo:** https://files.catbox.moe/gzq615.png
- **Mobile CSS:** 
  - Shrink `h1`/`h2` on mobile (`max-width: 600px`).
  - Use a burger menu (3 light grey spans) instead of the text box.
  - Fix agent layout: 3 columns (desktop) -> 3 rows (vertical mobile). Agent/phone needs to be above the 'Select an agent' text in mobile.

### 2. Marketing Auth & Wallet System
- **Connect Flow:** Instead of standard OAuth, show a choice of 3rd party marketing/social sites (Gmail, FB, Insta, X, etc.) with random coin values (1-5 FCUK coins).
- **Authorise Modal:**
  - Mock OAuth page (for illustration).
  - Pre-filled/stared-out fields (`user@example.com`, `********`).
  - Fields must be **disabled** (non-editable).
  - Action button: 'Authorise'.
- **Jingle & Spawn:**
  - `handleAuthorise`: Play `/sounds/money-jingle.mp3`.
  - Update wallet balance: `setWallet(prev + service.coin)`.
  - Show 'Spawn' button upon authorization.
