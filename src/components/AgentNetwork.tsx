import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Server, Wifi, WifiOff, Zap } from 'lucide-react';

interface Node {
  machine_id: string;
  machine_name: string;
  ip_address: string;
  proxy_port: number;
  version: string;
  last_seen: string;
}

export default function AgentNetwork() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchNodes = async () => {
      try {
        const res = await fetch('/api/health');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (mounted) {
          setNodes(data.nodes || []);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    };
    fetchNodes();
    const interval = setInterval(fetchNodes, 15000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const isActive = (lastSeen: string) => {
    if (!lastSeen) return false;
    const d = new Date(lastSeen.replace(' ', 'T') + 'Z');
    return (Date.now() - d.getTime()) < 3600000;
  };

  if (loading) {
    return (
      <div className="w-full py-12 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Server size={24} className="text-accent/40" />
        </motion.div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="w-full py-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <WifiOff size={24} className="text-ink/20" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink/30">No nodes connected</span>
          <span className="text-[9px] text-ink/20">Set up a child proxy to join the network</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-4 space-y-3">
      {nodes.map((node, i) => {
        const active = isActive(node.last_seen);
        return (
          <motion.div
            key={node.machine_id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center gap-3 p-3 border ${active ? 'border-accent/20 bg-accent/5' : 'border-border bg-card'} rounded`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${active ? 'bg-accent/10' : 'bg-ink/5'}`}>
              <Server size={14} className={active ? 'text-accent' : 'text-ink/20'} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-ink/80 truncate">{node.machine_name || node.machine_id?.slice(0, 8)}</span>
                {active ? (
                  <Wifi size={12} className="text-green-500 flex-shrink-0" />
                ) : (
                  <WifiOff size={12} className="text-ink/20 flex-shrink-0" />
                )}
              </div>
              <div className="text-[9px] text-ink/30 font-mono truncate">
                {node.ip_address || '?'}:{node.proxy_port || 6000} — v{node.version || '?'}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`text-[9px] font-bold uppercase tracking-widest ${active ? 'text-green-500' : 'text-ink/20'}`}>
                {active ? 'Online' : 'Offline'}
              </div>
              <div className="text-[8px] text-ink/20">{active ? 'now' : '>1h ago'}</div>
            </div>
          </motion.div>
        );
      })}
      <div className="flex items-center justify-center gap-2 pt-2">
        <Zap size={10} className="text-accent" />
        <span className="text-[8px] font-bold uppercase tracking-widest text-ink/30">
          {nodes.filter(n => isActive(n.last_seen)).length} active / {nodes.length} total nodes
        </span>
      </div>
    </div>
  );
}
