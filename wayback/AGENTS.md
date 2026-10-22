---
semantic_version_preference:
  format: vX.X.X.XX
  rule: "last two digits (XX) = (release_count % 100), zero-padded; third segment (X) = floor(release_count / 100)"
  calculate: "release_count = (existing_tags + 1); third = floor(release_count / 100); last_two = release_count % 100, zero-padded to 2 digits"
  example: "9th release → v0.0.0.09, 10th → v0.0.0.10, 555th → v0.0.5.55"
  example2: "Release count = `git tag | grep wayback | wc -l` (number of wayback tags). Next release = count + 1."
  note: "NO major.minor.patch semantics. Only the third segment and last two digits encode the release count."
---

# AGENTS.md — Wayback Archive

## Semantic Versioning Policy
- Format: `vX.X.X.XX`
- Release count = `git tag | grep wayback | wc -l` + 1 for current
- Third segment (X) = floor(release_count / 100)
- Last two digits (XX) = release_count % 100, zero-padded to 2 digits
- Example: release 9 → v0.0.0.09, release 104 → v0.0.1.04, release 555 → v0.0.5.55
- No major.minor.patch semantics — pure release counter

## Email reader text corpus
- `email/text-corpus.json` and its shards `email/text-corpus-N.json` are a derived read cache of the `/text/` files that `email/mail-index.json` points at. The `/text/` files stay the master.
- The email reader (email.bucklerfamily.estate) uses the cache for search, export and threads, because one fetch per file broke Cloudflare's 50-subrequest limit. `/api/message` always reads the file live.
- After editing, redacting, adding or renaming any `/text/` file or mail-index record, rebuild it: `python3 tools/build-email-text-corpus.py OUT_DIR`, then commit OUT_DIR/* to `wayback/email/`. Entries whose sourcePath no longer matches the index are ignored automatically.
