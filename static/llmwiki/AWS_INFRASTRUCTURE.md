# AWS Command Server Infrastructure

## Server Details
- **Hostname**: command.financecheque.uk
- **IP**: 13.135.142.244
- **User**: ubuntu
- **SSH Key**: ~/.ssh/paperclip-hermes-nvidia-key.pem

## Directories
- **Web Root**: /var/www/datro (served by nginx)
- **Working Dir**: ~/datro (scripts)
- **Datro Clone**: ~/datro-clone

## fcuk-sync Script
- **Path**: ~/datro/scripts/fcuk-sync.sh
- **Cron**: */5 * * * * (every 5 minutes)
- **Target Repo**: unclehowell/FCUK
- **Destination**: unclehowell/datro static/fcuk
- **Branch**: Pushes directly to gh-pages (NOT new branch)

## Key Lesson
- Cloudflare monitors gh-pages branch
- Script must push to gh-pages directly, NOT create new branches
- Previous error: creating new branch each time broke deployment

## Log Files
- /var/log/fcuk-sync.log
- /tmp/fcuk-sync.log
