# CLI Reference Index

This directory contains documentation for all CLI tools and integrations.

## Quick Reference

| Service | Secrets Location | Documentation |
|---------|-----------------|---------------|
| AWS | `~/.aws/credentials` | [aws.md](aws.md) |
| GitHub | `~/.env` or create at github.com | [github.md](github.md) |
| Cloudflare | `~/.cloudflared/` | [cloudflare.md](cloudflare.md) |
| Short.io | `~/short.io` | [shortio.md](shortio.md) |
| Hermes | `/opt/hermes/config/` (on AWS) | [hermes.md](hermes.md) |
| Voice | faster-whisper (local) | [voice-opencode.md](voice-opencode.md) |

## SSH Keys

All SSH keys are stored locally in `~/.ssh/`:
- `paperclip-hermes-nvidia-key.pem` - Main AWS server key
- `london-key.pem` - Legacy AWS key
- `github_key` - Generated for GitHub integration (on AWS)
- `aws-recovery-key` - Recovery key on desktop

## How Agents Should Use This

**At startup, agents should read:**
1. `${BRAIN_ROOT}/docs/cli/README.md` - This file
2. `${BRAIN_ROOT}/docs/cli/aws.md` - For AWS CLI usage
3. `${BRAIN_ROOT}/docs/cli/github.md` - For GitHub CLI usage

**For secrets, agents look in:**
- `~/.aws/credentials` - AWS access keys
- `~/.ssh/` - SSH private keys
- `~/.cloudflared/` - Cloudflare tunnel credentials
- `~/short.io` - Short.io API key
- On AWS server: `/opt/hermes/config/integrations.json` - OAuth tokens

## Environment Variables

API keys stored in these LOCAL locations (NOT in brain):
- `~/.env` - General API keys
- `~/.aws/credentials` - AWS keys
- `~/short.io` - Short.io key

Brain `.env` only contains non-secret references and paths.

## Common Commands

### AWS
```bash
aws ec2 describe-instances --profile amelia
ssh -i ~/.ssh/paperclip-hermes-nvidia-key.pem ubuntu@13.135.142.244
```

### GitHub
```bash
gh auth login
gh repo clone owner/repo
```

### Cloudflare (on AWS)
```bash
sudo /usr/local/bin/create-subdomain <name>
cloudflared tunnel list
```

### Hermes (on AWS)
```bash
ssh -i ~/.ssh/paperclip-hermes-nvidia-key.pem ubuntu@13.135.142.244
cat /opt/hermes/config/integrations.json
```

### Voice Input
```bash
voice
# Or full path:
/home/unclehowell/bin/voice-oc
```
