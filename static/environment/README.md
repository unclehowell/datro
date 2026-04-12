# Laptop Environment Recovery - Ansible Playbook

This playbook restores your laptop to its previous state after a complete system failure.

## Prerequisites

1. Fresh Ubuntu 25.10 installation
2. Git installed: `sudo apt install git`
3. Ansible installed: `sudo apt install ansible` or `pip install ansible`

## Quick Start

```bash
# 1. Clone this repository (or sparse checkout just this folder)
git clone --depth 1 --filter=blob:none https://github.com/unclehowell/datro.git
cd datro/static/environment

# 2. Install Ansible and dependencies
pip install -r requirements.txt

# 3. Run the playbook
ansible-playbook -i inventory.ini playbook.yml --ask-become-pass
```

## What Gets Restored

### System
- Base development packages (build-essential, git, python3, nodejs, golang, cargo, rustc)
- Docker and containerd
- System utilities and libraries
- Network tools

### Desktop Environment
- Cinnamon Desktop (full)
- Display manager (lightdm)
- Media codecs
- Printer support

### AI/CLI Tools
- OpenClaw (2026.3.23-2)
- PicoClaw
- Hermes AI
- Google Gemini CLI
- OpenAI Codex
- Groq Code CLI
- Ollama
- ZeroClaw (Go)
- Claude CLI

### Package Managers
- All APT packages (~2500)
- NPM global packages (AI tools)
- Python packages (pip)
- Go tools

### Configurations
- OpenClaw config (~/.openclaw/)
- Hermes config (~/.hermes/)
- Gemini CLI config (~/.gemini/)
- Shell configs (.bashrc, .vimrc, .tmux.conf)

### Cron Jobs
- Memory cleanup (daily 3 AM)
- System optimizer (daily 2 AM)
- Health monitor (every 30 minutes)
- Log rotation

### Custom Scripts
- /usr/local/bin/health-monitor.sh
- /usr/local/bin/system-optimizer.sh
- /usr/local/bin/system-status.sh
- /usr/local/bin/ollama
- /usr/local/bin/openshell (placeholder)
- /usr/local/bin/scrcpy

### SD Card as Home
- fstab configuration
- Auto-mount at boot

## What NOT Included (Must Reconfigure)

- **API Keys** - You must re-enter all API keys for:
  - OpenAI
  - Anthropic
  - Groq
  - NVIDIA
  - OpenRouter
  - Telegram bots

- **Skills Content** - Skills directories are created but content needs restoration from backup

- **SSH Keys** - Restore from backup

- **Private Repositories** - Clone separately after restoration

## SD Card Configuration

The playbook attempts to configure your SD card as /home. Before running:

1. Identify your SD card: `lsblk` or `sudo blkid`
2. Update `roles/system_config/tasks/main.yml` with correct device if needed
3. Or edit `/etc/fstab` manually after restoration

## Troubleshooting

### If playbook fails
```bash
# Run with verbose output
ansible-playbook -i inventory.ini playbook.yml -vvv --ask-become-pass

# Run specific tags
ansible-playbook -i inventory.ini playbook.yml --tags "base,packages" --ask-become-pass
```

### Manual steps after playbook
1. Re-add API keys to:
   - ~/.openclaw/openclaw.json
   - ~/.hermes/config.yaml
   - ~/.gemini/settings.json

2. Restore skills from backup:
   ```bash
   cp -r /path/to/backup/.openclaw/skills/* ~/.openclaw/skills/
   cp -r /path/to/backup/.hermes/skills/* ~/.hermes/skills/
   ```

3. Restart services:
   ```bash
   sudo systemctl restart docker
   sudo systemctl restart cron
   ```

4. Log out and back in for group changes

## Backup Your Current State

Before disaster strikes, backup your current skills and configs:

```bash
tar -czf ~/backup-environment.tar.gz \
    ~/.openclaw \
    ~/.hermes \
    ~/.gemini \
    ~/.npm-global \
    ~/.cargo \
    ~/picoclaw \
    /usr/local/bin/ \
    /etc/cron.d/system-optimizer
```

## Author

Generated: 2026-03-25
