#!/bin/bash
set -e

# ── FinanceCheque Child Proxy One-Liner Installer ──────────────────────────
# Usage: curl -fsSL https://financecheque.uk/install.sh | bash
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

# ── 3-8. Install ALL free IDE/CLIs (gemini, kiro, kilo, groq, opencode + extras) ──
echo "[install] Installing free CLI/IDE tools (gemini, groq, kiro, kilo, opencode, aider, hermes...) - no paid keys needed if logged into their free tiers"

export PATH="$HOME/.npm-global/bin:$HOME/.local/bin:$HOME/.opencode/bin:$PATH:/usr/local/bin"

for cmdpkg in \
  "gemini:@google/gemini-cli" \
  "gemini:gemini" \
  "kirox:kiro-cli" \
  "kiro:kiro-cli" \
  "kilo:@kilocode/cli" \
  "groq:groq-cli" \
  "opencode:@opencode/cli"; do
  name="${cmdpkg%%:*}"
  pkg="${cmdpkg#*:}"
  if ! command -v "$name" &>/dev/null; then
    echo "[install] Trying install $name ($pkg)..."
    npm install -g "$pkg" 2>/dev/null || npm install -g "$name" 2>/dev/null || true
  fi
done

# Special gemini fallback
if ! command -v gemini &>/dev/null; then
  npm install -g @google/gemini-cli 2>/dev/null || (curl -fsSL https://raw.githubusercontent.com/google-gemini/gemini-cli/main/install.sh 2>/dev/null | bash 2>/dev/null || true)
fi

# groq direct binary fallback
if ! command -v groq &>/dev/null; then
  curl -sL https://github.com/groq/groq-cli/releases/latest/download/groq-linux-amd64 -o /tmp/groq 2>/dev/null && chmod +x /tmp/groq && sudo mv /tmp/groq /usr/local/bin/groq 2>/dev/null || mv /tmp/groq ~/.local/bin/groq 2>/dev/null || true
fi

# aider (pip free coding cli)
if ! command -v aider &>/dev/null; then
  pip3 install --user --quiet aider-chat 2>/dev/null || pip install --user --quiet aider-chat 2>/dev/null || true
fi

# hermes for webgui
if ! command -v hermes &>/dev/null; then
  pip3 install --user --quiet hermes-agent 2>/dev/null || pip install --user --quiet hermes-agent 2>/dev/null || npm install -g hermes-agent 2>/dev/null || true
fi

# update PATH and rehash
export PATH="$HOME/.npm-global/bin:$HOME/.local/bin:$HOME/.opencode/bin:$PATH"
hash -r 2>/dev/null || true

echo "[install] CLI check:"
for c in gemini groq kiro kirox kilo opencode aider hermes; do
  if command -v $c &>/dev/null; then echo "  ✓ $c"; else echo "  - $c (may need manual auth or re-source PATH)"; fi
done

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
    { cmd: "gemini", args: ["-p", prompt], timeout: 45000 },
    { cmd: "gemini", args: ["chat", "--message", prompt], timeout: 45000 },
    { cmd: process.env.KIRO_PATH || "kirox", args: ["chat", "--non-interactive", "--message", prompt], timeout: 60000 },
    { cmd: "kiro", args: ["chat", "--non-interactive", "--message", prompt], timeout: 30000 },
    { cmd: "opencode", args: ["chat", "--message", prompt], timeout: 60000 },
    { cmd: "opencode", args: ["run", prompt], timeout: 60000 },
    { cmd: "kilo", args: ["chat", "--message", prompt], timeout: 60000 },
    { cmd: "kilo", args: ["run", prompt], timeout: 60000 },
    { cmd: "hermes", args: ["chat", "-z", prompt], timeout: 90000 },
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
