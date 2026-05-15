import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Server, Wifi, Plus, X, Copy, Check, Terminal, Zap, Coins, Mail, User } from 'lucide-react';

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
  const [iframeUrl, setIframeUrl] = useState('');

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
      <div className="flex items-center justify-center gap-6 sm:gap-10 lg:gap-14 flex-wrap">
        {onlineNodes.map((node, i) => (
          <motion.div
            key={node.machine_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center gap-3 pointer-events-auto"
          >
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIframeUrl('https://financecheque.uk/ui/')}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#0a0a0a] border-4 border-[#1a1a1a] flex items-center justify-center shadow-xl hover:border-accent/50 transition-all cursor-pointer"
              >
                <div className="flex flex-col items-center">
                  <Server size={24} className="text-accent" />
                  <Wifi size={12} className="text-green-500 mt-1" />
                </div>
              </motion.button>
            </div>

            <div className="flex flex-col items-center gap-2 w-full max-w-[200px]">
              {/* Chat icons + Name */}
              <div className="flex items-center justify-center gap-2 w-full">
                <button
                  onClick={() => setIframeUrl('https://financecheque.uk/ui/')}
                  className="hover:scale-110 transition-transform opacity-70 hover:opacity-100"
                >
                  <Mail size={14} className="text-accent" />
                </button>
                <button
                  onClick={() => setIframeUrl('https://financecheque.uk/ui/')}
                  className="hover:scale-110 transition-transform opacity-70 hover:opacity-100"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                </button>
                <button
                  onClick={() => setIframeUrl('https://financecheque.uk/ui/')}
                  className="hover:scale-110 transition-transform opacity-70 hover:opacity-100"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="Telegram" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                </button>
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-ink/80 truncate">
                  {node.machine_name || node.machine_id?.slice(0, 8) || 'Node'}
                </span>
              </div>

              {/* IP:PORT — vVERSION */}
              <div className="text-[8px] text-ink/40 font-mono truncate w-full text-center">
                {node.ip_address || '?'}:{node.proxy_port || 6000} — v{node.version || '?'}
              </div>

              {/* Buttons grid: Connect | Balance / Spawn | Remove */}
              <div className="grid grid-cols-2 gap-1.5 w-full">
                <button
                  onClick={() => setIframeUrl('https://financecheque.uk/ui/')}
                  className="flex items-center justify-center gap-1.5 bg-accent text-white py-2 rounded text-[9px] font-bold uppercase tracking-widest hover:bg-ink transition-all"
                >
                  <Zap size={12} />
                  Connect
                </button>
                <button
                  onClick={() => setIframeUrl('https://financecheque.uk/ui/')}
                  className="flex items-center justify-center gap-1.5 bg-card border border-border py-2 rounded text-[9px] font-bold uppercase tracking-widest text-ink/40 hover:text-accent hover:border-accent transition-all"
                >
                  <Coins size={12} />
                  0.00
                </button>
                <button
                  onClick={() => setShowInstall(true)}
                  className="flex items-center justify-center gap-1.5 bg-card border border-border py-1.5 rounded text-[7px] font-bold uppercase tracking-widest text-ink/40 hover:text-accent hover:border-accent transition-all"
                >
                  <Plus size={10} />
                  Spawn
                </button>
                <button
                  onClick={() => {}}
                  className="flex items-center justify-center gap-1.5 bg-card border border-border py-1.5 rounded text-[7px] font-bold uppercase tracking-widest text-ink/40 hover:text-red-500 hover:border-red-500 transition-all"
                >
                  <X size={10} />
                  Remove
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Add Agent card */}
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

      {/* Install one-liner modal */}
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
                <button
                  type="button"
                  onClick={() => setShowInstall(false)}
                  className="text-ink/20 hover:text-ink transition-colors"
                >
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
                  type="button"
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-1.5 bg-[#21262d] border border-[#30363d] rounded hover:bg-[#30363d] transition-colors"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-ink/40" />}
                </button>
              </div>

              <div className="space-y-2 text-[10px] text-ink/40 leading-relaxed">
                <p>Requires: <strong className="text-ink/60">Python 3</strong>, <strong className="text-ink/60">systemd</strong> (Linux)</p>
                <p>Installs: local proxy at <strong className="text-ink/60">localhost:6000</strong>, registers with parent proxy, configures CLI tools</p>
              </div>

              <button
                type="button"
                onClick={() => setShowInstall(false)}
                className="w-full mt-6 bg-ink text-paper font-bold py-3 uppercase tracking-widest text-xs hover:bg-accent transition-all"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iframe modal */}
      <AnimatePresence>
        {iframeUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md"
            onClick={() => setIframeUrl('')}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl h-[80vh] bg-white border border-border rounded-sm shadow-2xl overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 bg-[#0d1117] border-b border-[#30363d]">
                <span className="text-[10px] text-ink/40 font-mono truncate">{iframeUrl}</span>
                <button
                  type="button"
                  onClick={() => setIframeUrl('')}
                  className="text-ink/20 hover:text-ink transition-colors flex-shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
              <iframe
                src={iframeUrl}
                className="flex-1 w-full border-0"
                title="Agent UI"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
