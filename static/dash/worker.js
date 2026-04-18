var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var API_PROVIDERS = [
  {
    id: "openai",
    name: "OPENAI",
    model: "GPT-4O",
    color: "#74aa9c",
    keyEnv: "OPENAI_API_KEY",
    endpoint: "https://api.openai.com/v1/models/gpt-4o"
  },
  {
    id: "anthropic",
    name: "ANTHROPIC",
    model: "Claude Sonnet",
    color: "#d97757",
    keyEnv: "ANTHROPIC_API_KEY",
    endpoint: "https://api.anthropic.com/v1/messages",
    headers: { "anthropic-version": "2023-06-01" }
  },
  {
    id: "google",
    name: "GOOGLE",
    model: "Gemini 2.0",
    color: "#4285f4",
    keyEnv: "GEMINI_API_KEY",
    endpoint: "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent"
  },
  {
    id: "groq",
    name: "GROQ",
    model: "Llama 3.3",
    color: "#f55036",
    keyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/models"
  },
  {
    id: "openrouter",
    name: "OPENROUTER",
    model: "Auto Router",
    color: "#6942ad",
    keyEnv: "OPENROUTER_API_KEY",
    endpoint: "https://openrouter.ai/api/v1/models"
  },
  {
    id: "deepseek",
    name: "DEEPSEEK",
    model: "DeepSeek V3",
    color: "#6b9bd1",
    keyEnv: "DEEPSEEK_API_KEY",
    endpoint: "https://api.deepseek.com/v3/models"
  },
  {
    id: "minimax",
    name: "MINIMAX",
    model: "MoE",
    color: "#00d4aa",
    keyEnv: "MINIMAX_API_KEY",
    endpoint: "https://api.minimax.chat/v1/text/chatcompletion_pro"
  },
  {
    id: "opencode",
    name: "OPENCODE",
    model: "Qwen3-8B",
    color: "#10b981",
    keyEnv: "OPENCODE_API_KEY",
    endpoint: "https://opencode.ai/zen/v1/models"
  }
];
async function fetchQuota(provider) {
  const apiKey = provider.keyEnv ? process.env[provider.keyEnv] : null;
  if (!apiKey) {
    return { id: provider.id, name: provider.name, model: provider.model, color: provider.color, available: false, reason: "No API key" };
  }
  try {
    const headers = { "Authorization": `Bearer ${apiKey}` };
    if (provider.headers) Object.assign(headers, provider.headers);
    const response = await fetch(provider.endpoint, {
      method: "GET",
      headers
    });
    if (response.ok) {
      const data = await response.json();
      const limit = response.headers.get("x-ratelimit-limit");
      const remaining = response.headers.get("x-ratelimit-remaining");
      return {
        id: provider.id,
        name: provider.name,
        model: provider.model,
        color: provider.color,
        available: true,
        limit: limit || "Unknown",
        remaining: remaining || "OK",
        data
      };
    } else {
      return { id: provider.id, name: provider.name, model: provider.model, color: provider.color, available: false, reason: `HTTP ${response.status}` };
    }
  } catch (e) {
    return { id: provider.id, name: provider.name, model: provider.model, color: provider.color, available: false, reason: e.message };
  }
}
__name(fetchQuota, "fetchQuota");
async function handleRequest(request) {
  const url = new URL(request.url);
  if (url.pathname === "/api/quota") {
    const quotas = await Promise.all(API_PROVIDERS.map((p) => fetchQuota(p)));
    return new Response(JSON.stringify(quotas, null, 2), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  if (url.pathname === "/" || url.pathname === "/index.html") {
    return new Response(HTML, {
      headers: { "Content-Type": "text/html", "Access-Control-Allow-Origin": "*" }
    });
  }
  return new Response("Not Found", { status: 404 });
}
__name(handleRequest, "handleRequest");
var HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LLM Quota Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: #0a0a0a; 
      color: #fff; 
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
    }
    .header {
      padding: 1.5rem 2rem;
      background: linear-gradient(90deg, #1a1a1a, #0a0a0a);
      border-bottom: 1px solid #333;
    }
    .header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .header span {
      color: #888;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
      padding: 2rem;
    }
    .card {
      background: #141414;
      border: 1px solid #2a2a2a;
      border-radius: 1rem;
      padding: 1.5rem;
      transition: all 0.3s ease;
    }
    .card.unavailable {
      opacity: 0.4;
      border-color: #333;
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .color-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .provider-name {
      font-size: 1.25rem;
      font-weight: 700;
    }
    .model-name {
      font-size: 0.875rem;
      color: #888;
    }
    .status {
      font-size: 1.5rem;
      font-weight: 600;
      margin-top: 1rem;
    }
    .status.available { color: #10b981; }
    .status.unavailable { color: #ef4444; }
    .reason {
      font-size: 0.75rem;
      color: #666;
      margin-top: 0.5rem;
    }
    @media (min-width: 1024px) {
      .grid { grid-template-columns: repeat(4, 1fr); }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>LLM Quota Dashboard</h1>
    <span>Real-time API availability</span>
  </div>
  <div class="grid" id="quota-grid"></div>
  <script>
    async function loadQuota() {
      try {
        const res = await fetch('/api/quota');
        const data = await res.json();
        const grid = document.getElementById('quota-grid');
        grid.innerHTML = data.map(p => \`
          <div class="card \${p.available ? '' : 'unavailable'}">
            <div class="card-header">
              <div class="color-dot" style="background: \${p.color}"></div>
              <div>
                <div class="provider-name">\${p.name}</div>
                <div class="model-name">\${p.model}</div>
              </div>
            </div>
            <div class="status \${p.available ? 'available' : 'unavailable'}">
              \${p.available ? '\u2713 ACTIVE' : '\u2717 OFFLINE'}
            </div>
            \${p.reason ? \`<div class="reason">\${p.reason}</div>\` : ''}
          </div>
        \`).join('');
      } catch (e) {
        document.getElementById('quota-grid').innerHTML = '<p style="color:#ef4444;padding:2rem;">Failed to load quota data</p>';
      }
    }
    loadQuota();
    setInterval(loadQuota, 30000);
  <\/script>
</body>
</html>`;
var worker_default = { fetch: handleRequest };
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
