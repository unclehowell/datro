import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRightLeft, TrendingUp, ShieldCheck, Wallet, ArrowUpRight, Coins, ArrowDown, ArrowUp, Info } from 'lucide-react';

export default function Exchange() {
  const [amount, setAmount] = useState<string>('');
  const [isSwapped, setIsSwapped] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const rate = 0.01; // 1 FCUK = 0.01 GBP

  const fromLabel = isSwapped ? 'GBP' : 'FCUK';
  const toLabel = isSwapped ? 'FCUK' : 'GBP';

  const calculateResult = () => {
    const val = parseFloat(amount) || 0;
    if (isSwapped) {
      return (val / rate).toFixed(2);
    }
    return (val * rate).toFixed(2);
  };

  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      setShowDetails(true);
    } else {
      setShowDetails(false);
    }
  }, [amount]);

  return (
    <div className="min-h-screen pt-24 pb-20 bg-paper">
      <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-border">
        <div className="p-12 lg:p-24 border-r border-border bg-card flex flex-col justify-center space-y-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-[1px] bg-accent" />
            <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-accent">FCUK Exchange</span>
          </div>
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] text-ink">FCUK<br />Exchange</h1>
            <p className="text-lg text-ink/50 max-w-xl leading-relaxed font-medium">
              Convert your earned campaign credits (FCUK) into real GBP. Your earnings are generated through verified affiliate networks and paid directly to your UK bank account.
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

        <div className="p-12 lg:p-24 bg-paper flex flex-col items-center justify-center space-y-12">
          <div className="w-full max-w-2xl frame p-12 lg:p-20 space-y-12 shadow-2xl">
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/30">You Send ({fromLabel})</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-paper border border-border rounded-none px-8 py-6 text-5xl font-bold tracking-tighter focus:outline-none focus:border-accent transition-colors"
                  />
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent text-paper flex items-center justify-center">
                      {isSwapped ? <span className="font-bold text-xl">£</span> : <Coins size={20} />}
                    </div>
                    <span className="font-bold text-xl tracking-tight">{fromLabel}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={() => setIsSwapped(!isSwapped)}
                  className="w-16 h-16 bg-paper border border-border flex items-center justify-center text-accent hover:bg-accent hover:text-paper transition-all group"
                >
                  <ArrowRightLeft size={24} className="group-hover:rotate-180 transition-transform duration-500" />
                </button>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/30">You Receive ({toLabel})</label>
                <div className="relative">
                  <div className="w-full bg-paper border border-border rounded-none px-8 py-6 text-5xl font-bold tracking-tighter text-ink/20">
                    {isSwapped ? '' : '£'}{calculateResult()}
                  </div>
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-3">
                    <div className="w-10 h-10 bg-ink text-paper flex items-center justify-center font-bold">
                      {isSwapped ? <Coins size={20} /> : '£'}
                    </div>
                    <span className="font-bold text-xl tracking-tight">{toLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-10 overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink/30 flex items-center gap-2">
                        <ArrowUp size={12} className="text-red-500" />
                        Send Summary
                      </h4>
                      <table className="w-full text-xs font-medium border-collapse">
                        <tbody>
                          <tr className="border-b border-border">
                            <td className="py-3 text-ink/40">Amount</td>
                            <td className="py-3 text-right">{amount} {fromLabel}</td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="py-3 text-ink/40">Network Fee</td>
                            <td className="py-3 text-right text-green-500">0.00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink/30 flex items-center gap-2">
                        <ArrowDown size={12} className="text-green-500" />
                        Receive Summary
                      </h4>
                      <table className="w-full text-xs font-medium border-collapse">
                        <tbody>
                          <tr className="border-b border-border">
                            <td className="py-3 text-ink/40">Amount</td>
                            <td className="py-3 text-right">{calculateResult()} {toLabel}</td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="py-3 text-ink/40">Processing</td>
                            <td className="py-3 text-right">Instant</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-paper border border-border p-8 space-y-6">
                    <h4 className="font-bold text-lg tracking-tight flex items-center gap-2">
                      <Info size={18} className="text-accent" />
                      Recipient Details
                    </h4>
                    <div className="space-y-4">
                      <input 
                        type="text" 
                        placeholder={isSwapped ? "Enter FCUK Wallet ID" : "Enter UK Bank Account Number"}
                        className="w-full bg-paper border border-border px-6 py-4 focus:outline-none focus:border-accent transition-colors font-medium text-sm"
                      />
                      <input 
                        type="text" 
                        placeholder={isSwapped ? "Network Memo (Optional)" : "Sort Code"}
                        className="w-full bg-paper border border-border px-6 py-4 focus:outline-none focus:border-accent transition-colors font-medium text-sm"
                      />
                    </div>
                  </div>

                  <button className="w-full bg-ink text-paper font-bold text-xl py-8 uppercase tracking-[0.2em] hover:bg-accent transition-all shadow-2xl shadow-accent/10 flex items-center justify-center gap-4">
                    Confirm Exchange
                    <ArrowUpRight size={28} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
