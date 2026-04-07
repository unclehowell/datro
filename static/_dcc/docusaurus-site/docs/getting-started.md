# Getting Started

This section guides you through setting up and running the Debt Cancellation Circle (DCC) project.

## Prerequisites

*   Node.js and npm (or yarn) installed.
*   Git for cloning the repository.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```
    *(Replace `<repository-url>` and `<project-directory>` with the actual URL and directory name.)*

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

## Running the Development Server

To run the application in development mode with hot-reloading:

```bash
npm run dev
# or
yarn dev
```

This will start a local development server, typically accessible at `http://localhost:5173` (or a similar port, as configured by Vite). You can then open your browser and navigate to `index.html` or `wallet_ledger.html`.

## Building for Production

To create a production-ready build:

```bash
npm run build
# or
yarn build
```

This command will compile and bundle your application into the `dist/` directory, optimized for deployment.

## Deployment

Static files (HTML, CSS, JS) in the `dist/` directory can be deployed to any static file hosting service (e.g., GitHub Pages, Netlify, Vercel, or a simple web server).
