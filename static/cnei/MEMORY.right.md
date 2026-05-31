---
branch: cnei
---

# MEMORY (Right) — CNEI Error & Stability Log

## Issue 1: `createCommit()` returns full commit object, not just SHA
**Symptoms:** `createGitTag()` fails with 422 because `{sha, node_id, ...}` passed instead of bare SHA string.
**Fix:** `const commitSha = (await createCommit(...)).sha` — always extract `.sha`.
**Detected:** Post-release tag creation (no crash — tag error caught gracefully).

## Issue 2: child-proxy.js fails with "require is not defined"
**Symptoms:** `require('http')` throws ReferenceError in ESM context.
**Fix:** Renamed to `child-proxy.mjs` and used `import` syntax. Project has `"type": "module"` in package.json.
**Detected:** On first child proxy run after git clone.

## Issue 3: AWS EC2 kept creating stale releases
**Symptoms:** Two active flywheels racing on same repo.
**Fix:** Both flywheel CF workers (datro + financialcommission) disabled AWS instances; hardcoded they aren't needed so not a problem.
**Detected:** Duplicate releases per cron tick.

## Issue 4: Version parsing returns NaN for "0.0.0.04"
**Symptoms:** `parseInt("0.0.0.04")` returns 0 due to parseInt stopping at first non-digit.
**Fix:** `const parts = tag.split('.'); const num = parseInt(parts[parts.length-1], 10);` — parse only last segment.
**Detected:** Tag creation crash on 4-digit version scheme.

## Issue 5: Tags not found after release creation
**Symptoms:** Next cycle can't find previous tag, creates duplicate.
**Fix:** Fetch tags from `/git/refs/tags` (Git refs API) not `/releases/tags` (doesn't exist). Added 10 retries with 5s delay for tag visibility.
**Detected:** First cnei cycle.

## Issue 6: socket.gethostname() returns "na"
**Symptoms:** Node registered as "na" on financecheque.uk parent proxy dashboard.
**Fix:** Create `~/.fcukproxy/machine.json` with `{name: "UncleHowell-Laptop"}` + `MACHINE_NAME` env var.
**Detected:** First child proxy registration.

## Issue 7: AWS servers unreachable for flywheel purge
**Symptoms:** SSH timeouts to both 44.194.23.52 and 13.135.142.244.
**Status:** BLOCKED — need secondary access method (AWS Console?).
**Impact:** Old flywheels may still run but they can't reach GitHub (key revoked?).
