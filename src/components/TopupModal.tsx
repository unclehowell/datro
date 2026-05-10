import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const TOPUP_PACKAGES = [
  { id: 'starter', credits: 100, price: 9.99, label: 'Starter', popular: false },
  { id: 'pro', credits: 350, price: 29.99, label: 'Pro', popular: true },
  { id: 'enterprise', credits: 1500, price: 99.99, label: 'Enterprise', popular: false },
];

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: number;
  onSuccess?: (credits: number) => void;
}

export default function TopupModal({ isOpen, onClose, currentCredits, onSuccess }: TopupModalProps) {
  const [selected, setSelected] = useState('pro');
  const [isLoading, setIsLoading] = useState(false);

  const pkg = TOPUP_PACKAGES.find(p => p.id === selected)!;

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch('/api/stripe?action=topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packageId: selected }),
      });
      const { id, error } = await res.json();
      if (error) throw new Error(error);
      const stripe = await stripePromise;
      if (stripe) {
        await (stripe as any).redirectToCheckout({ sessionId: id });
      }
    } catch (err) {
      console.error('Topup failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="w-full max-w-md bg-paper border border-border p-8 space-y-6 shadow-2xl relative"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-ink/20 hover:text-ink transition-colors">
              <X size={20} />
            </button>

            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight">Top Up Credits</h2>
              <p className="text-[10px] text-ink/40 font-bold uppercase tracking-widest">Current balance: {currentCredits} credits</p>
            </div>

            <div className="space-y-3">
              {TOPUP_PACKAGES.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`w-full flex items-center justify-between p-4 border transition-all ${selected === p.id ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selected === p.id ? 'bg-accent text-white' : 'bg-card text-ink/40'}`}>
                      <Zap size={14} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{p.label}</span>
                        {p.popular && <span className="text-[8px] font-bold uppercase tracking-widest bg-accent text-white px-2 py-0.5">Popular</span>}
                      </div>
                      <div className="text-[10px] text-ink/40">{p.credits} credits</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">£{p.price}</div>
                    <div className="text-[10px] text-ink/40">£{(p.price / p.credits).toFixed(3)}/credit</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 bg-accent/5 border border-accent/20 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-ink/40">After top-up</div>
                <div className="text-xl font-bold text-accent">{currentCredits + pkg.credits} credits</div>
              </div>
              <CheckCircle2 size={24} className="text-accent" />
            </div>

            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full bg-ink text-paper font-bold py-4 uppercase tracking-widest text-sm hover:bg-accent transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoading ? 'Redirecting...' : `Pay £${pkg.price} — Get ${pkg.credits} Credits`}
              <ArrowRight size={16} />
            </button>

            <p className="text-[10px] text-ink/30 text-center">Secure payment via Stripe. Credits added instantly on payment confirmation.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
