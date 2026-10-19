#!/usr/bin/env python3
"""
Wayback case-mail attachments: link each archived email to the attachments that came with it.

Reads pdf/foi/manifest.json (one entry per attachment file, with the Gmail message id it came
from) and, for every entry whose message is in the case-mail API (id "gm-<gmail id>"):
  - adds "attachments": [{name, title, url, mime, bytes, sha256, catalogue}] to that record in
    api/index.json and api/message/<id>.json (url is site-relative, e.g. /pdf/foi/<file>);
  - appends an "Attachments" block with the absolute download links to the end of the message
    text (mail/<id>.txt and the "text" field of api/message/<id>.json), so the links travel
    with the text into every reader of the archive.
Idempotent: an existing block is replaced, not repeated. Nothing is deleted.
Afterwards re-run tools/wayback-gmail-ingest.py with an empty list ([]) to refresh
api/index.json ordering, api/threads.json and the corpus shards.
Usage: python3 tools/wayback-attachments.py path/to/wayback
"""
import json, os, sys, mimetypes
HOST = "https://wayback.bucklerfamily.estate"
RULE = "-" * 60
MARK = "\n\n" + RULE + "\nAttachments ("

def block(atts):
    lines = ["%s\nAttachments (%d)" % (RULE, len(atts))]
    for a in atts:
        kb = max(1, round((a.get("bytes") or 0) / 1024))
        lines.append("- %s (%s, %d KB): %s%s" % (a["name"], a["mime"], kb, HOST, a["url"]))
    return "\n\n" + "\n".join(lines)

def strip(text):
    i = text.find(MARK)
    return text if i < 0 else text[:i]

def main(root):
    man = json.load(open(os.path.join(root, "pdf", "foi", "manifest.json")))
    by_msg = {}
    for m in man:
        gid = m.get("gmail_message_id")
        if not gid: continue
        mime = mimetypes.guess_type(m["file"])[0] or "application/octet-stream"
        by_msg.setdefault("gm-" + gid, []).append({
            "name": m.get("original_filename") or m["file"], "title": m.get("title") or "",
            "url": "/pdf/foi/" + m["file"], "mime": mime, "bytes": m.get("size"),
            "sha256": m.get("sha256"), "catalogue": m.get("catalogue") or ""})
    idx_path = os.path.join(root, "api", "index.json")
    idx = json.load(open(idx_path))
    done = []
    for r in idx["records"]:
        atts = by_msg.get(r["id"])
        if not atts: continue
        atts = sorted(atts, key=lambda a: a["url"])
        r["attachments"] = atts
        jp = os.path.join(root, "api", "message", r["id"] + ".json")
        msg = json.load(open(jp))
        msg["attachments"] = atts
        msg["text"] = strip(msg.get("text", "")).rstrip("\n") + block(atts)
        open(jp, "w", encoding="utf-8").write(json.dumps(msg, ensure_ascii=False, indent=1) + "\n")
        tp = os.path.join(root, "mail", r["id"] + ".txt")
        t = open(tp, encoding="utf-8").read()
        open(tp, "w", encoding="utf-8").write(strip(t).rstrip("\n") + block(atts) + "\n")
        done.append(r["id"])
    open(idx_path, "w", encoding="utf-8").write(json.dumps(idx, ensure_ascii=False, indent=1) + "\n")
    missing = sorted(set(by_msg) - set(done))
    print(json.dumps({"records_with_attachments": len(done), "attachment_files": sum(len(by_msg[d]) for d in done),
                      "manifest_messages_not_in_case_mail": missing}))

if __name__ == "__main__":
    main(sys.argv[1])
