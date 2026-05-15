import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Server, Wifi, Plus, X, Copy, Check, Terminal } from 'lucide-react';

interface Node {
  machine_id: string;
  machine_name: string;
  ip_address: string;
  proxy_port: number;
  version: string;
  last_seen: string;
}

export default function NetworkAgents() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [showInstall, setShowInstall] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchNodes = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) return;
      const data = await res.json();
      setNodes(data.nodes || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, 15000);
    return () => clearInterval(interval);
  }, [fetchNodes]);

  const isActive = (lastSeen: string) => {
    if (!lastSeen) return false;
    const d = new Date(lastSeen.replace(' ', 'T') + 'Z');
    return (Date.now() - d.getTime()) < 3600000;
  };

  const onlineNodes = nodes.filter(n => isActive(n.last_seen));

  const handleCopy = async () => {
    await navigator.clipboard.writeText('curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | bash');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="flex items-center justify-center gap-4 sm:gap-8 lg:gap-12 flex-wrap">
        {onlineNodes.map((node, i) => (
          <motion.div
            key={node.machine_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center gap-3 pointer-events-auto"
          >
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#0a0a0a] border-4 border-[#1a1a1a] flex items-center justify-center shadow-xl">
                <div className="flex flex-col items-center">
                  <Server size={24} className="text-accent" />
                  <Wifi size={12} className="text-green-500 mt-1" />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 w-full max-w-[180px]">
              <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-ink/80 truncate w-full text-center">
                {node.machine_name || node.machine_id?.slice(0, 8) || 'Node'}
              </div>
              <div className="text-[9px] text-ink/40 font-mono truncate w-full text-center">
                {node.ip_address || '?'}:{node.proxy_port || 6000} — v{node.version || '?'}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-green-500">
                Online
              </div>
              <div className="text-[8px] text-ink/30">now</div>
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: onlineNodes.length * 0.1 }}
          className="flex flex-col items-center gap-3 pointer-events-auto cursor-pointer group"
          onClick={() => setShowInstall(true)}
        >
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#0a0a0a]/30 border-4 border-dashed border-[#1a1a1a] flex items-center justify-center shadow-xl group-hover:border-accent/50 transition-all">
              <div className="relative">
                <Server size={28} className="text-accent/20 group-hover:text-accent/60 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Plus size={16} className="text-accent/40 group-hover:text-accent transition-colors" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 w-full max-w-[180px]">
            <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-accent/60 group-hover:text-accent transition-colors">
              Add Agent
            </div>
            <div className="text-[8px] text-ink/30">Install on your machine</div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showInstall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
            onClick={() => setShowInstall(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-lg bg-paper border border-border p-8 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Terminal size={20} className="text-accent" />
                  <h3 className="text-lg font-bold">Add Your Machine</h3>
                </div>
                <button onClick={() => setShowInstall(false)} className="text-ink/20 hover:text-ink transition-colors">
                  <X size={20} />
                </button>
              </div>

              <p className="text-xs text-ink/50 mb-4">
                Run this one-liner on any Linux machine to join it to the FCUK proxy network:
              </p>

              <div className="relative bg-[#0d1117] border border-[#30363d] rounded p-4 mb-4">
                <code className="text-[11px] text-green-400 font-mono break-all leading-relaxed">
                  curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | bash
                </code>
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-1.5 bg-[#21262d] border border-[#30363d] rounded hover:bg-[#30363d] transition-colors"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-ink/40" />}
                </button>
              </div>

              <div className="space-y-2 text-[10px] text-ink/40 leading-relaxed">
                <p>Requires: <strong className="text-ink/60">Python 3</strong>, <strong className="text-ink/60">systemd</strong> (Linux)</p>
                <p>Installs: local proxy at <strong className="text-ink/60">localhost:6000</strong>, registers with parent proxy, configures CLI tools (opencode, kilo, kiro)</p>
              </div>

              <button
                onClick={() => setShowInstall(false)}
                className="w-full mt-6 bg-ink text-paper font-bold py-3 uppercase tracking-widest text-xs hover:bg-accent transition-all"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
