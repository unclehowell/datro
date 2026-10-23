#!/usr/bin/env python3
"""push_fast.py — push the farmbook working copy to datro@fb through the GitHub API by recreating git's own objects:
new blobs uploaded in parallel (only those GitHub does not already have), then each changed directory's tree posted whole
(no base_tree, so GitHub never has to rewrite the big branch tree — the slow step that made large pushes time out),
bottom-up, each sha checked against the local `git write-tree`; one commit; ref PATCH with force:false. Never force-pushes.
Usage: python3 tools/push_fast.py "<message> — Sion's Tab agent"   (23 Oct 2026) — Sion's Tab agent"""
import os, sys, json, base64, subprocess, concurrent.futures as cf
sys.path.insert(0, "/home/user/tab/work/site-flywheels/tools")
from gh import gh
REPO, BRANCH = "unclehowell/datro", "fb"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def git(*a, inp=None):
    r = subprocess.run(["timeout", "-k", "5", "120", "git", *a], cwd=ROOT, capture_output=True, text=inp is None or isinstance(inp, str), input=inp)
    if r.returncode: raise SystemExit("git %s: %s" % (" ".join(a), (r.stderr or "")[-400:]))
    return r.stdout
def main():
    msg = sys.argv[1] if len(sys.argv) > 1 else "farmbook update — Sion's Tab agent"
    if not msg.rstrip().endswith("— Sion's Tab agent"): msg = msg.rstrip() + " — Sion's Tab agent"
    git("fetch", "origin", BRANCH)
    head, remote = git("rev-parse", "HEAD").strip(), git("rev-parse", "origin/" + BRANCH).strip()
    if head != remote: raise SystemExit("the branch moved (origin/%s is %s); rebase the working copy first (tools/push.py does the fast-forward)" % (BRANCH, remote[:7]))
    git("add", "-A"); T = git("write-tree").strip()
    known = set()
    for l in git("ls-tree", "-r", "-t", "origin/" + BRANCH).splitlines():
        known.add(l.split()[2])
    known.add(git("rev-parse", "origin/%s^{tree}" % BRANCH).strip())
    if T in known: print("nothing to push"); return
    blobs, trees = {}, []           # trees in bottom-up order
    def walk(tsha, path):
        ents = []
        for l in git("ls-tree", tsha).splitlines():
            meta, name = l.split("\t", 1); mode, typ, sha = meta.split()
            ents.append({"path": name, "mode": mode, "type": typ, "sha": sha})
            if sha in known: continue
            if typ == "tree": walk(sha, path + name + "/")
            elif typ == "blob": blobs[sha] = path + name
        trees.append((tsha, path, ents))
    walk(T, "")
    print(json.dumps({"new_blobs": len(blobs), "new_trees": len(trees)}), flush=True)
    def up(item):
        sha, path = item
        data = subprocess.run(["git", "cat-file", "blob", sha], cwd=ROOT, capture_output=True).stdout
        for attempt in range(4):
            st, b = gh("POST", f"/repos/{REPO}/git/blobs", {"content": base64.b64encode(data).decode(), "encoding": "base64"})
            if st in (200, 201) and b.get("sha") == sha: return sha
        raise RuntimeError("blob %s (%s) failed: %s %s" % (sha[:7], path, st, str(b)[:200]))
    with cf.ThreadPoolExecutor(6) as ex:
        for i, _ in enumerate(ex.map(up, blobs.items())):
            if i % 50 == 49: print("blobs", i + 1, flush=True)
    for tsha, path, ents in trees:
        for attempt in range(4):
            st, t = gh("POST", f"/repos/{REPO}/git/trees", {"tree": ents})
            if st in (200, 201): break
        if st not in (200, 201) or t.get("sha") != tsha: raise SystemExit("tree %s (%s) failed or differs: %s %s" % (tsha[:7], path or "/", st, str(t)[:200]))
    st, cm = gh("POST", f"/repos/{REPO}/git/commits", {"message": msg, "tree": T, "parents": [head]})
    if st not in (200, 201): raise SystemExit("commit failed %s %s" % (st, str(cm)[:300]))
    st, u = gh("PATCH", f"/repos/{REPO}/git/refs/heads/{BRANCH}", {"sha": cm["sha"], "force": False})
    if st != 200: raise SystemExit("ref update refused (%s): the branch moved; run again. %s" % (st, str(u)[:200]))
    git("fetch", "origin", BRANCH); git("reset", "--soft", "origin/" + BRANCH)
    print(json.dumps({"pushed": cm["sha"], "parent": head, "tree": T}))
if __name__ == "__main__":
    main()
