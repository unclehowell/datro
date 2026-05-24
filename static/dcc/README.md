# DCC Tech App

DCC Tech App is a local-first web application for managing contact-based debt balances in GBP and spotting cancellable debt circles.

## Core features

- Contact ledger with per-person fields:
  - `name`
  - `email`
  - `theyOweMeGbp`
  - `iOweThemGbp`
- Client-side persistence with browser `localStorage` (`dcc-circle-cache-v1`).
- Base64 export of the full dataset for sharing.
- Base64 import to restore/sync datasets.
- 3-party cycle detection (`me -> A -> B -> me`) with maximum cancellable amount calculation.

## Technical architecture

- **Frontend:** React + TypeScript
- **Build tool:** Vite
- **State model:** In-memory React state (`rows`, `form`, `importText`) with persistence sync hooks.
- **Storage:** Browser `localStorage` only (no server dependency).
- **Encoding strategy:** UTF-8 JSON serialized and encoded/decoded via Base64 for portability.

## Key logic areas

- **Normalization and validation**
  - Monetary values are normalized to non-negative, 2-decimal values.
  - Email values are lowercased before storage.
- **Import pipeline**
  - Base64 decode -> UTF-8 decode -> JSON parse -> array validation -> ID repair.
- **Cycle detection**
  - Builds directed debt edges and searches 3-hop cycles that return to `me`.
  - Cancellable amount is `min(edge1, edge2, edge3)`.

## Local development

From repository root:

```bash
cd static/dcc
npm install
npm run dev
```

## Production build

```bash
cd static/dcc
npm run build
```

## Deployment notes

- App is static and can be served by any static host.
- Because data is local-first, user data portability relies on export/import strings.
