# Project Mandate: AWS Login Gate & App Routing

## Date: 2026-04-04
## Project: Fix 404 Errors & Implement Login Gate System

---

## ⚠️ HONEST ASSESSMENT - What Actually Failed

### What We've Tried (and Failed)

| Attempt | What Happened | Why It Failed |
|---------|---------------|---------------|
| Initial login gate setup | SSL cert permissions denied | nginx couldn't read SSL certs |
| Fix SSL permissions | SSL fixed, nginx restarted | Config still incomplete |
| Test after auth | Worked briefly with curl | Only worked with curl, not browser |
| Reboot server | Everything broke | Paperclip didn't auto-start |
| Manual Paperclip start | It started | But nginx still broken |
| Test again | Still 404s | nginx config was never properly applied |

### Current Reality

1. **User sees 404 everywhere** - No login page, no apps work
2. **nginx may not be running properly** - Config test keeps failing  
3. **Paperclip died on reboot** - No auto-start mechanism
4. **We never actually applied a working nginx config** - We saw broken configs but never deployed a complete one

### Key Gaps in Previous Approach

1. **No service persistence** - Nothing survives reboot
2. **No health checks** - We don't know if services are actually running
3. **Incremental fixes** - We kept patching instead of replacing with complete config
4. **No verification** - We tested with curl but not in real browser flow
5. **Ignored the reboot problem** - We knew Paperclip was manual but didn't fix it

---

## 1. MANDATE (What the User Wants)

### User Requirements
1. **URL Access Rules:**
   - ALL URLs except `/datro/static/gui/*` should show login page
   - `/datro/static/gui/*` serves without authentication
   - Passphrase: `cercacito`

2. **Login User Experience:**
   - Client-side URL memory: Remember the page user was trying to reach BEFORE login appears
   - Post-login redirect: After authenticating, go to the originally requested page
   - Persistent session: Login remembered across different apps - only need to login once

3. **Dashboard App Icons:**
   - Second app icon in dashboard/003.html is different size to all others (visual bug)
   - Clicking app icons (paperclip, links, etc.) produces 404 errors

4. **Server Details:**
   - URL: https://command.financecheque.uk
   - AWS IP: 13.135.142.244
   - SSH: ubuntu with key paperclip-hermes-nvidia-key.pem

5. **Hermes Profiles:**
   - 4 profiles (default, nvidia, unclehowell, microwave) should run as background services
   - Interface via Paperclip webgui or Telegram only

6. **CRITICAL: Service Persistence**
   - All services must survive reboot
   - nginx must auto-start
   - Paperclip must auto-start
   - Hermes gateway profiles must auto-start

---

## 2. BRIEF/PROPOSAL (What We Propose)

### Root Cause Analysis

| Issue | Root Cause | Solution |
|-------|------------|-----------|
| 404 on everything | nginx config broken/incomplete | Replace with complete working config |
| No login page | nginx not serving login.html | Add proper location block |
| No persistence | Services don't auto-start | Create systemd services or startup scripts |
| Paperclip dead | Not in startup scripts | Add to rc.local or systemd |

### Revised Architecture

```
                                    ┌─────────────────┐
                                    │  Cloudflare     │
                                    │  (SSL)          │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │  Nginx (AWS)    │
                                    │  Auto-started   │
                                    └────────┬────────┘
                                             │
    ┌───────────────────────────────────────┼───────────────────────────────────────┐
    │                                       │                                       │
    ▼                                       ▼                                       ▼
┌─────────────────────┐          ┌─────────────────────┐          ┌─────────────────────┐
│ /datro/static/gui/*  │          │ /login.html         │          │ All other URLs      │
│ NO AUTH             │          │ NO AUTH             │          │ AUTH CHECK          │
└─────────────────────┘          └─────────────────────┘          └──────────┬────────────┘
                                                                           │
                        ┌─────────────────────┐                          │
                        │ /auth               │                          ▼
                        │ Sets cookie         │          ┌─────────────────────────────┐
                        └─────────────────────┘          │ Has cookie?                 │
                                                           │   │                         │
                                                          Yes   No                        │
                                                           │    │                         │
                                                           ▼    ▼                         │
                                                    Serve    Redirect to               │
                                                    content /login.html?next=URL       │
                                                                                         │
                                                                                         ▼
                                                        ┌─────────────────────────────┐
                                                        │ /paperclip/  → :3100       │
                                                        │ /links/     → static       │
                                                        │ /gui/       → static       │
                                                        └─────────────────────────────┘
```

