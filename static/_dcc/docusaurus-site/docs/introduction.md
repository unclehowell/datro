# Debt Cancellation Circle (DCC)

## Project Overview

The Debt Cancellation Circle (DCC) is a simplified web application designed to facilitate peer-to-peer debt management. It allows users to generate and track IOUs (I Owe You) and UoMEs (You Owe Me) through a minimalist, 90s-inspired interface. The application focuses on core functionality, utilizing client-side caching and email as the primary mechanism for initiating and confirming transactions.

## Purpose

The primary purpose of DCC is to provide a straightforward way for individuals to formalize and manage debts between them without complex financial infrastructure. It aims to offer a transparent and accessible tool for tracking financial obligations.

## Main Features

*   **IoU Generation:** Create and send IOU requests to recipients.
*   **UoMe Generation:** Create and send UoMe requests (acknowledging a debt owed to you).
*   **Email Integration:** Uses `mailto` links to pre-fill emails with transaction details, facilitating external confirmation.
*   **Client-Side Caching:** Leverages browser storage for persistence of ledger data (conceptually, not fully implemented in the current static HTML).
*   **Minimalist UI:** A retro, command-line-like interface for a unique user experience.

## Tech Stack Summary

*   **Frontend:** Vanilla HTML, CSS, and JavaScript. (Though the project structure suggests a React/Vite setup, the current implementation uses static HTML files).
*   **Build Tool:** Vite (inferred from `vite.config.ts` and `package.json`).
*   **Language:** JavaScript (for client-side logic).
*   **Documentation:** Markdown/MDX, intended for Docusaurus.
