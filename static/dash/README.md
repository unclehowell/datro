# 📺 LLM Supply & Demand TV Dashboard

A high-visibility, real-time "TV-style" dashboard designed to monitor LLM quotas (Supply) and active device usage (Demand). Perfect for dedicated monitoring screens or home-lab setups.

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-blue)

## ✨ Features

- **TV-Optimized UI:** High contrast, zero small text, and bold tiles designed for 10-foot viewing.
- **Real-Time Supply (Top 2/3):** Dynamic tiles for OpenAI, Anthropic, Google, Groq, Mistral, and Meta.
  - **Auto-Expansion:** Inner model boxes expand to 100% as you reach your token/request limits.
  - **Smart Eviction:** Tiles "descend" and dim when quotas are exceeded or keys are missing.
- **Real-Time Demand (Bottom 1/3):** 3-column layout tracking active users across **Laptop**, **A07 Phone**, and **AWS C2 Server**.
- **Live Connections:** Color-coded dotted lines visualize real-time requests between users and models.
- **Public-Safe:** Built with privacy in mind. No hardcoded keys or system paths; safe to push to public repositories.

---

## 🚀 Quick Start (Zero-Fuss Setup)

This project features an automated "Magic Key Discovery" script. Instead of logging into five different developer portals, this script scans your local environment for existing keys (used by tools like Aider, Claude Code, or Gemini CLI) and configures your dashboard automatically.

### 1. Clone & Install
```bash
git clone https://github.com/your-repo/llm-supply-demand.git
cd llm-supply-demand
npm install
```

### 2. The "Magic" Key Discovery
Run this command to automatically find your keys and make them "Environment Wide":

```bash
grep -rE "sk-[a-zA-Z0-9]{20,}|AIza[a-zA-Z0-9_-]{30,}|gsk_[a-zA-Z0-9]{20,}" ~ --exclude-dir={node_modules,.cache,.git} -oh 2>/dev/null | sort -u | while read key; do
    if [[ $key == sk-ant* ]]; then echo "export ANTHROPIC_API_KEY=\"$key\"" >> ~/.bashrc
    elif [[ $key == sk-* ]]; then echo "export OPENAI_API_KEY=\"$key\"" >> ~/.bashrc
    elif [[ $key == AIza* ]]; then echo "export GEMINI_API_KEY=\"$key\"" >> ~/.bashrc
    elif [[ $key == gsk_* ]]; then echo "export GROQ_API_KEY=\"$key\"" >> ~/.bashrc
    fi
done && source ~/.bashrc
```

**What this does:**
- 🔍 **Scans:** Your home directory for OpenAI, Anthropic, Gemini, and Groq key patterns.
- 🏷️ **Identifies:** Sorts them by provider (e.g., detecting the `sk-ant` prefix for Anthropic).
- 🌍 **Exports:** Appends the keys to your `~/.bashrc` so the dashboard (and other tools) can access them globally.

### 3. Run the Dashboard
For active development and tweaking:
```bash
npm run dev
```

For "Always-On" TV monitoring (via PM2):
```bash
pm2 start ecosystem.config.js
pm2 save
```

---

## 🛠️ Customization

### Adding Users & Devices
Edit the `TokenTracker` class in `server.js` to change your device list or agent names:
```javascript
this.devices = [
    { id: 'laptop', name: 'Laptop' },
    { id: 'phone-a07', name: 'A07 Phone' },
    { id: 'aws-c2', name: 'AWS C2 Server' }
];
```

### Real-Time Quota Logic
The dashboard pings the models every 60 seconds to fetch real `x-ratelimit-remaining` headers. If you want to change the frequency, adjust `this.checkInterval` in the `APIQuotaMonitor` class within `server.js`.

---

## 🔒 Security & Privacy
- **No Keys in Repo:** The `.gitignore` prevents `.env` or local scripts from being committed.
- **Sanitized Paths:** Setup scripts use `$(whoami)` and `$(pwd)` instead of hardcoded home directories.
- **Local First:** All monitoring data stays on your local network.

---

## 📜 License
MIT © 2026. Free to use, tweak, and share.
