import { motion } from 'motion/react';
import { Coins, CheckCircle2, ArrowRight, Mail, Twitter, Facebook, Linkedin } from 'lucide-react';
import { useState } from 'react';

const SERVICES = [
  { id: 'gmail', name: 'Gmail', icon: Mail, color: 'text-red-500', reward: 50 },
  { id: 'x', name: 'X.com', icon: Twitter, color: 'text-white', reward: 75 },
  { id: 'meta', name: 'Meta', icon: Facebook, color: 'text-blue-500', reward: 60 },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-400', reward: 80 },
];

export default function WalletCredits() {
  const [credits, setCredits] = useState(120);
  const [connected, setConnected] = useState<string[]>([]);

  const connectService = (id: string, reward: number) => {
    if (connected.includes(id)) return;
    setConnected([...connected, id]);
    setCredits(prev => prev + reward);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
      <div className="space-y-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-[1px] bg-accent" />
          <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-accent">Revenue Tracking System</span>
        </div>
        
        <h2 className="text-6xl font-bold tracking-tighter leading-none text-ink">
          Empower Agents.<br />
          <span className="text-accent">Generate Revenue.</span>
        </h2>
        
        <p className="text-ink/50 text-xl max-w-lg leading-relaxed font-medium">
          Grant access to your digital footprint so your agent can operate campaigns on your behalf. Your earnings come from real-world campaign performance.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {SERVICES.map((service) => {
            const isConnected = connected.includes(service.id);
            return (
              <button
                key={service.id}
                onClick={() => connectService(service.id, service.reward)}
                disabled={isConnected}
                className={`flex items-center justify-between p-8 frame transition-all ${
                  isConnected 
                    ? 'bg-accent/5 opacity-50' 
                    : 'hover:border-ink bg-card'
                } group`}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 flex items-center justify-center ${service.color}`}>
                    <service.icon size={32} />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">{service.name}</div>
                    <div className="text-lg font-bold text-ink tracking-tight">+{service.reward} Credits</div>
                  </div>
                </div>
                {isConnected ? (
                  <CheckCircle2 size={24} className="text-accent" />
                ) : (
                  <ArrowRight size={24} className="text-ink/10 group-hover:text-accent transition-all" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative">
        <div className="rail-text absolute -left-12 top-12">SECURE WALLET • V2.0</div>
        <div className="relative frame p-12 lg:p-16 shadow-2xl">
          <div className="flex justify-between items-start mb-20">
            <div className="space-y-2">
              <h3 className="font-bold text-3xl tracking-tighter text-ink">Earnings Wallet</h3>
              <p className="text-[10px] font-bold text-ink/30 uppercase tracking-[0.2em]">Asset ID: 0xFCUK_NETWORK_MAIN</p>
            </div>
            <div className="w-20 h-20 bg-accent text-paper flex items-center justify-center shadow-2xl shadow-accent/20">
              <div className="font-bold text-3xl">£</div>
            </div>
          </div>

          <div className="space-y-4 mb-20">
            <span className="text-[10px] uppercase font-bold text-accent tracking-[0.3em]">Projected Weekly Payout</span>
            <div className="flex items-baseline gap-4">
              <span className="text-5xl font-bold text-accent tracking-tighter">£</span>
              <motion.span 
                key={credits}
                initial={{ scale: 1.1, color: '#3B82F6' }}
                animate={{ scale: 1, color: '#0A0A0A' }}
                className="text-[120px] font-bold leading-none tracking-tighter"
              >
                {(credits * 0.01).toFixed(2)}
              </motion.span>
            </div>
            <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">
              Based on {credits} FCUK Credits (1:1 Tracking Unit)
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex justify-between text-[10px] uppercase font-bold border-b border-border pb-4">
              <span className="text-ink/30 tracking-[0.2em]">Recent Activity</span>
              <span className="text-accent cursor-pointer tracking-[0.2em]">View All</span>
            </div>
            <div className="space-y-6">
              {connected.slice().reverse().map((id, i) => {
                const service = SERVICES.find(s => s.id === id);
                return (
                  <motion.div 
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    key={id} 
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 bg-accent" />
                      <span className="text-xs font-bold text-ink/60 uppercase tracking-widest">OAuth Grant: {service?.name}</span>
                    </div>
                    <span className="text-lg font-bold text-accent tracking-tighter">+{service?.reward}</span>
                  </motion.div>
                );
              })}
              {connected.length === 0 && (
                <div className="text-xs text-ink/20 uppercase font-bold tracking-widest italic py-4">No recent transactions</div>
              )}
            </div>
          </div>

          <button className="w-full mt-20 bg-ink text-paper font-bold text-xl uppercase py-8 tracking-[0.2em] hover:bg-accent transition-all shadow-2xl shadow-accent/10">
            View Sunday Payout
          </button>
        </div>
      </div>
    </div>
  );
}
