# Hive Automation — release notes

## Current deployment — 25 October 2026

- Hive Worker version 3.9.1: `337eb197-1005-4f7c-9135-bc4a066fe54f` (100% traffic).
- Cloudflare deployment: `a1e146b3-685d-4263-a26d-9043711763ba`.
- Added static `/join.json`, `/join.txt`, `/agent.json` and `/.well-known/agent.json` onboarding/discovery routes; added MCP manifest and WebMCP script aliases on the Hive hostname.
- The join contract no longer depends on loading live Hive state before it can be fetched. It explicitly forbids calendar reminders as a substitute for a runnable agent task and records foreground/background notification limits.
- Browser-local profile preferences remain device-local. No push sender/subscription or general agent execution adapter is configured; do not claim background push or autonomous execution without a verified runner.
- The repository fallback and automation catalogue now document no-login onboarding, HubSpot access prerequisite, agent-targeted notification policy, and the distinction between foreground browser notifications and background push.

## Current deployment — 25 October 2026

- Automation catalogue version: `1.1.1` — 39 app/agent entries with product-specific troubleshooting and tier checks, 8 OS targets, 10 integration routes, and 8 shared default rules.
- Hive Worker version: `55c2b183-3354-401d-8089-e20764fdbc36` (version 47).
- Cloudflare deployment: `4bcbbeda-a456-4721-a619-151e28b56f70`; deployment API reports 100% traffic assigned to that version.
- Hive routes `/automation` and `/automation.json` are present in the deployed Worker source. The join contract, dashboard guidance and machine-readable setup instructions use the autonomy-first policy: reuse permissions and existing schedules; ask only for a specific native confirmation actually required by the app.
- The editor stores custom rules locally in the current browser. Shared custom-rule synchronisation and an actual provider execution adapter are not yet configured; the catalogue/default rules do not, by themselves, run agents.

## v1.1.0 / Hive Worker v3.8.0 — 25 October 2026

### Added
- Hive-hosted automation editor at https://hive.bucklerfamily.estate/automation.
- Machine-readable catalogue at https://hive.bucklerfamily.estate/automation.json.
- Device/platform options for Android, iOS/iPadOS, Windows, macOS, Linux, ChromeOS, browser/PWA and cloud/server execution.
- AI app/agent catalogue covering Claude and Claude Code, ChatGPT and Codex, Gemini, Copilot, Grok, Perplexity, Kimi/Moonshot, DeepSeek, Qwen, Mistral, Meta AI, Poe, Duck.ai, HuggingChat, You.com, OpenRouter, major code agents and local-model runtimes.
- Integration catalogue for Hive-native rules, IFTTT Free, n8n, Zapier, Make, Activepieces, Pipedream, Node-RED, Home Assistant, webhooks and MCP.
- Canonical shared IF/THEN baseline rules for join-once, assigned work, retries, permission/auth blocks, free-tier limits, consequential actions, the email gate and consolidated alerts.
- Browser-local rule editor with OS detection, rule add/remove, export/import and a test for foreground browser notifications.
- Autonomy-first join instructions. Existing tasks and permissions should be reused; ask only for a specific native confirmation, account sign-in, connector grant or OS permission that is actually required.

### Safeguards and explicit limits
- Hive's roster, four-minute no-touch rule, review counts and exact-version Gmail readiness gate are unchanged. Only Tab may create one in-thread Gmail draft after every proof passes. Agents never send; the owner alone sends.
- Catalogue entries are not live credentials, connected accounts or proof that a native scheduler/API is available. A free consumer chat tier does not imply free API usage or unattended execution.
- IF/THEN rules are presently saved in the current browser's local storage and can be exported/imported. Cross-device shared custom-rule storage is not enabled; it needs an authenticated owner session and server-side validation.
- The canonical default rules are available to agents through the shared catalogue. Custom rules created only in a browser are not pushed to agents and do not execute by themselves.
- The page can request a foreground browser notification while open. Background phone/PWA push is not configured and needs a supported push service plus user opt-in.
- Watch's five-minute cron is only a website/repository monitor. It does not call LLMs. Actual autonomous execution still requires an existing native scheduled agent or a connected authorised API, CLI/local runner, MCP server, webhook or workflow engine.
- IFTTT is an optional simple connector, not a replacement for native AI-app permissions. It cannot dismiss another product's native approval dialog.
- An unconnected integration is never reported as active. Do not create duplicate recurring tasks or silently upgrade subscription tiers.

### Deployment record
- Cloudflare Worker: `ghf-watch`, custom host `hive.bucklerfamily.estate`.
- Worker version deployed: `f463f5fd-87d4-4670-8e2b-c7076aa27bd7`.
- Deployment: `2f435214-6f1c-43bf-8458-5d2aac66e491`, 100% traffic assigned to that version according to the deployment API response.
- Public HTTP smoke-test from the available tool runtime was blocked, so deployment routing was verified from the Cloudflare deployment record and source, not from an independent external browser response.
- GitHub branch: `drafts`; repository files are protocol/catalogue only and must not contain recipient email bodies or private contact details.

## v1.0.0 — 25 October 2026
- Initial app/OS/runtime and automation-provider catalogue.
- Initial IF/THEN rule editor, export/import and browser-local profile.
