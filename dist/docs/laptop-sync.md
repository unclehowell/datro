# FCUK Sync - Laptop Script

Run this bash script on your laptop to sync fcuk: `/home/ubuntu/datro/static/fcuk/scripts/laptop-sync.sh`

## Alternative: Direct Git Commands

If you want to run manually, in the datro repo root:

```bash
# 1. Fetch latest from GitHub
git fetch origin

# 2. Check status
git status static/fcuk/
git log --oneline -1 origin/gh-pages
git log --oneline -1

# 3. If remote ahead → pull
git pull origin gh-pages

# 4. If local changes → commit and push
git add static/fcuk/
git commit -m "Update: describe changes"
git push origin gh-pages

# 5. If both changed → merge first
git pull origin gh-pages
# resolve any conflicts
git add static/fcuk/
git commit -m "Merge: local + remote changes"
git push origin gh-pages
```

## Prompt for opencode to run:

> "Sync the static/fcuk folder with the GitHub repository unclehowell/datro gh-pages branch. First fetch origin and check if there are local changes, remote changes, or both. If both have changes, merge first. Then push to origin. Confirm the result."

## Automated Cron (optional)

Run every 15 mins on laptop:
```cron
*/15 * * * * cd ~/datro && bash static/fcuk/scripts/laptop-sync.sh >> ~/logs/fcuk-sync.log 2>&1
```