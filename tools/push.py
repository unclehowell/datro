#!/usr/bin/env python3
"""push.py — push the farmbook working copy to datro@fb through the GitHub API (the box has no git credentials).
Usage: python3 tools/push.py "<commit message ending — Sion's Tab agent>"
1) git fetch origin fb; if the branch moved, fast-forward the working copy under the local changes (stash / ff / pop).
2) every path that differs from origin/fb (added, changed, deleted) goes up as tree entries in chunks (≤20 files or ≤350 KB per POST,
   base_tree chained; binary files as blobs first), then one commit and a ref PATCH with force:false. Never force-pushes.
3) on success the local branch is reset to the pushed commit (git fetch + reset --soft keeps the tree as is). — Sion's Tab agent"""
import os, sys, json, base64, subprocess, time
sys.path.insert(0, "/home/user/tab/work/site-flywheels/tools")
from gh import gh
REPO, BRANCH = "unclehowell/datro", "fb"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def git(*a, check=True):
    r = subprocess.run(["timeout", "-k", "5", "120", "git", *a], cwd=ROOT, capture_output=True, text=True)
    if check and r.returncode: raise SystemExit("git %s: %s" % (" ".join(a), r.stderr[-400:]))
    return r.stdout
def main():
    msg = sys.argv[1] if len(sys.argv) > 1 else "farmbook update — Sion's Tab agent"
    if not msg.rstrip().endswith("— Sion's Tab agent"): msg = msg.rstrip() + " — Sion's Tab agent"
    git("fetch", "origin", BRANCH)
    head = git("rev-parse", "HEAD").strip(); remote = git("rev-parse", "origin/" + BRANCH).strip()
    if head != remote:
        if subprocess.run(["git", "merge-base", "--is-ancestor", "HEAD", "origin/" + BRANCH], cwd=ROOT).returncode == 0:
            git("stash", "push", "--include-untracked", "-m", "push.py")
            git("merge", "--ff-only", "origin/" + BRANCH)
            r = subprocess.run(["git", "stash", "pop"], cwd=ROOT, capture_output=True, text=True)
            if r.returncode: raise SystemExit("the branch moved and the local changes conflict with it; rebuild on the new head and push again:\n" + r.stdout[-600:] + r.stderr[-300:])
        else:
            raise SystemExit("local HEAD is not an ancestor of origin/%s; refusing" % BRANCH)
    git("add", "-A")
    changes = [l.split("\t") for l in git("diff", "--cached", "--name-status", "--no-renames", "origin/" + BRANCH).splitlines() if l.strip()]
    if not changes: print("nothing to push"); return
    st, ref = gh("GET", f"/repos/{REPO}/git/ref/heads/{BRANCH}")
    parent = ref["object"]["sha"]
    if parent != git("rev-parse", "origin/" + BRANCH).strip(): raise SystemExit("remote moved during the push; run again")
    st, c = gh("GET", f"/repos/{REPO}/git/commits/{parent}"); tree = c["tree"]["sha"]
    batch, size = [], 0
    def flush(tree, batch):
        for attempt in range(4):
            st, t = gh("POST", f"/repos/{REPO}/git/trees", {"base_tree": tree, "tree": batch})
            if st in (200, 201): return t["sha"]
            time.sleep(5 * (attempt + 1))
        raise SystemExit("tree POST failed: %s %s" % (st, str(t)[:300]))
    for ch in changes:
        code, path = ch[0], ch[-1]
        if code.startswith("D"): item = {"path": path, "mode": "100644", "type": "blob", "sha": None}; n = 100
        else:
            data = open(os.path.join(ROOT, path), "rb").read(); n = len(data)
            try:
                txt = data.decode("utf-8")
                if "\x00" in txt: raise UnicodeDecodeError("utf-8", b"", 0, 1, "nul")
                item = {"path": path, "mode": "100644", "type": "blob", "content": txt}
            except UnicodeDecodeError:
                for attempt in range(4):
                    st, b = gh("POST", f"/repos/{REPO}/git/blobs", {"content": base64.b64encode(data).decode(), "encoding": "base64"})
                    if st in (200, 201): break
                    time.sleep(5 * (attempt + 1))
                else: raise SystemExit("blob failed for %s: %s" % (path, str(b)[:200]))
                item = {"path": path, "mode": "100644", "type": "blob", "sha": b["sha"]}; n = 200
        if batch and (len(batch) >= 20 or size + n > 350_000):
            tree = flush(tree, batch); batch, size = [], 0
        batch.append(item); size += n
    if batch: tree = flush(tree, batch)
    st, cm = gh("POST", f"/repos/{REPO}/git/commits", {"message": msg, "tree": tree, "parents": [parent]})
    if st not in (200, 201): raise SystemExit("commit failed %s %s" % (st, str(cm)[:300]))
    st, u = gh("PATCH", f"/repos/{REPO}/git/refs/heads/{BRANCH}", {"sha": cm["sha"], "force": False})
    if st != 200: raise SystemExit("ref update refused (%s): the branch moved; run again. %s" % (st, str(u)[:200]))
    for i in range(6):
        git("fetch", "origin", BRANCH)
        if git("rev-parse", "origin/" + BRANCH).strip() == cm["sha"]: break
        time.sleep(5)
    git("reset", "--soft", "origin/" + BRANCH)
    print(json.dumps({"pushed": cm["sha"], "parent": parent, "files": len(changes)}))
if __name__ == "__main__":
    main()
