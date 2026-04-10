import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRightLeft, TrendingUp, ShieldCheck, Wallet, ArrowUpRight, Coins } from 'lucide-react';

export default function Exchange() {
  const [fcukAmount, setFcukAmount] = useState<string>('1000');
  const rate = 0.01; // 1 FCUK = 0.01 GBP

  const gbpAmount = (parseFloat(fcukAmount) || 0) * rate;

  return (
    <div className="min-h-screen pt-24 pb-20 bg-paper">
      <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-border">
        <div className="p-12 lg:p-24 border-r border-border bg-card flex flex-col justify-center space-y-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-[1px] bg-accent" />
            <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-accent">Exchange</span>
          </div>
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] text-ink">Revenue<br />Exchange</h1>
            <p className="text-lg text-ink/50 max-w-xl leading-relaxed font-medium">
              Convert your earned campaign credits into real GBP. Your earnings are generated through verified affiliate networks and paid directly to your UK bank account every Sunday.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-8 frame space-y-4">
              <div className="text-accent font-mono text-xs">01</div>
              <h3 className="font-bold text-lg tracking-tight">Rate</h3>
              <p className="text-2xl font-bold tracking-tighter">£0.01</p>
            </div>
            <div className="p-8 frame space-y-4">
              <div className="text-accent font-mono text-xs">02</div>
              <h3 className="font-bold text-lg tracking-tight">Security</h3>
              <p className="text-2xl font-bold tracking-tighter">Regulated</p>
            </div>
            <div className="p-8 frame space-y-4">
              <div className="text-accent font-mono text-xs">03</div>
              <h3 className="font-bold text-lg tracking-tight">Payout</h3>
              <p className="text-2xl font-bold tracking-tighter">Instant</p>
            </div>
          </div>
        </div>

        <div className="p-12 lg:p-24 bg-paper flex items-center justify-center">
          <div className="w-full max-w-2xl frame p-12 lg:p-20 space-y-12 shadow-2xl">
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/30">You Send</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={fcukAmount}
                    onChange={(e) => setFcukAmount(e.target.value)}
                    className="w-full bg-paper border border-border rounded-none px-8 py-6 text-5xl font-bold tracking-tighter focus:outline-none focus:border-accent transition-colors"
                  />
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent text-paper flex items-center justify-center">
                      <Coins size={20} />
                    </div>
                    <span className="font-bold text-xl tracking-tight">Credits</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-16 h-16 bg-paper border border-border flex items-center justify-center text-ink/20">
                  <ArrowRightLeft size={24} />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/30">You Receive</label>
                <div className="relative">
                  <div className="w-full bg-paper border border-border rounded-none px-8 py-6 text-5xl font-bold tracking-tighter text-ink/20">
                    £{gbpAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-3">
                    <div className="w-10 h-10 bg-ink text-paper flex items-center justify-center font-bold">£</div>
                    <span className="font-bold text-xl tracking-tight">GBP</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div className="bg-paper border border-border p-10 space-y-8">
                <h4 className="font-bold text-xl tracking-tight">Exchange Summary</h4>
                <div className="space-y-6">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-ink/30 uppercase tracking-widest">Exchange Rate</span>
                    <span className="text-ink">1 Credit = £0.01</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-ink/30 uppercase tracking-widest">Bank Fee</span>
                    <span className="text-green-500">FREE</span>
                  </div>
                  <div className="pt-8 border-t border-border flex justify-between items-baseline">
                    <span className="font-bold text-lg tracking-tight">Total Payout</span>
                    <span className="text-5xl font-bold text-accent tracking-tighter">£{gbpAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-ink text-paper font-bold text-xl py-8 uppercase tracking-[0.2em] hover:bg-accent transition-all shadow-2xl shadow-accent/10 flex items-center justify-center gap-4">
                Confirm Exchange
                <ArrowUpRight size={28} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
