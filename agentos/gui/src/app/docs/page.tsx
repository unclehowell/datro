"use client";

import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border px-6 py-3 flex items-center gap-3 shrink-0">
        <Link href="/" className="text-text-muted hover:text-text-primary text-sm">Dashboard</Link>
        <span className="text-text-muted">/</span>
        <h1 className="text-sm font-medium">Child Proxy — Architecture & Reference</h1>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-8">

        {/* Overview */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Overview</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            This machine is a <strong>child proxy node</strong> in the FinanceCheque network. It runs a local
            1B-parameter LLM (MiniCPM-1B via llama-server) for fast offline inference, a WebGUI at port 3000
            for chat and terminal access, and a proxy agent at port 4001 that registers with the parent proxy
            at <a href="https://www.financecheque.uk" className="text-accent hover:underline">financecheque.uk</a>.
            OpenClaw is a separate system and is not part of this stack.
          </p>
        </section>

        {/* Services */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Services (managed by pm2)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left p-2 text-text-muted">Name</th>
                  <th className="text-left p-2 text-text-muted">Port</th>
                  <th className="text-left p-2 text-text-muted">Role</th>
                  <th className="text-left p-2 text-text-muted">Notes</th>
                </tr>
              </thead>
              <tbody>
                <Tr><Td>agentos-gui</Td><Td>3000</Td><Td>WebGUI (Next.js)</Td><Td>Chat, terminal, pipeline view — this interface</Td></Tr>
                <Tr><Td>child-proxy</Td><Td>4001</Td><Td>OpenAI-compatible proxy</Td><Td>Registers with parent, loop prevention, local LLM fallback</Td></Tr>
                <Tr><Td>llama-server</Td><Td>8090</Td><Td>Local LLM runtime</Td><Td>MiniCPM-1B Q4_K_M — ~700MB RAM, CPU-only</Td></Tr>
                <Tr><Td>pty-server</Td><Td>3001</Td><Td>WebSocket PTY bridge</Td><Td>Real bash process, xterm.js frontend</Td></Tr>
                <Tr><Td>voice-service</Td><Td>local</Td><Td>STT / TTS</Td><Td>Whisper STT + Piper TTS, used by chat voice buttons</Td></Tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Architecture */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Architecture</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            Local inference path (default — offline, fast):
          </p>
          <div className="flex flex-wrap items-center gap-1 font-mono text-xs mb-4">
            {["Browser", "WebGUI :3000", "child-proxy :4001", "MiniCPM-1B :8090"].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-1">
                <span className="bg-surface border border-border rounded px-2 py-1">{s}</span>
                {i < arr.length - 1 && <span className="text-text-muted">→</span>}
              </span>
            ))}
          </div>
          <p className="text-sm text-text-secondary leading-relaxed mb-2">
            Cloud fallback path (when local LLM is insufficient or overloaded):
          </p>
          <div className="flex flex-wrap items-center gap-1 font-mono text-xs">
            {["child-proxy :4001", "financecheque.uk (parent)", "Cloud LLM (Groq/OpenRouter/Gemini)"].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-1">
                <span className="bg-surface border border-border rounded px-2 py-1">{s}</span>
                {i < arr.length - 1 && <span className="text-text-muted">→</span>}
              </span>
            ))}
          </div>
        </section>

        {/* Agent CLI Tools */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Agent CLI Tools</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            Three AI agent CLI tools are installed and configured to use <code className="text-text-primary bg-zinc-800 px-1 rounded">localhost:4001/v1</code> as their LLM endpoint — all local-first, parent proxy fallback:
          </p>
          <div className="space-y-3">
            <ArchBlock title="kiro-cli — Kiro AI coding agent" desc="Chat, file editing, code generation. Uses local MiniCPM-1B via child proxy. Run: kiro chat" />
            <ArchBlock title="kilo (kilocode) — Kilo coding assistant" desc="Lightweight and fast. Configured to use local proxy at port 4001. Run: kilo" />
            <ArchBlock title="hermes — General-purpose agent" desc="Memory, tool use, multi-turn tasks. Config: ~/.hermes/config.yaml — local-first, parent proxy fallback. Run: hermes" />
          </div>
        </section>

        {/* Voice Pipeline */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Voice Pipeline</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-3">
            Voice input and output is available in the chat interface:
          </p>
          <div className="flex flex-wrap items-center gap-1 font-mono text-xs mb-4">
            {["🎤 Mic", "Whisper STT", "child-proxy :4001", "MiniCPM-1B :8090", "Piper TTS", "🔊 Speaker"].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-1">
                <span className="bg-surface border border-border rounded px-2 py-1">{s}</span>
                {i < arr.length - 1 && <span className="text-text-muted">→</span>}
              </span>
            ))}
          </div>
          <ul className="text-sm text-text-secondary leading-relaxed space-y-1 list-disc list-inside">
            <li><strong>Push-to-talk:</strong> mic button in chat — records ~3s audio, transcribes via Whisper, sends to model</li>
            <li><strong>Continuous voice:</strong> duplex button — auto-loops 3s capture windows</li>
            <li><strong>STT backend:</strong> Groq Whisper API (fast, free tier) or local <code className="text-text-primary bg-zinc-800 px-1 rounded">openai-whisper</code> (offline)</li>
            <li><strong>TTS backend:</strong> Piper (local, instant) or Google Cloud TTS (API key required)</li>
            <li><strong>Auto-speak:</strong> toggle in the status bar below the chat input</li>
          </ul>
        </section>

        {/* Routing Policy */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Routing Policy (Loop Prevention)</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-3">
            The proxy uses boolean header logic to prevent infinite loops between parent and child:
          </p>
          <pre className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto text-zinc-300 leading-relaxed">{`Child Proxy receives a request:
  X-Forwarded: true  →  LOCAL LLM ONLY (came from parent — loop prevention)
  else               →  Forward to parent proxy at financecheque.uk
                         On timeout/failure: fall back to local LLM

Parent Proxy receives a request:
  X-Forwarded: true  →  CLOUD LLM ONLY (never route to children)
  X-Agentic: true    →  Route to designated agentic child
  X-Chat-Only: true  →  Cloud LLM APIs directly
  else               →  Route to available child
                         NEVER back to the requesting child`}</pre>
        </section>

        {/* Chat Pipeline */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Chat Pipeline</h2>
          <ol className="text-sm text-text-secondary leading-relaxed space-y-2 list-decimal list-inside">
            <li><strong>WebGUI</strong> captures message (text or transcribed voice) and sends to <code className="text-text-primary bg-zinc-800 px-1 rounded">/api/chat</code></li>
            <li><strong>Router</strong> sends message to cloud LLM with the ROUTER_SYSTEM prompt (Groq primary → OpenRouter → Cerebras → Gemini → Mistral)</li>
            <li><strong>Cloud LLM</strong> classifies intent: <code className="text-text-primary bg-zinc-800 px-1 rounded">CHAT:</code>, <code className="text-text-primary bg-zinc-800 px-1 rounded">EXEC:</code>, <code className="text-text-primary bg-zinc-800 px-1 rounded">MATH:</code>, or <code className="text-text-primary bg-zinc-800 px-1 rounded">VIDEO:</code></li>
            <li><strong>Dispatcher</strong> routes to appropriate handler (local LLM, terminal, ai-video, MCP, etc.)</li>
            <li><strong>Executor</strong> runs the tool and returns the result</li>
            <li><strong>TTS</strong> optionally speaks the response aloud via Piper</li>
          </ol>
        </section>

        {/* Parent Proxy API */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Parent Proxy API (financecheque.uk)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left p-2 text-text-muted">Endpoint</th>
                  <th className="text-left p-2 text-text-muted">Method</th>
                  <th className="text-left p-2 text-text-muted">Description</th>
                </tr>
              </thead>
              <tbody>
                <Tr><Td>/api/proxy?action=register</Td><Td>POST</Td><Td>Register this child with the parent network</Td></Tr>
                <Tr><Td>/api/proxy?action=heartbeat</Td><Td>POST</Td><Td>Report alive status (every 30s)</Td></Tr>
                <Tr><Td>/api/proxy?action=health</Td><Td>GET</Td><Td>List all active child nodes</Td></Tr>
                <Tr><Td>/api/proxy?action=poll</Td><Td>GET</Td><Td>Poll work queue (for children behind NAT)</Td></Tr>
                <Tr><Td>/api/proxy/v1/chat/completions</Td><Td>POST</Td><Td>OpenAI-compatible chat via parent (cloud LLM)</Td></Tr>
                <Tr><Td>/api/proxy/ota/manifest</Td><Td>GET</Td><Td>OTA update manifest for child components</Td></Tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Local API */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Local API Endpoints</h2>
          <p className="text-sm text-text-muted mb-2">Child proxy (localhost:4001):</p>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left p-2 text-text-muted">Endpoint</th>
                  <th className="text-left p-2 text-text-muted">Method</th>
                  <th className="text-left p-2 text-text-muted">Description</th>
                </tr>
              </thead>
              <tbody>
                <Tr><Td>/v1/chat/completions</Td><Td>POST</Td><Td>OpenAI-compatible — routes to local LLM or parent</Td></Tr>
                <Tr><Td>/health</Td><Td>GET</Td><Td>Liveness check</Td></Tr>
                <Tr><Td>/status</Td><Td>GET</Td><Td>Status: model, parent conn, active jobs, OTA version</Td></Tr>
                <Tr><Td>/ota/check</Td><Td>GET</Td><Td>Check for component updates from parent manifest</Td></Tr>
              </tbody>
            </table>
          </div>

          <p className="text-sm text-text-muted mb-2">WebGUI (localhost:3000):</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left p-2 text-text-muted">Endpoint</th>
                  <th className="text-left p-2 text-text-muted">Method</th>
                  <th className="text-left p-2 text-text-muted">Description</th>
                </tr>
              </thead>
              <tbody>
                <Tr><Td>/api/chat</Td><Td>POST</Td><Td>Chat — routes to local LLM or parent proxy</Td></Tr>
                <Tr><Td>/api/status</Td><Td>GET</Td><Td>Breadcrumb health: webgui, hermes, llama, model, tools, mcp</Td></Tr>
                <Tr><Td>/api/voice</Td><Td>POST</Td><Td>STT (?action=stt) and TTS (?action=tts)</Td></Tr>
                <Tr><Td>/api/tools</Td><Td>GET/POST</Td><Td>List tools / execute a tool by name</Td></Tr>
                <Tr><Td>/api/sessions</Td><Td>GET</Td><Td>List active agent sessions</Td></Tr>
                <Tr><Td>/api/proxy/status</Td><Td>GET</Td><Td>Proxy lock status (parent session active?)</Td></Tr>
                <Tr><Td>/api/proxy/unlock</Td><Td>POST</Td><Td>Release proxy lock, start new session</Td></Tr>
                <Tr><Td>/api/memory</Td><Td>GET/POST</Td><Td>Memory search and store</Td></Tr>
                <Tr><Td>/api/video/[filename]</Td><Td>GET</Td><Td>Serve rendered video files</Td></Tr>
                <Tr><Td>/api/video/clear</Td><Td>DELETE</Td><Td>Clear all rendered videos</Td></Tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Headers */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Request Headers</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left p-2 text-text-muted">Header</th>
                  <th className="text-left p-2 text-text-muted">Direction</th>
                  <th className="text-left p-2 text-text-muted">Meaning</th>
                </tr>
              </thead>
              <tbody>
                <Tr><Td>X-Forwarded: true</Td><Td>Parent → Child</Td><Td>Loop prevention — use local LLM only, never re-forward</Td></Tr>
                <Tr><Td>X-Chat-Only: true</Td><Td>Child → Parent</Td><Td>Chat query only, no agentic routing</Td></Tr>
                <Tr><Td>X-Agentic: true</Td><Td>Child → Parent</Td><Td>Agentic prompt — route to agent-capable child</Td></Tr>
                <Tr><Td>X-Source-Machine</Td><Td>Child → Parent</Td><Td>Originating child identifier</Td></Tr>
                <Tr><Td>X-FCUK-Token</Td><Td>Both</Td><Td>Auth token for child ↔ parent trust</Td></Tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Tool Registry */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Tool Registry</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-3">17 registered tools across 7 categories:</p>
          <div className="space-y-2">
            <ToolCat name="System" tools="terminal, service_check, pm2, system_info" />
            <ToolCat name="File" tools="file_read, file_write, file_search, file_grep, file_list" />
            <ToolCat name="Code" tools="git, python" />
            <ToolCat name="Web" tools="web_fetch, web_search" />
            <ToolCat name="Memory" tools="memory_search, memory_store" />
            <ToolCat name="Agent" tools="delegate" />
            <ToolCat name="Media" tools="remotion, ai-video" />
          </div>
        </section>

        {/* Troubleshooting */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Troubleshooting</h2>
          <div className="space-y-3">
            <TroubleItem issue="WebGUI not on :3000" fix="pm2 logs agentos-gui — check for port conflict or build error" />
            <TroubleItem issue="Local LLM slow / not ready" fix="pm2 logs llama-server — 1B model takes ~30s to load; needs ~700MB RAM" />
            <TroubleItem issue="Child not registering with parent" fix="Check network. Test: curl https://www.financecheque.uk/api/proxy?action=health" />
            <TroubleItem issue="Voice input not working" fix="Check mic permissions in browser. Set GROQ_API_KEY or install local whisper." />
            <TroubleItem issue="Proxy locked" fix="Parent session active. Click 'New Session' in chat header to unlock." />
            <TroubleItem issue="Video generation fails" fix="Check ffmpeg is installed. Ensure tmpfs has space (df -h /tmp)." />
            <TroubleItem issue="Restart all services" fix="pm2 restart all" />
            <TroubleItem issue="View logs" fix="pm2 logs" />
          </div>
        </section>

        {/* Key Files */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Key Files</h2>
          <div className="space-y-1 text-xs font-mono text-text-secondary">
            <FileRow path="~/fcuk-child-proxy/child-proxy.mjs" desc="OpenAI-compatible proxy agent" />
            <FileRow path="~/fcuk-child-proxy/agentos-gui/" desc="Next.js WebGUI source" />
            <FileRow path="~/fcuk-child-proxy/models/model.gguf" desc="MiniCPM-1B Q4_K_M GGUF model" />
            <FileRow path="~/fcuk-child-proxy/ecosystem.config.js" desc="pm2 process config (all services)" />
            <FileRow path="~/.hermes/config.yaml" desc="Hermes agent config (local-first LLM)" />
            <FileRow path="~/fcuk-child-proxy/agentos-gui/.env.local" desc="WebGUI environment (ports, keys)" />
            <FileRow path="agentos-gui/src/app/chat/page.tsx" desc="Chat interface with voice, pipeline view, localStorage" />
            <FileRow path="agentos-gui/src/app/api/chat/route.ts" desc="Chat API — router, tool dispatch" />
            <FileRow path="agentos-gui/src/runtime/tools/registry.ts" desc="Tool registry — 17 registered tools" />
            <FileRow path="agentos-gui/server/pty-server.js" desc="WebSocket PTY server (port 3001)" />
          </div>
        </section>

        <p className="text-xs text-text-muted pt-4 border-t border-border">
          v0.5.1.93 &middot; <a href="https://www.financecheque.uk" className="text-accent hover:underline">financecheque.uk</a> &middot; OpenClaw is a separate system and is not part of this stack.
        </p>
      </main>
    </div>
  );
}

function ArchBlock({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3 flex items-start gap-3">
      <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
      <div>
        <div className="text-sm font-medium text-text-primary">{title}</div>
        <div className="text-xs text-text-muted mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

function ToolCat({ name, tools }: { name: string; tools: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-text-primary font-medium shrink-0 w-20">{name}</span>
      <span className="text-text-muted font-mono">{tools}</span>
    </div>
  );
}

function TroubleItem({ issue, fix }: { issue: string; fix: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3">
      <div className="text-sm font-medium text-text-primary mb-1">{issue}</div>
      <div className="text-xs text-text-muted font-mono">{fix}</div>
    </div>
  );
}

function FileRow({ path, desc }: { path: string; desc: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-text-primary truncate">{path}</span>
      <span className="text-text-muted shrink-0">— {desc}</span>
    </div>
  );
}

function Tr({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-zinc-800">{children}</tr>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="p-2 text-text-secondary">{children}</td>;
}
