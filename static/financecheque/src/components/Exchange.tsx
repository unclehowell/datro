import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRightLeft, TrendingUp, ShieldCheck, Wallet, ArrowUpRight, Coins, ArrowDown, ArrowUp, Info, ChevronLeft, Bitcoin, Banknote } from 'lucide-react';

interface ExchangeProps {
  onBack: () => void;
  balance?: number;
  onboardingStep?: number;
  onAuthRequired?: () => void;
}

export default function Exchange({ onBack, balance = 0, onboardingStep = 0, onAuthRequired }: ExchangeProps) {
  const [amount, setAmount] = useState<string>(onboardingStep >= 4 ? '2.33' : '');
  const [isSwapped, setIsSwapped] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [currency, setCurrency] = useState<'GBP' | 'BTC'>('GBP');
  const rate = 0.01 / 2.33; // 2.33 FCUK = 0.01 GBP
  const btcRate = 0.0000001; // Mock BTC rate

  const fromLabel = isSwapped ? currency : 'FCUK';
  const toLabel = isSwapped ? 'FCUK' : currency;

  const calculateResult = () => {
    const val = parseFloat(amount) || 0;
    const currentRate = currency === 'GBP' ? rate : btcRate;
    if (isSwapped) {
      return (val / currentRate).toFixed(2);
    }
    return (val * currentRate).toFixed(currency === 'GBP' ? 2 : 8);
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
      <div className="max-w-[1800px] mx-auto px-8 mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink/40 hover:text-accent transition-colors"
        >
          <ChevronLeft size={14} />
          Back to Home
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-border">
        <div className="p-6 sm:p-12 lg:p-24 border-r border-border bg-card flex flex-col justify-center space-y-8 lg:space-y-12">
          <div className="flex items-center gap-4">
            <div className="w-8 lg:w-12 h-[1px] bg-accent" />
            <span className="text-[10px] lg:text-[11px] uppercase tracking-[0.3em] font-bold text-accent">FCUK Exchange</span>
          </div>
          <div className="space-y-4 lg:space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tighter leading-[0.9] text-ink">FCUK<br />Exchange</h1>
            <p className="text-sm lg:text-lg text-ink/50 max-w-xl leading-relaxed font-medium">
              Convert your earned campaign credits (FCUK) into real GBP. Your earnings are generated through verified affiliate networks and paid directly to your UK bank account.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            <div className="p-6 lg:p-8 frame space-y-3 lg:space-y-4">
              <div className="text-accent font-mono text-[10px] lg:text-xs">01</div>
              <h3 className="font-bold text-base lg:text-lg tracking-tight">Balance</h3>
              <p className="text-xl lg:text-2xl font-bold tracking-tighter">{balance.toFixed(2)} FCUK</p>
            </div>
            <div className="p-6 lg:p-8 frame space-y-3 lg:space-y-4">
              <div className="text-accent font-mono text-[10px] lg:text-xs">02</div>
              <h3 className="font-bold text-base lg:text-lg tracking-tight">Rate</h3>
              <p className="text-xl lg:text-2xl font-bold tracking-tighter">£0.01 / 2.33</p>
            </div>
            <div className="p-6 lg:p-8 frame space-y-3 lg:space-y-4">
              <div className="text-accent font-mono text-[10px] lg:text-xs">03</div>
              <h3 className="font-bold text-base lg:text-lg tracking-tight">Payout</h3>
              <p className="text-xl lg:text-2xl font-bold tracking-tighter">Instant</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-12 lg:p-24 bg-paper flex flex-col items-center justify-center space-y-8 lg:space-y-12">
          <div className="w-full max-w-2xl frame p-6 sm:p-12 lg:p-20 space-y-8 lg:space-y-12 shadow-2xl">
            <div className="space-y-6 lg:space-y-8">
              {/* Currency Selector */}
              <div className="flex gap-2 sm:gap-4">
                <button 
                  onClick={() => setCurrency('GBP')}
                  className={`flex-1 p-3 sm:p-4 border flex items-center justify-center gap-2 sm:gap-3 font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all ${currency === 'GBP' ? 'bg-ink text-paper border-ink' : 'bg-paper text-ink/40 border-border hover:border-accent'}`}
                >
                  <Banknote size={14} />
                  GBP
                </button>
                <button 
                  onClick={() => setCurrency('BTC')}
                  className={`flex-1 p-3 sm:p-4 border flex items-center justify-center gap-2 sm:gap-3 font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all ${currency === 'BTC' ? 'bg-ink text-paper border-ink' : 'bg-paper text-ink/40 border-border hover:border-accent'}`}
                >
                  <Bitcoin size={14} />
                  BTC
                </button>
              </div>

              <div className="space-y-3 lg:space-y-4">
                <label className="text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.2em] text-ink/30">You Send ({fromLabel})</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-paper border border-border rounded-none px-4 sm:px-8 py-4 sm:py-6 text-3xl sm:text-5xl font-bold tracking-tighter focus:outline-none focus:border-accent transition-colors"
                  />
                  <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent text-paper flex items-center justify-center">
                      {isSwapped ? <span className="font-bold text-lg">£</span> : <Coins size={16} />}
                    </div>
                    <span className="font-bold text-lg sm:text-xl tracking-tight">{fromLabel}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={() => setIsSwapped(!isSwapped)}
                  className="w-12 h-12 sm:w-16 sm:h-16 bg-paper border border-border flex items-center justify-center text-accent hover:bg-accent hover:text-paper transition-all group"
                >
                  <ArrowRightLeft size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                </button>
              </div>

              <div className="space-y-3 lg:space-y-4">
                <label className="text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.2em] text-ink/30">You Receive ({toLabel})</label>
                <div className="relative">
                  <div className="w-full bg-paper border border-border rounded-none px-4 sm:px-8 py-4 sm:py-6 text-3xl sm:text-5xl font-bold tracking-tighter text-ink/20">
                    {isSwapped ? '' : '£'}{calculateResult()}
                  </div>
                  <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-ink text-paper flex items-center justify-center font-bold">
                      {isSwapped ? <Coins size={16} /> : '£'}
                    </div>
                    <span className="font-bold text-lg sm:text-xl tracking-tight">{toLabel}</span>
                  </div>
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

                  <div className="bg-paper border border-border p-6 sm:p-8 space-y-4 sm:space-y-6">
                    <h4 className="font-bold text-base sm:text-lg tracking-tight flex items-center gap-2">
                      <Info size={18} className="text-accent" />
                      Recipient Details
                    </h4>
                    <div className="space-y-3 sm:space-y-4">
                      {currency === 'GBP' ? (
                        <>
                          <input 
                            type="text" 
                            placeholder="Account Number (8 digits)"
                            className="w-full bg-paper border border-border px-4 sm:px-6 py-3 sm:py-4 focus:outline-none focus:border-accent transition-colors font-medium text-xs sm:text-sm"
                          />
                          <input 
                            type="text" 
                            placeholder="Sort Code (6 digits)"
                            className="w-full bg-paper border border-border px-4 sm:px-6 py-3 sm:py-4 focus:outline-none focus:border-accent transition-colors font-medium text-xs sm:text-sm"
                          />
                        </>
                      ) : (
                        <input 
                          type="text" 
                          placeholder="BTC Wallet Address"
                          className="w-full bg-paper border border-border px-4 sm:px-6 py-3 sm:py-4 focus:outline-none focus:border-accent transition-colors font-medium text-xs sm:text-sm"
                        />
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => onAuthRequired?.()}
                    className="w-full bg-ink text-paper font-bold text-lg sm:text-xl py-6 sm:py-8 uppercase tracking-[0.2em] hover:bg-accent transition-all shadow-2xl shadow-accent/10 flex items-center justify-center gap-3 sm:gap-4"
                  >
                    Confirm Exchange
                    <ArrowUpRight size={24} className="sm:w-7 sm:h-7" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
