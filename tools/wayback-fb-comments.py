#!/usr/bin/env python3
"""Mirror the public comments of fb.bucklerfamily.estate (the family archive's own comment store at
comments.bucklerfamily.estate, built 20 Oct 2026) plus the comments preserved from Facebook into one
text file on the Wayback archive's Text tab, and register it in text/_treeview.json.
Regenerate, never hand-edit:  python3 tools/wayback-fb-comments.py path/to/wayback
Reads: https://fb.bucklerfamily.estate/ (post ids), https://fb.bucklerfamily.estate/facebook.html (same),
       https://comments.bucklerfamily.estate/api/comments?post=<id> (published comments only).
Writes: text/facebook/comments-mirror - fb.bucklerfamily.estate - EN - V1.0.0.00.txt (dated by run)."""
import json, os, re, sys, time, urllib.request
root = sys.argv[1] if len(sys.argv) > 1 else "wayback"
API = "https://comments.bucklerfamily.estate/api/comments?post="
def get(u):
    req = urllib.request.Request(u, headers={"User-Agent": "wayback-fb-comments/1.0 (bucklerfamily.estate)"})
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")
ids = []
for page in ("https://fb.bucklerfamily.estate/", "https://fb.bucklerfamily.estate/facebook.html"):
    try:
        for m in re.finditer(r'<article class="post" id="([^"]+)"', get(page)):
            if m.group(1) not in ids: ids.append(m.group(1))
    except Exception as e:
        print("skip", page, e)
today = time.strftime("%Y-%m-%d")
lines = ["COMMENTS MIRROR — fb.bucklerfamily.estate — read %s" % today,
         "Public comments left on the family archive site (comments.bucklerfamily.estate; published comments only, names as given there, no emails or IPs are stored).",
         "Comments preserved from Facebook are listed per thread in the other text/facebook/ files.", ""]
total = 0
for pid in ids:
    try:
        d = json.loads(get(API + pid))
    except Exception as e:
        lines.append("- %s: not read (%s)" % (pid, e)); continue
    cs = d.get("comments") or []
    if not cs: continue
    lines.append("## %s — https://fb.bucklerfamily.estate/#%s (%d)" % (pid, pid, len(cs)))
    def walk(items, depth=0):
        global total
        for c in items:
            total += 1
            name = c.get("name") or "Guest"
            when = c.get("time") or c.get("created") or c.get("date") or ""
            lines.append("%s- %s (%s)%s: %s" % ("  " * depth, name, when, " [AI agent]" if c.get("agent") else "", (c.get("text") or "").replace("\n", " / ")))
            walk(c.get("replies") or [], depth + 1)
    walk(cs); lines.append("")
    time.sleep(0.3)
if total == 0: lines.append("No public comments on the site yet.")
lines += ["", "Posted by you and want it removed? Email sales@bucklerfamily.estate.", "", "— Sion's Tab agent"]
os.makedirs(os.path.join(root, "text", "facebook"), exist_ok=True)
fn = "comments-mirror - fb.bucklerfamily.estate - EN - V1.0.0.00.txt"
with open(os.path.join(root, "text", "facebook", fn), "w") as f: f.write("\n".join(lines) + "\n")
tv_path = os.path.join(root, "text", "_treeview.json")
tv = json.load(open(tv_path))
tv = [e for e in tv if e.get("path") != "text/facebook/" + fn]
tv.append({"name": "comments-mirror_fb-bucklerfamily-estate_en_v1.0.0.00", "path": "text/facebook/" + fn,
           "_links": {"html": "text/facebook/" + fn}, "tags": ["facebook", "comments", "ghf", "family", "living-memory"]})
json.dump(tv, open(tv_path, "w"), indent=2, ensure_ascii=False)
print("mirrored %d comments on %d posts -> text/facebook/%s" % (total, len(ids), fn))
