#!/bin/bash
set -e

# ── Child Proxy One-Liner Installer ────────────────────────────────────────
# Usage: curl -sL https://raw.githubusercontent.com/unclehowell/datro/financecheque/install-child-proxy.sh | bash
# Or:   bash <(curl -sL https://bit.ly/...)
# ────────────────────────────────────────────────────────────────────────────

PARENT_URL="${PARENT_URL:-https://www.financecheque.uk}"
CHILD_ID="${CHILD_ID:-$(hostname)}"
PROXY_PORT="${PROXY_PORT:-4001}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/fcuk-child-proxy}"

echo "[install] Installing child proxy for FinanceCheque"
echo "[install] PARENT_URL=$PARENT_URL"
echo "[install] CHILD_ID=$CHILD_ID"
echo "[install] PORT=$PROXY_PORT"

# ── 1. System dependencies ─────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "[install] Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs tmux curl git 2>/dev/null || yum install -y nodejs tmux curl git 2>/dev/null
fi

# ── 2. Create install directory ────────────────────────────────────────────
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# ── 3. Install kiro ────────────────────────────────────────────────────────
if ! command -v kiro &>/dev/null; then
  echo "[install] Installing kiro..."
  if [ -f /usr/local/bin/kiro ]; then
    echo "[install] kiro already at /usr/local/bin/kiro"
  elif [ -f /home/ubuntu/kiro-cli-temp ]; then
    echo "[install] kiro found at /home/ubuntu/kiro-cli-temp"
    ln -sf /home/ubuntu/kiro-cli-temp /usr/local/bin/kiro 2>/dev/null || true
  else
    # Try npm global
    npm install -g kiro-cli 2>/dev/null || echo "[install] kiro npm install failed (non-fatal)"
  fi
fi

# ── 4. Install kilo ────────────────────────────────────────────────────────
if ! command -v kilo &>/dev/null; then
  echo "[install] Installing kilo..."
  npm install -g @kilocode/cli 2>/dev/null || echo "[install] kilo install skipped (non-fatal)"
fi

# ── 5. Install groq ────────────────────────────────────────────────────────
if ! command -v groq &>/dev/null; then
  echo "[install] Installing groq CLI..."
  npm install -g groq-cli 2>/dev/null || curl -sL https://github.com/groq/groq-cli/releases/latest/download/groq-linux-amd64 -o /usr/local/bin/groq 2>/dev/null && chmod +x /usr/local/bin/groq 2>/dev/null || echo "[install] groq install skipped (non-fatal)"
fi

# ── 6. Install opencode ────────────────────────────────────────────────────
if ! command -v opencode &>/dev/null; then
  echo "[install] Installing opencode..."
  npm install -g @opencode/cli 2>/dev/null || echo "[install] opencode install skipped (non-fatal)"
fi

# ── 7. Write child-proxy.js ────────────────────────────────────────────────
echo "[install] Writing child-proxy.js..."
cat > "$INSTALL_DIR/child-proxy.js" << 'CPEOF'
#!/usr/bin/env node
import express from "express";
import { execFile, spawn } from "child_process";
import { promisify } from "util";
import os from "os";

const execFileAsync = promisify(execFile);

const PARENT_URL = process.env.PARENT_URL || "https://www.financecheque.uk";
const CHILD_ID   = process.env.CHILD_ID   || `node-${os.hostname()}`;
const PORT       = Number(process.env.PORT) || 4001;
const SELF_URL   = process.env.SELF_URL    || `http://${os.hostname()}:${PORT}`;

const app = express();
app.use(express.json());
let activeJobs = 0;

async function register() {
  try {
    const res = await fetch(`${PARENT_URL}/api/proxy?action=register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId: CHILD_ID, machine_id: CHILD_ID, url: SELF_URL }),
    });
    if (res.ok) console.log(`[child-proxy] Registered with parent: ${PARENT_URL}`);
    else console.error(`[child-proxy] Registration failed: ${res.status}`);
  } catch (err) {
    console.error("[child-proxy] Registration error:", err.message);
  }
}

async function heartbeat() {
  try {
    await fetch(`${PARENT_URL}/api/proxy?action=heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId: CHILD_ID, machine_id: CHILD_ID, load: activeJobs }),
    });
  } catch {}
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, childId: CHILD_ID, activeJobs });
});

