# Architecture

## High-Level Structure

The Debt Cancellation Circle (DCC) project is structured as a collection of static HTML, CSS, and JavaScript files, designed to be served by a simple web server or directly from the filesystem. While the project setup (`package.json`, `vite.config.ts`) suggests a modern frontend build pipeline (like Vite with React), the current implementation consists of standalone HTML pages.

## Directory Structure (relevant to DCC project)

```
/home/unclehowell/datro/static/_dcc/
├── App.tsx             # (Potentially part of a React setup, not directly used in current HTML)
├── index.html          # Main landing page
├── index.tsx           # (Potentially part of a React setup)
├── metadata.json       # (Metadata file)
├── package.json        # Project dependencies and scripts
├── README.md           # Project README
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite build tool configuration
├── wrangler.toml       # (Cloudflare Workers configuration, not actively used here)
├── components/         # (Potentially for React components)
│   ├── ...
├── dist/               # Production build output
├── node_modules/       # Project dependencies
├── services/           # (Potentially for backend/API services)
│   └── exchangeRateService.ts
├── utils/              # (Utility functions)
│   ├── crypto.ts
│   └── storage.ts
└── docs/               # Documentation files (Markdown/MDX)
    ├── index.md
    ├── getting-started.md
    ├── usage.md
    ├── architecture.md
    ├── api.md
    └── contributing.md
```

## Data Flow

1.  **User Interaction:** The user interacts with HTML forms on `index.html` or `wallet_ledger.html`.
2.  **Client-Side Scripting:** JavaScript within `wallet_ledger.html` captures user input.
3.  **Data Structuring & Encoding:** The JavaScript constructs data objects (IoU/UoMe) and encodes them using Base64.
4.  **Email Generation:** A `mailto:` URL is generated, which, when clicked, opens the user's default email client.
5.  **External Confirmation (Conceptual):** The `mailto:` link includes BCC to `dcc@datro.xyz` and a base64 encoded payload. The recipient is expected to use this data, potentially in a similar web application, to confirm or reject the transaction. Confirmation responses would ideally be sent back to a specified email address.
6.  **Ledger Update (Conceptual):** In a full implementation, accepted/rejected confirmations would update the client-side ledger (e.g., using `localStorage`).

## Main Components

*   **`index.html`**: The entry point. Provides navigation to other sections.
*   **`wallet_ledger.html`**: The core functional page. Contains forms for IoU and UoMe generation. It includes client-side JavaScript logic for data handling and `mailto:` link creation.
*   **`/docs/` directory**: Contains Markdown files (`.md`) intended for Docusaurus, documenting the project.
*   **`package.json` / `vite.config.ts`**: Indicate the project's setup for a modern frontend development workflow, even if the current output is static HTML.
