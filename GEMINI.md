# Gemini CLI Agent

This document outlines the purpose and functionality of the Gemini CLI Agent within this project.

## Purpose

The Gemini CLI Agent is an AI-powered assistant designed to help with various software engineering tasks directly from the command line. Its primary goals include:

-   **Code Modification:** Safely and efficiently modify code, adhering to existing project conventions.
-   **Feature Implementation:** Assist in adding new features to the codebase.
-   **Bug Fixing:** Identify and resolve bugs.
-   **Code Refactoring:** Improve code structure and maintainability.
-   **Code Explanation:** Provide explanations for existing code.
-   **Project Setup:** Help with setting up new projects or components.
-   **Testing:** Write and execute tests to verify changes.
-   **Documentation:** Generate or update documentation.

## How it Works

The agent interacts with the user through a command-line interface, taking instructions and executing tasks using a suite of internal tools. It prioritizes understanding the project context, adhering to coding standards, and ensuring the safety and quality of its modifications.

## Key Principles

-   **Context Awareness:** The agent analyzes existing code, tests, and configurations to ensure changes are idiomatic and consistent.
-   **Safety First:** Critical commands are explained before execution, and security best practices are always applied.
-   **Proactive Assistance:** The agent aims to fulfill requests thoroughly, including adding necessary tests and performing verifications.
-   **User Control:** The user retains ultimate control, with the ability to approve or cancel tool actions.

## Usage

To interact with the Gemini CLI Agent, simply provide your instructions in natural language. The agent will then propose actions, ask for clarifications, and execute tasks as directed.

For example:
-   "Fix the bug in `src/utils.js` that causes a crash when `user` is null."
-   "Add a new feature to display user profiles in `components/UserProfile.jsx`."
-   "Refactor the `calculatePrice` function in `src/cart.js`."
-   "Explain how the authentication flow works in this project."

## Contributing

If you are contributing to the development of the Gemini CLI Agent itself, please refer to the internal documentation for development guidelines and testing procedures.
