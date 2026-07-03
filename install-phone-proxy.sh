#!/usr/bin/env bash
# Phone Child Proxy Installer (Termux/Android)
# Usage: curl -sL https://raw.githubusercontent.com/unclehowell/datro/financecheque/install-phone-proxy.sh | bash

set -e

PARENT_URL="${PARENT_URL:-https://www.financecheque.uk}"
CHILD_ID="${CHILD_ID:-phone-$(date +%s)}"
PROXY_PORT="${PROXY_PORT:-4001}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/fcuk-phone-proxy}"

echo "[install] Installing phone child proxy"
echo "[install] PARENT_URL=$PARENT_URL"
echo "[install] CHILD_ID=$CHILD_ID"

# ── Detect Termux ─────────────────────────────────────────────────────────────
if [[ -n "${TERMUX_VERSION:-}" || -d "/data/data/com.termux" ]]; then
  echo "[install] Running in Termux"
  pkg update -y 2>/dev/null || true
  pkg install -y nodejs curl git 2>/dev/null || true
else
  echo "[install] Not Termux — assuming standard Linux"
fi

# ── Create directory ───────────────────────────────────────────────────────────
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# ── Write mobile-optimized child-proxy.mjs ─────────────────────────────────────
cat > "$INSTALL_DIR/child-proxy.mjs" << 'PEOF'
#!/usr/bin/env node
import http from 'http';
import urlMod from 'url';
import os from 'os';

const PARENT_URL = process.env.PARENT_URL || 'https://www.financecheque.uk';
const CHILD_ID   = process.env.CHILD_ID || `phone-${Date.now()}`;
const PORT       = Number(process.env.PORT) || 4001;
const SELF_URL   = process.env.SELF_URL || `http://localhost:${PORT}`;

let activeJobs = 0;

// ── Register ───────────────────────────────────────────────────────────────
function register() {
  fetch(`${PARENT_URL}/api/proxy?action=register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ childId: CHILD_ID, machine_id: CHILD_ID, url: SELF_URL }),
  }).then(r => r.ok ? console.log('[proxy] Registered') : console.error('[proxy] Register failed'))
    .catch(e => console.error('[proxy] Register error:', e.message));
}

// ── Heartbeat ───────────────────────────────────────────────────────────────
function heartbeat() {
  fetch(`${PARENT_URL}/api/proxy?action=heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ childId: CHILD_ID, load: activeJobs }),
  }).catch(() => {});
}

// ── Chat via available providers ─────────────────────────────────────────────
async function runChat(message) {
  const prompt = `User: ${message}`;
  
  // Try Gemini (uses GEMINI_API_KEY)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1024 }
        }) }
      );
      if (resp.ok) {
        const data = await resp.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return reply;
      }
    } catch (e) { console.log('[proxy] Gemini failed:', e.message); }
  }
  
  // Try OpenRouter (uses OPENROUTER_API_KEY)
  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey) {
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${orKey}` },
        body: JSON.stringify({ model: 'google/gemini-2.0-flash-exp:free', messages: [{ role: 'user', content: prompt }] }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) return reply;
      }
    } catch (e) { console.log('[proxy] OpenRouter failed:', e.message); }
  }
  
  return `Phone proxy ${CHILD_ID} online — no LLM response. Set GEMINI_API_KEY or OPENROUTER_API_KEY.`;
}

// ── HTTP Server ───────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.url === '/health') {
    return res.end(JSON.stringify({ ok: true, childId: CHILD_ID, activeJobs }));
  }
  
  if (req.url === '/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { message } = JSON.parse(body);
        if (!message) return res.end(JSON.stringify({ ok: false, error: 'message required' }));
        activeJobs++;
        const reply = await runChat(message);
        activeJobs--;
        res.end(JSON.stringify({ ok: true, reply, childId: CHILD_ID }));
      } catch (e) {
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }
  
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[proxy] Listening on port ${PORT} (${CHILD_ID})`);
  register();
  setInterval(heartbeat, 30000);
});
PEOF

chmod +x "$INSTALL_DIR/child-proxy.mjs"

# ── Create .env template ───────────────────────────────────────────────────────
cat > "$INSTALL_DIR/.env" << 'ENVEOF'
# API Keys for phone proxy
GEMINI_API_KEY=your-gemini-key-here
OPENROUTER_API_KEY=your-openrouter-key-here
PARENT_URL=https://www.financecheque.uk
CHILD_ID=phone-proxy
PORT=4001
ENVEOF

# ── Start via nohup (Termux-friendly) ───────────────────────────────────────
echo "[install] Starting proxy..."
pkill -f "child-proxy.mjs" 2>/dev/null || true
nohup node "$INSTALL_DIR/child-proxy.mjs" > "$INSTALL_DIR/proxy.log" 2>&1 &
echo $! > "$INSTALL_DIR/proxy.pid"

sleep 3

# ── Verify ─────────────────────────────────────────────────────────────────────
if curl -s http://localhost:$PROXY_PORT/health >/dev/null 2>&1; then
  echo "[install] SUCCESS: Proxy running on port $PROXY_PORT"
else
  echo "[install] WARNING: Check logs: tail -f $INSTALL_DIR/proxy.log"
fi

echo "[install] Done. Edit .env to add your API keys."