### Service Startup Order

```
1. Server boots
2. cloudflared starts (Tunnel)
3. nginx starts (Port 80/443)
4. Paperclip starts (Port 3100) ← CRITICAL - must be running BEFORE nginx proxies
5. Hermes profiles start (background services)
```

---

## 3. PLAN (Implementation Steps)

### ⚠️ NEW APPROACH: Complete Replacement, Not Patching

Instead of patching the broken config, we'll:
1. Backup current config
2. Write completely new config
3. Test thoroughly
4. Set up auto-start

### Stage 1: Diagnose ACTUAL Current State

| ID | Task | Owner | Status |
|----|------|-------|--------|
| 1.1 | SSH to AWS and check nginx status | @agent | ⚪ |
| 1.2 | Check if nginx config test passes | @agent | ⚪ |
| 1.3 | Check if Paperclip is running | @agent | ⚪ |
| 1.4 | Test URL from outside (curl) | @agent | ⚪ |

### Stage 2: Create Complete Nginx Config

| ID | Task | Owner | Status |
|----|------|-------|--------|
| 2.1 | Backup current nginx config | @agent | ⚪ |
| 2.2 | Write COMPLETE new nginx config | @agent | ⚪ |
| 2.3 | Fix SSL permissions | @agent | ⚪ |
| 2.4 | Test nginx config | @agent | ⚪ |
| 2.5 | Restart nginx | @agent | ⚪ |

### Stage 3: Fix Login Page Logic

| ID | Task | Owner | Status |
|----|------|-------|--------|
| 3.1 | Check current login.html | @agent | ⚪ |
| 3.2 | Add localStorage URL save logic | @agent | ⚪ |
| 3.3 | Add post-login redirect logic | @agent | ⚪ |
| 3.4 | Deploy updated login.html | @agent | ⚪ |

### Stage 4: Ensure Service Persistence

| ID | Task | Owner | Status |
|----|------|-------|--------|
| 4.1 | Create Paperclip startup script | @agent | ⚪ |
| 4.2 | Add to systemd or rc.local | @agent | ⚪ |
| 4.3 | Create nginx startup (if not exists) | @agent | ⚪ |
| 4.4 | Reboot and verify all services start | @agent | ⚪ |

### Stage 5: Fix Dashboard App Icons

| ID | Task | Owner | Status |
|----|------|-------|--------|
| 5.1 | Find and examine dashboard/003.html | @agent | ⚪ |
| 5.2 | Fix app link URLs | @agent | ⚪ |
| 5.3 | Fix icon size CSS | @agent | ⚪ |
| 5.4 | Deploy updated dashboard | @agent | ⚪ |

### Stage 6: Full Verification

| ID | Task | Owner | Status |
|----|------|-------|--------|
| 6.1 | Test from fresh browser (incognito) | @agent | ⚪ |
| 6.2 | Test /paperclip/ shows login | @agent | ⚪ |
| 6.3 | Test login redirects to /paperclip/ | @agent | ⚪ |
| 6.4 | Test /links/ works after login | @agent | ⚪ |
| 6.5 | Test /datro/static/gui/ works without login | @agent | ⚪ |
| 6.6 | Reboot and verify persistence | @agent | ⚪ |

---

## 4. APPROVAL

| Role | Name | Date | Signature |
|------|------|------|-----------|
| User | @unclehowell | - | Pending |
| Agent | @agent | 2026-04-04 | To be signed |

---

## 5. RISKS & MITIGATION

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| nginx config still broken after new config | Medium | High | Test thoroughly before restarting |
| Paperclip won't start after reboot | High | High | Create robust startup script |
| Services start in wrong order | Medium | High | Add startup delays or dependencies |
| User still sees 404 | High | High | Extensive browser testing |
