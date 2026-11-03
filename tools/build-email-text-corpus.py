#!/usr/bin/env python3
"""Build wayback/email/text-corpus*.json: one bundle of the legacy /text/ files that email/mail-index.json points at.

Why: the email reader Worker (email.bucklerfamily.estate) runs under Cloudflare's 50-subrequest limit per request.
Reading one /text/ file per legacy record made its search and export fail on 538 of 1,431 records ("Too many
subrequests"). The Worker now reads these shards for search/export/thread; /api/message still reads each file live.

The bundle is derived, never a master: every text is the exact bytes Wayback serves at the record's path
(R2 bucket wayback-media, or the static file under wayback/text/), decoded as UTF-8. Each entry carries the
sourcePath it was read from; the Worker ignores an entry whose sourcePath no longer matches the catalogue.

REBUILD THIS after editing, redacting, adding or renaming any /text/ file or mail-index.json record:
    python3 tools/build-email-text-corpus.py OUT_DIR [LOCAL_MAIL_INDEX]   # then commit OUT_DIR/* to wayback/email/
Standard library only. — Sion's Tab agent, 22 Oct 2026
"""
import concurrent.futures as cf, datetime, hashlib, json, os, sys, time, urllib.error, urllib.request
HOST = "https://wayback.bucklerfamily.estate"
SHARD_BYTES = 450_000

def get(url):
    sep = "&" if "?" in url else "?"
    for attempt in range(4):
        try:
            req = urllib.request.Request(f"{url}{sep}n={time.time_ns()}", headers={"User-Agent": "ghf-text-corpus"})
            with urllib.request.urlopen(req, timeout=40) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as e:
            if e.code == 404: return 404, None
            time.sleep(2 * (attempt + 1))
        except Exception:
            time.sleep(2 * (attempt + 1))
    return None, None

def looks_like_html(text):
    head = text[:4096].lstrip().lower()
    return head.startswith("<!doctype html") or head.startswith("<html") or "<title>datro wayback archive</title>" in head

def main(out_dir, catalogue=None):
    if catalogue:  # a local copy of email/mail-index.json about to be committed with the corpus
        raw = open(catalogue, "rb").read()
    else:
        st, raw = get(HOST + "/email/mail-index.json")
        if st != 200: sys.exit(f"catalogue returned {st}")
    records = [r for r in json.loads(raw)["records"] if isinstance(r.get("id"), str) and isinstance(r.get("path"), str)]
    def one(r):
        st, b = get(r["path"])
        return r, st, b
    with cf.ThreadPoolExecutor(12) as ex: results = list(ex.map(one, records))
    failed = [r["id"] for r, st, b in results if st not in (200, 404)]
    if failed: sys.exit(f"{len(failed)} files could not be read (network); not writing a partial corpus: {failed[:5]}")
    entries = []
    for r, st, b in results:
        sp = r.get("sourcePath")
        if st == 200:
            text = b.decode("utf-8", "replace")
            if text.startswith("\ufeff"): text = text[1:]
            if looks_like_html(text): entries.append((r["id"], sp, None, None))
            else: entries.append((r["id"], sp, text, hashlib.sha256(b).hexdigest()))
        else:
            entries.append((r["id"], sp, None, None))
    shards, cur, size = [], {"texts": {}, "paths": {}, "sha256": {}, "missing": {}}, 0
    for rid, sp, text, sha in entries:
        cur["paths"][rid] = sp
        if text is None: cur["missing"][rid] = sp
        else: cur["texts"][rid] = text; cur["sha256"][rid] = sha; size += len(text.encode())
        if size >= SHARD_BYTES: shards.append(cur); cur, size = {"texts": {}, "paths": {}, "sha256": {}, "missing": {}}, 0
    if cur["paths"]: shards.append(cur)
    os.makedirs(out_dir, exist_ok=True)
    names = []
    for n, s in enumerate(shards, 1):
        name = f"text-corpus-{n}.json"; names.append("/email/" + name)
        with open(os.path.join(out_dir, name), "w", encoding="utf-8") as f: json.dump(s, f, ensure_ascii=False, separators=(",", ":"))
    index = {
        "title": "Great House Farm / Ty Mawr legacy text corpus (derived from Wayback /text/)",
        "generated": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "catalogue": "/email/mail-index.json",
        "derivedFrom": "The exact files Wayback serves at each catalogue record's path. Wayback's /text/ files remain the master; this bundle is a read cache for bulk search and export.",
        "rebuild": "tools/build-email-text-corpus.py (repo root) after any change to a /text/ file or to email/mail-index.json",
        "count": len(entries),
        "textCount": sum(1 for e in entries if e[2] is not None),
        "missingCount": sum(1 for e in entries if e[2] is None),
        "shards": names,
    }
    with open(os.path.join(out_dir, "text-corpus.json"), "w", encoding="utf-8") as f: json.dump(index, f, ensure_ascii=False, indent=1)
    print(json.dumps({k: index[k] for k in ("count", "textCount", "missingCount", "shards")}))

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "text-corpus-out", sys.argv[2] if len(sys.argv) > 2 else None)
