import { motion } from 'motion/react';
import { Globe, Server, Cpu, Zap, ArrowRight } from 'lucide-react';

const nodes = [
  { icon: Globe, label: 'Your Webapp', sub: 'Target URL', color: 'text-blue-400' },
  { icon: Server, label: 'financecheque.uk', sub: 'Parent Proxy API', color: 'text-accent' },
  { icon: Server, label: 'AWS 172.31.29.216', sub: 'Child Proxy', color: 'text-purple-400' },
  { icon: Cpu, label: 'Hermes / Kiro', sub: 'AI Agents', color: 'text-green-400' },
];

export default function AgentPipelineIllustration() {
  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {nodes.map((node, i) => (
          <div key={i} className="flex items-center gap-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex flex-col items-center gap-2 p-4 bg-card border border-border min-w-[100px]"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                className={`w-10 h-10 rounded-full bg-black/40 flex items-center justify-center ${node.color}`}
              >
                <node.icon size={20} />
              </motion.div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-ink/80 leading-tight">{node.label}</div>
                <div className="text-[8px] text-ink/30 uppercase tracking-widest">{node.sub}</div>
              </div>
              {/* Pulse dot */}
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                className={`w-1.5 h-1.5 rounded-full ${node.color.replace('text-', 'bg-')}`}
              />
            </motion.div>
            {i < nodes.length - 1 && (
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="text-ink/20"
              >
                <ArrowRight size={16} />
              </motion.div>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 mt-4">
        <Zap size={12} className="text-accent" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink/30">
          Jobs dispatched in real-time across the agent pool
        </span>
      </div>
    </div>
  );
}
