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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const next = [...prev, { time, message: LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)] }];
        return next.slice(-20);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full h-full bg-black font-mono text-[10px] leading-relaxed overflow-hidden relative border border-white/5">
      <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-1 custom-scrollbar">
        {logs.map((log: any, i) => (
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            key={i}
            className="flex gap-3"
          >
            <span className="text-white/20">[{log.time}]</span>
            <span className={log.message.includes('Revenue') || log.message.includes('commission') ? 'text-accent font-bold' : 'text-white/60'}>
              {log.message}
            </span>
          </motion.div>
        ))}
        <div className="flex gap-2 items-center text-accent animate-pulse">
          <span>{'>'}</span>
          <div className="w-1.5 h-3 bg-accent" />
        </div>
      </div>
      
      {/* Subtle Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] z-[10]" />
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
