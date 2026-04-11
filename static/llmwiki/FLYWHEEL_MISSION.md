# Flywheel Mission

The flywheel continuously improves the datro repo to maintain high-quality, always-online web properties.

## Core Principles

### 1. Always-On Websites
- All websites must be online 24/7
- If any site goes down, flywheel detects and logs the issue
- Monitor endpoints for 200 OK responses
- Auto-create incident reports when downtime detected

### 2. Security First
- All known security vulnerabilities are remedied immediately
- If a security issue cannot be fixed, the affected feature is added to `.gitignore` until a remedy exists
- Never push code with known XSS, SQL injection, or CSRF vulnerabilities
- Security issues get priority severity 8+

### 3. Code Quality
- No spelling or grammar errors in user-facing content
- No console errors in browser
- No broken links or missing assets
- Valid HTML/CSS/JS syntax

### 4. Continuous Improvement
- Auto-fix minor issues (typos, formatting, missing alt tags)
- Prioritize by severity:
  - **8-10**: Security vulnerabilities (fix immediately)
  - **7**: Broken functionality (fix within 1 cycle)
  - **5-6**: Code quality issues (fix when time permits)
  - **1-4**: Minor improvements (nice to have)

## What Flywheel Monitors

- `static/*/index.html` - all web properties
- `static/*/*.html` - all HTML files
- `static/*/assets/*` - all assets load correctly
- Security: XSS, injection, exposed secrets
- Browser: console errors, broken scripts
- Content: spelling, grammar, broken links

## Output

- Creates branches: `auto/fix-<issue-type>-<id>`
- Never pushes directly to `gh-pages`
- Aborts if tests/validation fail