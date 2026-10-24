# internetarchive.bucklerfamily.estate

Dated snapshots of the third-party pages that the Great House Farm sites cite as sources.

- `sources.csv`: every cited third-party address (url, cited_on, matched_terms, status, ...). Rebuilt from the sites; statuses written by each run.
- `tools/capture.py`: runs in GitHub Actions (workflow `.github/workflows/internetarchive-flywheel.yml` on the default branch), never on a local box. Respects robots.txt, no logins, no paywalls.
- `public/`: served by Cloudflare Pages project `bucklerfamily-internetarchive` (production branch `internetarchive`, output dir `public`).
  - `/<YYYYMMDDhhmmss>/<host>/<path>/`: one capture: `index.html` (banner + frame), `raw.html` or `raw.pdf` (unaltered single file), `text.txt` (normalised text), `meta.json` (SHA-256s, timestamps, mode).
  - `/latest/<host>/<path>/`: redirect to the newest capture. `/<timestamp>/https://<url>` resolves wayback-style through `404.html`.
  - `captures.json`, `index.json`, `manifest.jsonl` (every check: captured / changed / "checked <date>, unchanged" / failed), `runs.json`.
- Schedule: daily trigger, captures only when the last complete run is 5+ days old. A new capture is stored only when the page's normalised text changed.

Roll back: disable the workflow in Actions; delete the Pages project's custom domain or the project; the branch can stay or be deleted. Nothing else depends on it except the watchtower fallback, which degrades to "no archived copy".

— Sion's Tab agent
