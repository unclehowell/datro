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
    <div className="min-h-screen pt-16 pb-8 bg-paper">
      <div className="max-w-[1800px] mx-auto px-4 mb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink/40 hover:text-accent transition-colors"
        >
          <ChevronLeft size={14} />
          Back to Home
        </button>
      </div>
    
      <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-border">
        <div className="p-4 sm:p-8 lg:p-12 border-r border-border bg-card flex flex-col justify-center space-y-4 lg:space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-8 lg:w-12 h-[1px] bg-accent" />
            <span className="text-[10px] lg:text-[11px] uppercase tracking-[0.3em] font-bold text-accent">FCUK Exchange</span>
          </div>
          <div className="space-y-2 lg:space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter leading-[0.9] text-ink">FCUK<br />Exchange</h1>
            <p className="text-sm lg:text-base text-ink/50 max-w-xl leading-relaxed font-medium">
              Convert your earned campaign credits (FCUK) into real GBP. Your earnings are generated through verified affiliate networks and paid directly to your UK bank account.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            <div className="p-4 lg:p-6 frame space-y-2 lg:space-y-3">
              <div className="text-accent font-mono text-[10px] lg:text-xs">01</div>
              <h3 className="font-bold text-sm lg:text-base tracking-tight">Balance</h3>
              <p className="text-lg lg:text-xl font-bold tracking-tighter">{balance.toFixed(2)} FCUK</p>
            </div>
            <div className="p-4 lg:p-6 frame space-y-2 lg:space-y-3">
              <div className="text-accent font-mono text-[10px] lg:text-xs">02</div>
              <h3 className="font-bold text-sm lg:text-base tracking-tight">Rate</h3>
              <p className="text-lg lg:text-xl font-bold tracking-tighter">£0.01 / 2.33</p>
            </div>
            <div className="p-4 lg:p-6 frame space-y-2 lg:space-y-3">
              <div className="text-accent font-mono text-[10px] lg:text-xs">03</div>
              <h3 className="font-bold text-sm lg:text-base tracking-tight">Payout</h3>
              <p className="text-lg lg:text-xl font-bold tracking-tighter">Instant</p>
            </div>
          </div>
        </div>
      
        <div className="p-4 sm:p-8 lg:p-12 bg-paper flex flex-col items-center justify-center space-y-4 lg:space-y-6">
          <div className="w-full max-w-2xl frame p-4 sm:p-6 lg:p-8 space-y-4 lg:space-y-6 shadow-2xl">
            <div className="space-y-3 lg:space-y-4">
              {/* Currency Selector */}
              <div className="flex gap-2 sm:gap-3">
                <button 
                  onClick={() => setCurrency('GBP')}
                  className={`flex-1 p-2 sm:p-3 border flex items-center justify-center gap-2 sm:gap-3 font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all ${currency === 'GBP' ? 'bg-ink text-paper border-ink' : 'bg-paper text-ink/40 border-border hover:border-accent'}`}
                >
                  <Banknote size={14} />
                  GBP
                </button>
                <button 
                  onClick={() => setCurrency('BTC')}
                  className={`flex-1 p-2 sm:p-3 border flex items-center justify-center gap-2 sm:gap-3 font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all ${currency === 'BTC' ? 'bg-ink text-paper border-ink' : 'bg-paper text-ink/40 border-border hover:border-accent'}`}
                >
                  <Bitcoin size={14} />
                  BTC
                </button>
              </div>
            
              <div className="space-y-2">
                <label className="text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.2em] text-ink/30">You Send ({fromLabel})</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-paper border border-border rounded-none px-3 sm:px-4 py-3 sm:py-4 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tighter focus:outline-none focus:border-accent transition-colors"
                  />
                  <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-accent text-paper flex items-center justify-center text-sm sm:text-base">
                      {isSwapped ? <span className="font-bold">£</span> : <Coins size={14} />}
                    </div>
                    <span className="font-bold text-base sm:text-lg tracking-tight">{fromLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          
            <div className="flex justify-center">
              <button 
                onClick={() => setIsSwapped(!isSwapped)}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-paper border border-border flex items-center justify-center text-accent hover:bg-accent hover:text-paper transition-all group"
              >
                <ArrowRightLeft size={18} className="group-hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>
          
            <div className="space-y-2">
              <label className="text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.2em] text-ink/30">You Receive ({toLabel})</label>
              <div className="relative">
                <div className="w-full bg-paper border border-border rounded-none px-3 sm:px-4 py-3 sm:py-4 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tighter text-ink/20">
                  {isSwapped ? '' : '£'}{calculateResult()}
                </div>
                <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-ink text-paper flex items-center justify-center text-sm sm:text-base">
                    {isSwapped ? <Coins size={14} /> : <span className="font-bold">£</span>}
                  </div>
                  <span className="font-bold text-base sm:text-lg tracking-tight">{toLabel}</span>
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
                className="space-y-4 overflow-hidden w-full"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink/30 flex items-center gap-2">
                      <ArrowUp size={12} className="text-red-500" />
                      Send Summary
                    </h4>
                    <table className="w-full text-xs font-medium border-collapse">
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="py-2 text-ink/40">Amount</td>
                          <td className="py-2 text-right">{amount} {fromLabel}</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 text-ink/40">Network Fee</td>
                          <td className="py-2 text-right text-green-500">0.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink/30 flex items-center gap-2">
                      <ArrowDown size={12} className="text-green-500" />
                      Receive Summary
                    </h4>
                    <table className="w-full text-xs font-medium border-collapse">
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="py-2 text-ink/40">Amount</td>
                          <td className="py-2 text-right">{calculateResult()} {toLabel}</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 text-ink/40">Processing</td>
                          <td className="py-2 text-right">Instant</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
            
                <div className="bg-paper border border-border p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <h4 className="font-bold text-sm sm:text-base tracking-tight flex items-center gap-2">
                    <Info size={16} className="text-accent" />
                    Recipient Details
                  </h4>
                  <div className="space-y-2">
                    {currency === 'GBP' ? (
                      <>
                        <input 
                          type="text" 
                          placeholder="Account Number (8 digits)"
                          className="w-full bg-paper border border-border px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:border-accent transition-colors font-medium text-xs sm:text-sm"
                        />
                        <input 
                          type="text" 
                          placeholder="Sort Code (6 digits)"
                          className="w-full bg-paper border border-border px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:border-accent transition-colors font-medium text-xs sm:text-sm"
                        />
                      </>
                    ) : (
                      <input 
                        type="text" 
                        placeholder="BTC Wallet Address"
                        className="w-full bg-paper border border-border px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:border-accent transition-colors font-medium text-xs sm:text-sm"
                      />
                    )}
                  </div>
                </div>
            
                <button 
                  onClick={() => onAuthRequired?.()}
                  className="w-full bg-ink text-paper font-bold text-base sm:text-lg py-4 sm:py-6 uppercase tracking-[0.2em] hover:bg-accent transition-all shadow-2xl shadow-accent/10 flex items-center justify-center gap-2 sm:gap-3"
                >
                  Confirm Exchange
                  <ArrowUpRight size={20} className="sm:w-6 sm:h-6" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
