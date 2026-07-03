#!/bin/bash
set -e

# ── FinanceCheque Child Proxy One-Liner Installer ──────────────────────────
# Usage: curl -fsSL https://financecheque.uk/install.sh | bash
# ────────────────────────────────────────────────────────────────────────────

PARENT_URL="${PARENT_URL:-https://www.financecheque.uk}"
CHILD_ID="${CHILD_ID:-$(hostname)}"
PROXY_PORT="${PROXY_PORT:-4001}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/fcuk-child-proxy}"

# ── Detect Termux / Android for cross-device child proxies (phones too) ────
IS_TERMUX=false
if [[ -n "${TERMUX_VERSION:-}" || "$(uname -o 2>/dev/null)" == "Android" || -d "/data/data/com.termux" ]]; then
  IS_TERMUX=true
fi

echo "[install] Installing child proxy for FinanceCheque"
echo "[install] PARENT_URL=$PARENT_URL"
echo "[install] CHILD_ID=$CHILD_ID"
echo "[install] PORT=$PROXY_PORT"
$IS_TERMUX && echo "[install] Termux/Android mode detected - will use pkg, no sudo"

# ── 1. System dependencies ─────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "[install] Installing Node.js..."
  if $IS_TERMUX; then
    pkg update -y 2>/dev/null || true
    pkg install -y nodejs tmux curl git 2>/dev/null || true
  else
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs tmux curl git 2>/dev/null || yum install -y nodejs tmux curl git 2>/dev/null || true
  fi
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

# groq direct binary fallback (Termux friendly, no sudo)
if ! command -v groq &>/dev/null; then
  if $IS_TERMUX; then
    mkdir -p "$HOME/bin"
    curl -sL https://github.com/groq/groq-cli/releases/latest/download/groq-linux-amd64 -o "$HOME/bin/groq" 2>/dev/null && chmod +x "$HOME/bin/groq" && export PATH="$HOME/bin:$PATH" || true
  else
    curl -sL https://github.com/groq/groq-cli/releases/latest/download/groq-linux-amd64 -o /tmp/groq 2>/dev/null && chmod +x /tmp/groq && (sudo mv /tmp/groq /usr/local/bin/groq 2>/dev/null || mv /tmp/groq ~/.local/bin/groq 2>/dev/null || true)
  fi
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
import { execFile } from "child_process";
import { promises as fsp } from "fs";
import { promisify } from "util";
import os from "os";
import path from "path";

const execFileAsync = promisify(execFile);

const PARENT_URL = process.env.PARENT_URL || "https://www.financecheque.uk";
const CHILD_ID   = process.env.CHILD_ID   || `child-${os.hostname()}`;
const PORT       = Number(process.env.PORT) || 4001;
const SELF_URL   = process.env.SELF_URL    || `http://${os.hostname()}:${PORT}`;

const app = express();
app.use(express.json());
let activeJobs = 0;

let rrIndex = 0;
const rrFile = path.join(os.homedir(), ".fcukproxy", "round-robin-state.json");
async function loadRRState() {
  try {
    const s = JSON.parse(await fsp.readFile(rrFile, "utf-8"));
    rrIndex = s.index || 0;
  } catch {}
}
async function saveRRState() {
  try { await fsp.writeFile(rrFile, JSON.stringify({ index: rrIndex, updated: new Date().toISOString() })); } catch {}
}

async function register() {
  try {
    const res = await fetch(`${PARENT_URL}/api/proxy?action=register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId: CHILD_ID, machine_id: CHILD_ID, machine_name: os.hostname(), url: SELF_URL }),
    });
    if (res.ok) {
    } else {
      console.error(`[child-proxy] Registration failed: ${res.status}`);
    }
  } catch (err) {
    console.error("[child-proxy] Registration error:", err.message);
  }
}

async function heartbeat() {
  try {
    await fetch(`${PARENT_URL}/api/proxy?action=heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId: CHILD_ID, machine_id: CHILD_ID, machine_name: os.hostname(), load: activeJobs, url: SELF_URL }),
    });
  } catch { /* ignore */ }
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, childId: CHILD_ID, activeJobs });
});

