import { motion } from 'motion/react';
import { Terminal, Cpu, Network, Globe, Shield, ArrowRight, Copy, Check, Server, Wifi, Zap } from 'lucide-react';
import { useState } from 'react';

interface Props {
  onBack: () => void;
}

const steps = [
  {
    num: '01',
    title: 'Run One-Line Install',
    subtitle: 'curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | bash',
    details: [
      'Downloads agent.py and gui.py from the FCUK CDN',
      'Creates ~/.fcukproxy/ with a unique UUID machine identity',
      'Sets up a Python virtual environment with aiohttp',
      'Generates machine.json with hostname, IP, and ports',
    ],
  },
  {
    num: '02',
    title: 'Register with Parent Proxy',
    subtitle: 'POST /api/proxy/register',
    details: [
      'Sends machine_id, machine_name, ip_address to the parent',
      'Parent stores the node in Cloudflare D1 database',
      'Starts sending heartbeats every 30 seconds',
      'Node appears in /api/health within 15 seconds',
    ],
  },
  {
    num: '03',
    title: 'Start Local Proxy Agent',
    subtitle: 'localhost:6000 (Python aiohttp)',
    details: [
      'OpenAI-compatible endpoint at localhost:6000/v1',
      'Round-robin LLM routing: OpenRouter, Groq, DeepSeek, etc.',
      'Configures opencode, kilo, kiro CLIs to use the local proxy',
      'Sets OPENAI_BASE_URL=http://localhost:6000/v1 in .profile',
    ],
  },
  {
    num: '04',
    title: 'Launch Child Proxy (Node.js)',
    subtitle: 'localhost:4001 (Express)',
    details: [
      'Node.js Express server on port 4001',
      'OpenAI-compatible /v1/chat/completions endpoint',
      'Chat routing chain: groq CLI, kiro, local agent, opencode, kilo',
      'Registers with parent as a routable child proxy node',
    ],
  },
  {
    num: '05',
    title: 'Cloudflare Tunnel (Optional)',
    subtitle: 'child-proxy.financecheque.uk',
    details: [
      'Automatically installs cloudflared if available',
      'Creates tunnel: child-proxy.financecheque.uk → localhost:4001',
      'Makes the child proxy reachable from the public internet',
      'Enables peer-to-peer routing between child nodes',
    ],
  },
  {
    num: '06',
    title: 'Join the Agent Network',
    subtitle: 'Appears on financecheque.uk homepage',
    details: [
      'Node appears in the Agent Network section of the homepage',
      'Other nodes can route chat requests to your machine',
      'Your machine can route requests to other online nodes',
      'The network grows organically with each new install',
    ],
  },
];

const routingChain = [
  { name: 'Parent Proxy', url: 'financecheque.uk/api/proxy', desc: 'Receives request, looks up least-loaded child node' },
  { name: 'Child Proxy', port: 4001, desc: 'Node.js Express, tries local CLI tools in priority order' },
  { name: 'groq CLI', desc: 'Fastest provider, tried first' },
  { name: 'kiro CLI', desc: 'Fallback if groq unavailable' },
  { name: 'Local Agent', port: 6000, desc: 'Python aiohttp, round-robin LLM providers' },
  { name: 'opencode / kilo', desc: 'CLI fallbacks before Cloudflare fallback' },
  { name: 'Cloudflare Proxy', url: 'pirateclaw.datro.xyz', desc: 'Final fallback if all local providers fail' },
];

