import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Terminal, Cpu, Activity, ShieldCheck, Globe, Zap } from 'lucide-react';

const LOG_MESSAGES = [
  "Analyzing affiliate campaign performance...",
  "Optimizing Meta ad spend for SaaS outreach...",
  "Generating high-converting landing page assets...",
  "Executing automated outreach sequence on X.com...",
  "Syncing revenue data with verified affiliate networks...",
  "Sub-agent 'Alpha-1' optimizing email funnels...",
  "Revenue detected: +£14.20 (Campaign #882)",
  "OAuth token verified for campaign distribution...",
  "Monitoring market trends for finance lead gen...",
  "Scaling outreach footprint across LinkedIn...",
  "A/B testing ad copy for e-commerce campaign...",
  "Affiliate commission tracked: +£8.50",
];

export default function AgentComputer() {
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'terminal' | 'network' | 'revenue'>('terminal');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const next = [...prev, { time, message: LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)] }];
        return next.slice(-15);
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full bg-card border border-border rounded-3xl overflow-hidden shadow-2xl shadow-accent/5">
      {/* Top Bar */}
      <div className="bg-paper border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <span className="text-[11px] font-mono text-ink/40 uppercase tracking-widest flex items-center gap-2">
            <Cpu size={12} />
            Agent System v4.2.0 // Active
          </span>
        </div>
        
        <div className="flex gap-2 bg-paper border border-border p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('terminal')}
            className={`text-[10px] font-bold uppercase px-4 py-1.5 rounded-md transition-all ${activeTab === 'terminal' ? 'bg-card text-accent shadow-sm' : 'text-ink/40 hover:text-ink'}`}
          >
            Terminal
          </button>
          <button 
            onClick={() => setActiveTab('network')}
            className={`text-[10px] font-bold uppercase px-4 py-1.5 rounded-md transition-all ${activeTab === 'network' ? 'bg-card text-accent shadow-sm' : 'text-ink/40 hover:text-ink'}`}
          >
            Network
          </button>
          <button 
            onClick={() => setActiveTab('revenue')}
            className={`text-[10px] font-bold uppercase px-4 py-1.5 rounded-md transition-all ${activeTab === 'revenue' ? 'bg-card text-accent shadow-sm' : 'text-ink/40 hover:text-ink'}`}
          >
            Revenue
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="h-[450px] grid grid-cols-1 md:grid-cols-3">
        {/* Main View */}
        <div className="col-span-2 border-r border-border p-8 font-mono text-xs overflow-hidden relative bg-paper/30">
          {activeTab === 'terminal' && (
            <div ref={scrollRef} className="h-full overflow-y-auto space-y-2 custom-scrollbar">
              {logs.map((log: any, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className="flex gap-4"
                >
                  <span className="text-ink/20">[{log.time}]</span>
                  <span className={log.message.includes('Revenue') || log.message.includes('commission') ? 'text-accent font-bold' : 'text-ink/70'}>
                    {log.message}
                  </span>
                </motion.div>
              ))}
              <div className="flex gap-2 items-center text-accent animate-pulse">
                <span>{'>'}</span>
                <div className="w-2 h-4 bg-accent" />
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="h-full flex flex-col items-center justify-center gap-10">
              <div className="relative">
                <div className="w-40 h-40 rounded-full border border-dashed border-accent/30 animate-spin-slow" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                    <Globe size={32} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                {['X.com', 'Meta', 'Gmail', 'LinkedIn'].map(service => (
                  <div key={service} className="bg-card border border-border p-4 rounded-xl flex items-center justify-between shadow-sm">
                    <span className="text-[10px] font-bold uppercase text-ink/60">{service}</span>
                    <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'revenue' && (
            <div className="h-full flex flex-col p-6">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <span className="text-[11px] font-bold uppercase text-ink/30 tracking-widest">Projected Earnings</span>
                  <div className="text-5xl font-bold text-ink tracking-tighter">£1,452.80</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase text-ink/30 tracking-widest">24h Change</span>
                  <div className="text-2xl font-bold text-green-500">+12.4%</div>
                </div>
              </div>
              <div className="flex-1 flex items-end gap-2">
                {[40, 60, 45, 70, 85, 65, 90, 75, 80, 95, 100].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    className="flex-1 bg-accent/10 border-t-2 border-accent rounded-t-sm"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Stats */}
        <div className="p-8 space-y-8 bg-paper/10">
          <div>
            <h4 className="text-[11px] font-bold uppercase text-ink/30 mb-5 tracking-widest">System Health</h4>
            <div className="space-y-5">
              <StatRow label="CPU Load" value="42%" progress={42} />
              <StatRow label="Memory" value="1.2GB" progress={65} />
              <StatRow label="Latency" value="14ms" progress={12} />
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase text-ink/30 mb-5 tracking-widest">Active Sub-Agents</h4>
            <div className="space-y-3">
              <AgentRow name="Alpha-1" status="Working" />
              <AgentRow name="Beta-7" status="Idle" />
              <AgentRow name="Gamma-X" status="Spawning" />
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <div className="flex items-center gap-2 text-accent">
              <ShieldCheck size={16} />
              <span className="text-[10px] uppercase font-bold tracking-widest">Secure Connection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, progress }: { label: string, value: string, progress: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
        <span className="text-ink/60">{label}</span>
        <span className="text-accent">{value}</span>
      </div>
      <div className="h-1.5 bg-paper border border-border rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-accent" 
        />
      </div>
    </div>
  );
}

function AgentRow({ name, status }: { name: string, status: string }) {
  return (
    <div className="flex items-center justify-between bg-card border border-border p-3 rounded-xl hover:border-accent/30 transition-all cursor-pointer group shadow-sm">
      <span className="text-[10px] font-mono font-bold text-ink/80">{name}</span>
      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
        status === 'Working' ? 'bg-accent/10 text-accent' : 
        status === 'Idle' ? 'bg-paper text-ink/30' : 
        'bg-yellow-500/10 text-yellow-600 animate-pulse'
      }`}>
        {status}
      </span>
    </div>
  );
}
