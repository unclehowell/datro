"use client";

import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border px-6 py-3 flex items-center gap-3 shrink-0">
        <Link href="/" className="text-text-muted hover:text-text-primary text-sm">Dashboard</Link>
        <span className="text-text-muted">/</span>
        <h1 className="text-sm font-medium">Finance Cheque UK — Child Proxy Documentation</h1>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-3">Overview</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            This machine is a <strong>child-proxy AI agent</strong> running on a low-spec Celeron N3350 laptop
            (3.4GB RAM, 57GB eMMC). It serves as a lightweight autonomous AI runtime with a web dashboard
            on port 3000, a PTY terminal on port 3001, and a cloud LLM router that dispatches tasks to
            free-tier AI providers. The system is designed to run headless in kiosk mode (Chrome on boot)
            and be managed entirely through the web interface.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Hardware</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoCard label="CPU" value="Celeron N3350" />
            <InfoCard label="RAM" value="3.4 GB" />
            <InfoCard label="Storage" value="57 GB eMMC" />
            <InfoCard label="GPU" value="None (software rendering)" />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Architecture</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            The system follows a <strong>harness + scaffolding</strong> pattern:
          </p>
          <div className="space-y-3">
            <ArchBlock title="WebGUI (port 3000)" desc="Next.js dashboard — user input capture (text + voice), message display, pipeline visualization, tool call execution" />
            <ArchBlock title="Router" desc="Cloud LLM classifies user intent into CHAT / EXEC / MATH / VIDEO / TOOL prefixes and routes to the appropriate handler" />
            <ArchBlock title="Dispatcher" desc="Routes classified intents to the correct handler (terminal, shell, python, ai-video, etc.)" />
            <ArchBlock title="Executor" desc="Runs tools, shell commands, or returns responses. 17 registered tools across system, file, code, web, memory, agent, and media categories" />
            <ArchBlock title="TTS" desc="Voice output via Piper + Web Audio API (Google Cloud TTS API key required)" />
          </div>
        </section>

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
                <Tr><Td>agentos-gui</Td><Td>3000</Td><Td>Web dashboard (Next.js)</Td><Td>Main UI, chat, terminal, settings</Td></Tr>
                <Tr><Td>pty-server</Td><Td>3001</Td><Td>WebSocket PTY bridge</Td><Td>Real bash in pseudo-terminal, xterm.js frontend</Td></Tr>
                <Tr><Td>cloudflared</Td><Td>—</Td><Td>Cloudflare Tunnel</Td><Td>Exposes local services to internet</Td></Tr>
                <Tr><Td>omniroute-lite</Td><Td>20128</Td><Td>LLM router/proxy</Td><Td>Routes LLM requests to free providers (Groq, OpenRouter, etc.)</Td></Tr>
                <Tr><Td>voice-service</Td><Td>—</Td><Td>TTS / STT</Td><Td>Piper TTS + Whisper STT via Groq</Td></Tr>
                <Tr><Td>jarvis-dashboard</Td><Td>9119</Td><Td>Hermes agent dashboard</Td><Td>Agent session management</Td></Tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Chat Pipeline</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            When a user sends a message through the chat interface, it follows this pipeline:
          </p>
          <ol className="text-sm text-text-secondary leading-relaxed space-y-2 list-decimal list-inside">
            <li><strong>WebGUI</strong> captures the message and sends it to <code className="text-text-primary bg-zinc-800 px-1 rounded">/api/chat</code></li>
            <li><strong>Router</strong> sends the message to the cloud LLM with the ROUTER_SYSTEM prompt</li>
            <li><strong>Cloud LLM</strong> classifies the intent and returns a prefix: <code className="text-text-primary bg-zinc-800 px-1 rounded">CHAT:</code>, <code className="text-text-primary bg-zinc-800 px-1 rounded">EXEC:</code>, <code className="text-text-primary bg-zinc-800 px-1 rounded">MATH:</code>, or <code className="text-text-primary bg-zinc-800 px-1 rounded">VIDEO:</code></li>
            <li><strong>Dispatcher</strong> routes the response to the appropriate handler</li>
            <li><strong>Executor</strong> runs the tool (terminal, ai-video, remotion, etc.) and returns the result</li>
            <li><strong>TTS</strong> optionally speaks the response aloud</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Video Generation</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            The system has two video generation tools:
          </p>
          <div className="space-y-3">
            <VideoToolCard
              name="ai-video"
              desc="SVG scene engine — generates literal animated content (characters, scenes, actions). Uses Remotion CLI to render SVG compositions with spring physics, per-body-part transforms, and ffmpeg trimming."
              templates="dance, nature, city, space, fire, snow"
              composition="DanceScene, NatureScene, CityScene, SpaceScene, FireScene, SnowScene"
            />
            <VideoToolCard
              name="remotion"
              desc="Abstract/stylized video renderer — generates gradient backgrounds, animated text, title cards, and geometric shapes. Uses Remotion CLI with the same rendering pipeline."
              templates="TextAnimation, TitleCard, GradientBg, Shapes"
              composition="TextAnimation, TitleCard, GradientBg, Shapes"
            />
          </div>
          <p className="text-sm text-text-secondary leading-relaxed mt-4">
            <strong>Important:</strong> The ROUTER_SYSTEM prompt explicitly instructs the cloud LLM to use the
            <code className="text-text-primary bg-zinc-800 px-1 rounded">VIDEO:</code> prefix for all video creation requests.
            The ai-video tool is the primary tool for literal video content. The remotion tool is only for abstract/stylized renders.
            If the LLM incorrectly routes a video request to the remotion tool, the system includes redirect logic in
            <code className="text-text-primary bg-zinc-800 px-1 rounded">/api/chat</code> to detect and redirect it to ai-video.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">SVG Scene Engine</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            The ai-video tool uses an SVG scene engine built on Remotion. Each scene template is a React component
            that renders animated SVG content with spring physics and per-body-part transforms:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SceneCard name="DanceScene" desc="Animated character dancing with per-body-part spring transforms" />
            <SceneCard name="NatureScene" desc="Natural scenes with waves, palm trees, and gentle motion" />
            <SceneCard name="CityScene" desc="City skyline with neon lights and traffic flow" />
            <SceneCard name="SpaceScene" desc="Deep space with twinkling stars and nebula" />
            <SceneCard name="FireScene" desc="Flames rising with intense motion" />
            <SceneCard name="SnowScene" desc="Winter landscape with falling snow" />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Tool Registry</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">17 registered tools across 7 categories:</p>
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

        <section>
          <h2 className="text-lg font-semibold mb-3">Configuration</h2>
          <div className="space-y-4">
            <ConfigBlock title="Cloud LLM Providers" desc="Groq (primary), OpenRouter, Cerebras, Google Gemini, Mistral. Configured in /home/unclehowell/agentos-gui/.env.local" />
            <ConfigBlock title="OmniRoute" desc="LLM proxy on localhost:20128. Handles automatic failover and traffic light status system." />
            <ConfigBlock title="Hermes Agent" desc="AI agent with obsidian-brain MCP integration. Runs on localhost:9119." />
            <ConfigBlock title="Mem0" desc="Cloud semantic memory. Daily sync to Obsidian vault at ~/brain." />
            <ConfigBlock title="Piper TTS" desc="Local text-to-speech synthesis. Voice output via Web Audio API." />
            <ConfigBlock title="Chrome Kiosk" desc="Autostart on boot via ~/bin/kiosk.sh. Waits for port 3000, then opens in kiosk mode." />
            <ConfigBlock title="GNOME Desktop" desc="Bottom dock, intellihide off, dark wallpaper, favorites: Chrome, Terminal, Gedit." />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">API Endpoints</h2>
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
                <Tr><Td>/api/chat</Td><Td>POST</Td><Td>Chat API — routes messages through cloud LLM and dispatches to tools</Td></Tr>
                <Tr><Td>/api/chat</Td><Td>GET</Td><Td>Agent status + proxy lock info + video job status</Td></Tr>
                <Tr><Td>/api/tools</Td><Td>POST</Td><Td>Execute a registered tool by name</Td></Tr>
                <Tr><Td>/api/tools</Td><Td>GET</Td><Td>List all registered tools</Td></Tr>
                <Tr><Td>/api/status</Td><Td>GET</Td><Td>System status + breadcrumb health checks</Td></Tr>
                <Tr><Td>/api/video/[filename]</Td><Td>GET</Td><Td>Serve rendered video files</Td></Tr>
                <Tr><Td>/api/video/clear</Td><Td>DELETE</Td><Td>Clear all rendered videos</Td></Tr>
                <Tr><Td>/api/voice</Td><Td>POST</Td><Td>TTS (text-to-speech) and STT (speech-to-text)</Td></Tr>
                <Tr><Td>/api/proxy/unlock</Td><Td>POST</Td><Td>Unlock proxy lock for new session</Td></Tr>
                <Tr><Td>/api/proxy/lock</Td><Td>POST</Td><Td>Lock proxy for parent session</Td></Tr>
                <Tr><Td>/api/proxy/status</Td><Td>GET</Td><Td>Check proxy lock status</Td></Tr>
                <Tr><Td>/api/sessions</Td><Td>GET</Td><Td>List active agent sessions</Td></Tr>
                <Tr><Td>/api/memory</Td><Td>GET/POST</Td><Td>Memory search and store</Td></Tr>
                <Tr><Td>/api/proxy/poll</Td><Td>GET</Td><Td>Poll for proxy events</Td></Tr>
                <Tr><Td>/api/proxy/submit</Td><Td>POST</Td><Td>Submit proxy task result</Td></Tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Terminal (PTY Bridge)</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            The system includes a full PTY terminal accessible from the web dashboard:
          </p>
          <ul className="text-sm text-text-secondary leading-relaxed space-y-1 list-disc list-inside">
            <li><strong>Frontend:</strong> @xterm/xterm v6 + @xterm/addon-fit in the browser</li>
            <li><strong>WebSocket:</strong> server/pty-server.js on port 3001 (pm2-managed)</li>
            <li><strong>PTY Bridge:</strong> server/pty_bridge.py (Python stdlib pty.fork, JSON-line protocol)</li>
            <li><strong>Features:</strong> Real bash process, any program (top, htop, opencode, kilo, hermes, vim), full ANSI escape support, collapsible on-screen keyboard (Ctrl+K)</li>
            <li><strong>Bash startup delay:</strong> ~7s on this Celeron (handled by select loop in PTY bridge)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Version Scheme</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            All releases follow the format <code className="text-text-primary bg-zinc-800 px-1 rounded">v0{'{'}branch{'}'}.{'{'}X{'}'}.{'{'}Y{'}'}</code>:
          </p>
          <ul className="text-sm text-text-secondary leading-relaxed space-y-1 list-disc list-inside">
            <li><code className="text-text-primary bg-zinc-800 px-1 rounded">{'{'}branch{'}'}</code> — unique branch number (1-26)</li>
            <li><code className="text-text-primary bg-zinc-800 px-1 rounded">{'{'}X{'}'}</code> — floor(release_counter / 100)</li>
            <li><code className="text-text-primary bg-zinc-800 px-1 rounded">{'{'}Y{'}'}</code> — release_counter % 100 (2 digits, zero-padded)</li>
          </ul>
          <p className="text-sm text-text-secondary leading-relaxed mt-2">
            Branch numbers: command=1, command-agent-endpoint=2, cnei=3, ceo=4, financecheque=5, financecheque-monday-agent=6, carfinancecheque=7, bpvsbuckler=8, bpvsbuckler-redflag=9, bucklervsbp=10, rerelease=11, wayback=12, gh-pages=13, gui=14, ui=15, dash=16, althea=17, datro=18, dcc=19, ccan=20, llmwiki=21, pirateclaw=22, whitepaper=23, wave=24, bw_base=25, subrepos=26
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Kiosk Mode</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            Chrome starts in kiosk mode on boot:
          </p>
          <ul className="text-sm text-text-secondary leading-relaxed space-y-1 list-disc list-inside">
            <li>Launcher: ~/bin/kiosk.sh</li>
            <li>Autostart: ~/.config/autostart/agentos-kiosk.desktop</li>
            <li>Waits for port 3000 to be available before launching</li>
            <li>Dark wallpaper applied via ImageMagick (/tmp/agentos-wallpaper.png)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Troubleshooting</h2>
          <div className="space-y-3">
            <TroubleItem issue="Video generation fails" fix="Check that remotion CLI is available (npx remotion). Ensure ffmpeg is installed. Check TMPDIR for stale .so files and temp bundles that can fill the 1.7GB tmpfs." />
            <TroubleItem issue="Bash startup delay (~7s)" fix="Expected on Celeron N3350. PTY bridge handles this via select loop. Do not increase timeout." />
            <TroubleItem issue="Remotion render OOM" fix="Renderer uses --scale 1 and --gl swangle (software GL). If OOM occurs, it retries once with a clean slate. Stale shm files are cleaned before each render." />
            <TroubleItem issue="Cloud LLM returns wrong tool" fix="The ROUTER_SYSTEM prompt instructs the LLM to use VIDEO: prefix for video requests. If the LLM incorrectly uses remotion for video, redirect logic in /api/chat detects and corrects this." />
            <TroubleItem issue="Proxy locked" fix="A parent proxy session is active. Click 'New Session' in the chat header to unlock." />
            <TroubleItem issue="Disk full" fix="The system purged ~7GB of bloat. If disk fills again, clear ~/tmp/, ~/.npm/_npx/, and journald logs." />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Key Files</h2>
          <div className="space-y-1 text-xs font-mono text-text-secondary">
            <FileRow path="/home/unclehowell/agentos-gui/src/app/chat/page.tsx" desc="Chat interface with localStorage persistence" />
            <FileRow path="/home/unclehowell/agentos-gui/src/app/api/chat/route.ts" desc="Chat API — router, ROUTER_SYSTEM prompt, tool dispatch" />
            <FileRow path="/home/unclehowell/agentos-gui/src/runtime/tools/registry.ts" desc="Tool registry — 17 registered tools with executors" />
            <FileRow path="/home/unclehowell/agentos-gui/src/runtime/tools/ai-video.ts" desc="AI video tool — SVG scene engine via Remotion CLI" />
            <FileRow path="/home/unclehowell/agentos-gui/src/runtime/tools/remotion.ts" desc="Remotion tool — abstract/stylized video renderer" />
            <FileRow path="/home/unclehowell/agentos-gui/remotion/src/Root.tsx" desc="Remotion composition registration (SVG scenes)" />
            <FileRow path="/home/unclehowell/agentos-gui/remotion/src/templates/svg/" desc="SVG scene templates (SvgCharacter, SceneRig, DanceScene, etc.)" />
            <FileRow path="/home/unclehowell/agentos-gui/server/pty-server.js" desc="WebSocket PTY server (port 3001)" />
            <FileRow path="/home/unclehowell/agentos-gui/server/pty_bridge.py" desc="Python PTY bridge (stdlib pty.fork)" />
            <FileRow path="/home/unclehowell/agentos-gui/src/components/Dock.tsx" desc="Bottom navigation bar" />
            <FileRow path="/home/unclehowell/bin/kiosk.sh" desc="Chrome kiosk launcher" />
            <FileRow path="/home/unclehowell/.config/autostart/agentos-kiosk.desktop" desc="Kiosk autostart desktop entry" />
          </div>
        </section>
      </main>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3">
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className="text-sm font-medium text-text-primary">{value}</div>
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

function VideoToolCard({ name, desc, templates, composition }: { name: string; desc: string; templates: string; composition: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-accent font-mono text-sm">{name}</span>
        <span className="text-xs text-text-muted bg-zinc-800 px-2 py-0.5 rounded">media</span>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed mb-3">{desc}</p>
      <div className="text-xs text-text-muted">
        <span className="text-text-secondary">Templates:</span> {templates}
      </div>
      <div className="text-xs text-text-muted mt-1">
        <span className="text-text-secondary">Compositions:</span> {composition}
      </div>
    </div>
  );
}

function SceneCard({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3">
      <div className="text-sm font-medium text-text-primary mb-1">{name}</div>
      <div className="text-xs text-text-muted">{desc}</div>
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

function ConfigBlock({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3">
      <div className="text-sm font-medium text-text-primary mb-1">{title}</div>
      <div className="text-xs text-text-muted">{desc}</div>
    </div>
  );
}

function Tr({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-zinc-800">{children}</tr>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="p-2 text-text-secondary">{children}</td>;
}

function TroubleItem({ issue, fix }: { issue: string; fix: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3">
      <div className="text-sm font-medium text-text-primary mb-1">{issue}</div>
      <div className="text-xs text-text-muted">{fix}</div>
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