app.post("/chat", async (req, res) => {
  const { message, messages, chat_only } = req.body || {};
  const text = message || (messages?.length > 0 ? messages[messages.length - 1].content : "");
  if (!text) return res.status(400).json({ ok: false, error: "message is required" });

  try {
    const reply = await runChat(text);
    return res.json({
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "child-proxy",
      choices: [{ index: 0, message: { role: "assistant", content: reply }, finish_reason: "stop" }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      _proxy: { childId: CHILD_ID },
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || "chat failed", childId: CHILD_ID });
  }
});

app.post("/v1/chat/completions", async (req, res) => {
  const body = req.body || {};
  const messages = body.messages || [];
  const lastMsg = messages.length > 0 ? messages[messages.length - 1].content : "";
  if (!lastMsg) return res.status(400).json({ error: "messages required" });

  try {
    const reply = await runChat(lastMsg);
    return res.json({
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: body.model || "proxy-router",
      choices: [{ index: 0, message: { role: "assistant", content: reply || "" }, finish_reason: "stop" }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      _proxy: { childId: CHILD_ID },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "chat failed" });
  }
});

app.get("/v1/models", (_req, res) => {
  res.json({
    object: "list",
    data: [
      { id: "proxy-router", object: "model", created: Math.floor(Date.now() / 1000), owned_by: "fcuk-proxy" },
      { id: "kilo-chat", object: "model", created: Math.floor(Date.now() / 1000), owned_by: "kilo" },
      { id: "opencode-chat", object: "model", created: Math.floor(Date.now() / 1000), owned_by: "opencode" },
    ],
  });
});

const providers = [
  { cmd: "groq", args: ["chat", "--message"], timeout: 30000 },
  { cmd: "gemini", args: ["-p"], timeout: 45000 },
  { cmd: "gemini", args: ["chat", "--message"], timeout: 45000 },
  { cmd: process.env.KIRO_PATH || "kirox", args: ["chat", "--non-interactive", "--message"], timeout: 60000 },
  { cmd: "kiro", args: ["chat", "--non-interactive", "--message"], timeout: 30000 },
  { cmd: "opencode", args: ["chat", "--message"], timeout: 60000 },
  { cmd: "opencode", args: ["run"], timeout: 60000 },
  { cmd: "kilo", args: ["chat", "--message"], timeout: 60000 },
  { cmd: "kilo", args: ["run"], timeout: 60000 },
  { cmd: "hermes", args: ["chat", "-z"], timeout: 90000 },
];

async function runChat(message) {
  const prompt = `You are the FinanceCheque child proxy operator. Reply concisely.
User message: ${message}`;
  const total = providers.length;

  async function tryProvider(p, idx) {
    try {
      const args = [...p.args, prompt];
      const { stdout } = await execFileAsync(p.cmd, args, { timeout: Math.min(p.timeout, 15000), maxBuffer: 1024 * 1024 });
      const reply = stdout?.trim();
      if (reply) return { idx, reply };
    } catch {}
    return null;
  }

  const results = await Promise.allSettled(
    providers.map((p, i) => tryProvider(p, (rrIndex + i) % total))
  );

  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      rrIndex = (r.value.idx + 1) % total;
      await saveRRState();
      return r.value.reply;
    }
  }

  try {
    const resp = await fetch("https://pirateclaw.datro.xyz/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer test" },
      body: JSON.stringify({ model: "auto", messages: [{ role: "user", content: prompt }], max_tokens: 500 }),
      signal: AbortSignal.timeout(15000),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
    }
  } catch {}

  return `Child proxy ${CHILD_ID} received your message and is online.`;
}

app.listen(PORT, "0.0.0.0", async () => {
  await loadRRState();
  console.log(`[child-proxy] Listening on port ${PORT} (${CHILD_ID}) [rrIndex=${rrIndex}]`);
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
SELF_IP="127.0.0.1"
if ! $IS_TERMUX && command -v hostname >/dev/null; then
  SELF_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo 127.0.0.1)
fi
PROXY_CMD="export PATH=\"$HOME/.npm-global/bin:$HOME/.local/bin:$HOME/bin:/usr/local/bin:\$PATH\"; cd $INSTALL_DIR && PARENT_URL=$PARENT_URL CHILD_ID=$CHILD_ID PORT=$PROXY_PORT SELF_URL=http://${SELF_IP}:$PROXY_PORT node child-proxy.js 2>&1"
tmux new-session -d -s fcuk-child-proxy -n proxy "$PROXY_CMD"

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

# ── Termux / Android specific notes for child proxy on phone ───────────────
if $IS_TERMUX; then
  echo ""
  echo "[install] === Termux / Android instructions ==="
  echo "[install] To keep the proxy running in background on Android:"
  echo "[install]   termux-wake-lock"
  echo "[install]   # Then detach from tmux or use termux-services if set up"
  echo "[install] The child will register and can participate via polling even if not directly reachable."
  echo "[install] Install extra if needed: pkg install termux-services"
  echo "[install] Run 'source ~/.bashrc' or restart Termux for PATH updates."
  echo "[install] More CLIs = more free capacity contributed to the parent proxy network."
fi