export default function HowItWorks({ onBack }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText('curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | bash');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-8 lg:p-16 space-y-20">
      {/* Back button */}
      <button onClick={onBack} className="text-xs font-bold uppercase tracking-widest text-accent hover:text-ink transition-colors flex items-center gap-2">
        ← Back
      </button>

      {/* Hero */}
      <section className="space-y-6">
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter leading-none">
          How It Works.
        </h1>
        <p className="text-lg text-ink/50 leading-relaxed max-w-3xl">
          The Finance Cheque UK proxy network turns any Linux machine into a distributed AI node.
          One command installs everything — no configuration needed.
        </p>

        {/* One-liner */}
        <div className="relative bg-[#0d1117] border border-[#30363d] p-4 sm:p-6 mt-8 max-w-2xl">
          <div className="flex items-center gap-3 mb-3">
            <Terminal size={16} className="text-green-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">One-Line Install</span>
          </div>
          <code className="text-xs sm:text-sm text-green-400 font-mono break-all leading-relaxed">
            curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | bash
          </code>
          <button type="button" onClick={handleCopy} className="absolute top-4 right-4 p-1.5 bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] transition-colors">
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-ink/40" />}
          </button>
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold tracking-tighter flex items-center gap-3">
          <Network size={28} className="text-accent" />
          Architecture
        </h2>
        <p className="text-sm text-ink/50 max-w-3xl">
          The FCUK proxy network uses a star topology: a single parent proxy (Cloudflare Workers + D1 database)
          orchestrates many child proxy nodes (any Linux machine). Each child proxy runs local LLM providers
          and registers itself with the parent. Chat requests are routed to the least-loaded online node.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div className="p-6 frame space-y-3">
            <div className="w-10 h-10 bg-accent/10 text-accent flex items-center justify-center">
              <Globe size={20} />
            </div>
            <h3 className="font-bold text-sm">Parent Proxy</h3>
            <p className="text-xs text-ink/50 leading-relaxed">
              Cloudflare Workers endpoint at <span className="text-accent font-mono">financecheque.uk/api/proxy</span>.
              Stores node registrations in D1, routes chat to least-loaded child, falls back to OpenRouter.
            </p>
          </div>
          <div className="p-6 frame space-y-3">
            <div className="w-10 h-10 bg-accent/10 text-accent flex items-center justify-center">
              <Server size={20} />
            </div>
            <h3 className="font-bold text-sm">Child Proxies</h3>
            <p className="text-xs text-ink/50 leading-relaxed">
              Any Linux machine running the install script. Node.js Express server on port 4001,
              Python agent on port 6000. Registers, heartbeats, and executes chat/jobs.
            </p>
          </div>
          <div className="p-6 frame space-y-3">
            <div className="w-10 h-10 bg-accent/10 text-accent flex items-center justify-center">
              <Cpu size={20} />
            </div>
            <h3 className="font-bold text-sm">LLM Providers</h3>
            <p className="text-xs text-ink/50 leading-relaxed">
              Local CLI tools (groq, kiro, opencode, kilo) provide AI inference.
              Falls back through the chain: local → parent → Cloudflare proxy.
            </p>
          </div>
        </div>
      </section>

      {/* Installation Steps */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold tracking-tighter flex items-center gap-3">
          <Zap size={28} className="text-accent" />
          What the Install Script Does
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 frame space-y-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent text-paper flex items-center justify-center font-bold text-sm">
                  {step.num}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm">{step.title}</h3>
                  <p className="text-[10px] text-accent font-mono truncate">{step.subtitle}</p>
                </div>
              </div>
              <ul className="space-y-2">
                {step.details.map((detail, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-ink/50">
                    <ArrowRight size={10} className="text-accent mt-0.5 shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Routing Chain */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold tracking-tighter flex items-center gap-3">
          <Shield size={28} className="text-accent" />
          Request Routing Chain
        </h2>
        <p className="text-sm text-ink/50 max-w-3xl">
          When a chat request hits the parent proxy, it follows this routing chain through the network.
          Each hop tries the next provider if the current one fails.
        </p>
        <div className="space-y-3">
          {routingChain.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-4 p-4 frame"
            >
              <div className="w-8 h-8 bg-accent/10 text-accent flex items-center justify-center text-xs font-bold shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{item.name}</span>
                  {'port' in item && <span className="text-[9px] font-mono text-ink/30">:{item.port}</span>}
                  {'url' in item && <span className="text-[9px] font-mono text-accent/60 truncate">{item.url}</span>}
                </div>
                <p className="text-xs text-ink/40">{item.desc}</p>
              </div>
              {i < routingChain.length - 1 && (
                <ArrowRight size={14} className="text-ink/20 shrink-0" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* System Services */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold tracking-tighter flex items-center gap-3">
          <Terminal size={28} className="text-accent" />
          What Gets Installed
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'FCUK Proxy Agent', desc: 'Python aiohttp server on port 6000', file: '~/.fcukproxy/agent.py', systemd: 'fcukproxy.service' },
            { name: 'FCUK GUI', desc: 'Web dashboard on port 6001', file: '~/.fcukproxy/gui.py', systemd: 'fcukproxy.service' },
            { name: 'Child Proxy', desc: 'Node.js Express on port 4001', file: '~/.fcukproxy/child-proxy.js', systemd: 'fcuk-child-proxy.service' },
            { name: 'Cloudflare Tunnel', desc: 'child-proxy.financecheque.uk', file: '~/.cloudflared/config.yml', systemd: 'cloudflared-child-proxy.service' },
          ].map((svc) => (
            <div key={svc.name} className="p-5 frame space-y-3">
              <div className="flex items-center gap-2">
                <Wifi size={14} className="text-green-500" />
                <h3 className="font-bold text-xs">{svc.name}</h3>
              </div>
              <p className="text-[10px] text-ink/40 leading-relaxed">{svc.desc}</p>
              <div className="text-[9px] font-mono text-ink/30 truncate bg-black/20 p-2">{svc.file}</div>
              <div className="text-[9px] font-mono text-accent/60">{svc.systemd}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Machine Config */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold tracking-tighter flex items-center gap-3">
          <Cpu size={28} className="text-accent" />
          Machine Identity
        </h2>
        <p className="text-sm text-ink/50 max-w-3xl">
          Each machine gets a unique identity stored in <span className="font-mono text-accent">~/.fcukproxy/machine.json</span>.
          This identity persists across reinstalls — the install script detects existing configs and reuses the UUID.
        </p>
        <pre className="bg-[#0d1117] border border-[#30363d] p-4 sm:p-6 text-xs font-mono overflow-x-auto text-green-400">
{`{
  "machine_id": "uuid-v4",        ← Unique, persistent identity
  "machine_name": "hostname",     ← Visible in Agent Network UI
  "local_ip": "192.168.x.x",      ← Used for local routing
  "proxy_port": 6000,             ← Python agent port
  "gui_port": 6001,               ← Dashboard port
  "parent": "financecheque.uk/api/proxy",
  "version": "0.3.0"
}`}
        </pre>
        <p className="text-xs text-ink/40">
          The machine ID is preserved across reinstalls. To reset: <span className="font-mono text-ink/60">rm ~/.fcukproxy/machine.json</span> and re-run the installer.
        </p>
      </section>
    </div>
  );
}