app.post("/chat", async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ ok: false, error: "message is required" });
  try {
    const reply = await runChat(message);
    return res.json({ ok: true, reply, childId: CHILD_ID });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || "chat failed", childId: CHILD_ID });
  }
});

async function runChat(message) {
  const prompt = `You are the FinanceCheque child proxy operator. Reply concisely.\nUser message: ${message}`;

  const providers = [
    { cmd: "groq", args: ["chat", "--message", prompt], timeout: 30000 },
    { cmd: process.env.KIRO_PATH || "kiro", args: ["chat", "--non-interactive", "--message", prompt], timeout: 60000 },
    { cmd: "opencode", args: ["chat", "--message", prompt], timeout: 60000 },
    { cmd: "kilo", args: ["chat", "--message", prompt], timeout: 60000 },
  ];

  for (const p of providers) {
    try {
      const { stdout } = await execFileAsync(p.cmd, p.args, { timeout: p.timeout, maxBuffer: 1024 * 1024 });
      if (stdout?.trim()) return stdout.trim();
    } catch {}
  }

  try {
    const resp = await fetch("https://pirateclaw.datro.xyz/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer test" },
      body: JSON.stringify({ model: "auto", messages: [{ role: "user", content: prompt }], max_tokens: 500 }),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
    }
  } catch {}

  return `Child proxy ${CHILD_ID} received your message and is online.`;
}

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`[child-proxy] Listening on port ${PORT} (${CHILD_ID})`);
  await register();
  setInterval(heartbeat, 30_000);
});
CPEOF

# ── 8. Write package.json ──────────────────────────────────────────────────
echo "[install] Writing package.json..."
cat > "$INSTALL_DIR/package.json" << 'PKGEOF'
{
  "name": "fcuk-child-proxy",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "express": "^4.18.2"
  }
}
PKGEOF

# ── 9. Install npm deps ────────────────────────────────────────────────────
echo "[install] Installing npm dependencies..."
npm install --prefix "$INSTALL_DIR" 2>&1 | tail -3

# ── 10. Kill any existing child proxy on this port ─────────────────────────
echo "[install] Stopping any existing child proxy on port $PROXY_PORT..."
lsof -ti :$PROXY_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true

# ── 11. Start in tmux ──────────────────────────────────────────────────────
echo "[install] Starting child proxy in tmux..."
tmux kill-session -t fcuk-child-proxy 2>/dev/null || true
tmux new-session -d -s fcuk-child-proxy -n proxy "cd $INSTALL_DIR && PARENT_URL=$PARENT_URL CHILD_ID=$CHILD_ID PORT=$PROXY_PORT SELF_URL=http://$(hostname -I | awk '{print $1}'):$PROXY_PORT node child-proxy.js 2>&1"

echo "[install] Starting groq service in tmux..."
tmux kill-session -t fcuk-groq 2>/dev/null || true
tmux new-session -d -s fcuk-groq -n groq "groq serve --port 5000 2>&1" 2>/dev/null || true

# ── 12. Verify ─────────────────────────────────────────────────────────────
sleep 3
for i in 1 2 3; do lsof -i :$PROXY_PORT &>/dev/null && break; sleep 1; done
if lsof -i :$PROXY_PORT &>/dev/null; then
  echo "[install] SUCCESS: Child proxy running on port $PROXY_PORT"
  echo "[install] Registered as: $CHILD_ID"
  echo "[install] Parent proxy: $PARENT_URL"
  curl -s http://localhost:$PROXY_PORT/health | python3 -m json.tool 2>/dev/null || echo "  Health check: $(curl -s http://localhost:$PROXY_PORT/health)"
else
  echo "[install] WARNING: Child proxy does not appear to be running"
  echo "[install] Check logs: tmux attach -t fcuk-child-proxy"
fi

echo "[install] Done! Tmux sessions:"
tmux ls 2>/dev/null || echo "  (tmux not available)"
