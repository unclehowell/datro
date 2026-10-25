# Hive Automation — release notes

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
