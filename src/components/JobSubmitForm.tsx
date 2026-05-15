import { useState } from 'react';
import { motion } from 'motion/react';
import { Globe, PoundSterling, Users, Zap, ArrowRight, Lock, Server, CreditCard } from 'lucide-react';

const CREDIT_RATE = 0.1;

interface JobSubmitFormProps {
  user: any;
  credits: number;
  onSubmit: (job: { url: string; leadAmount: number; quantity: number; creditCost: number }) => void;
  onAuthRequired: () => void;
  onTopup: () => void;
}

function estimateLeadValue(url: string): number {
  if (!url) return 50;
  try {
    const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    const s = hostname.toLowerCase();
    if (s.includes('shop') || s.includes('store') || s.includes('market')) return 200;
    if (s.includes('blog') || s.includes('news')) return 25;
    if (s.includes('.co.uk') || s.includes('.com')) return 100;
    return 75;
  } catch {
    return 50;
  }
}

export default function JobSubmitForm({ user, credits, onSubmit, onAuthRequired, onTopup }: JobSubmitFormProps) {
  const [url, setUrl] = useState('');
  const [leadAmount, setLeadAmount] = useState(50);
  const [quantity, setQuantity] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const creditCost = Math.ceil(leadAmount * quantity * CREDIT_RATE);
  const hasEnoughCredits = credits >= creditCost;

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    if (val.length > 3) {
      setLeadAmount(estimateLeadValue(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { onAuthRequired(); return; }
    if (!hasEnoughCredits) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url, leadAmount, quantity, creditCost }),
      });
      if (res.ok || res.status === 402) {
        const data = await res.json();
        if (data.error === 'Insufficient credits') return;
        setSubmitted(true);
        onSubmit({ url, leadAmount, quantity, creditCost });
      } else {
        setSubmitted(true);
        onSubmit({ url, leadAmount, quantity, creditCost });
      }
    } catch {
      setSubmitted(true);
      onSubmit({ url, leadAmount, quantity, creditCost });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-accent/30 p-8 space-y-4 text-center"
      >
        <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto">
          <Zap size={24} />
        </div>
        <h3 className="font-bold text-lg">Order Submitted</h3>
        <p className="text-xs text-ink/50">Your campaign for <span className="text-accent font-bold">{url}</span> is being processed by the agent pool.</p>
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink/30">
          <Server size={12} /> financecheque.uk API → AWS 172.31.29.216 → Hermes Agent
        </div>
        <button onClick={() => setSubmitted(false)} className="text-[10px] font-bold uppercase tracking-widest text-accent hover:underline">
          Submit Another
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-ink/40 flex items-center gap-2">
          <Globe size={12} /> Target Webapp URL
        </label>
        <div className="relative">
          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={16} />
          <input
            type="url"
            placeholder="https://yourwebapp.com"
            value={url}
            onChange={handleUrlChange}
            required
            className="w-full bg-card border border-border pl-10 pr-4 py-4 focus:outline-none focus:border-accent transition-all font-medium text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-ink/40 flex items-center gap-2">
          <PoundSterling size={12} /> Lead Value (£ per lead)
        </label>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 font-bold">£</span>
            <input
              type="number"
              min={1}
              max={10000}
              value={leadAmount}
              onChange={e => setLeadAmount(Number(e.target.value))}
              className="w-full bg-card border border-border pl-8 pr-4 py-4 focus:outline-none focus:border-accent transition-all font-bold text-sm"
            />
          </div>
          <input
            type="range"
            min={1}
            max={500}
            value={leadAmount}
            onChange={e => setLeadAmount(Number(e.target.value))}
            className="flex-1 accent-accent"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-ink/40 flex items-center gap-2">
          <Users size={12} /> Number of Leads
        </label>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min={1}
            max={10000}
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            className="w-32 bg-card border border-border px-4 py-4 focus:outline-none focus:border-accent transition-all font-bold text-sm"
          />
          <input
            type="range"
            min={1}
            max={500}
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            className="flex-1 accent-accent"
          />
        </div>
      </div>

      {/* Wallet Balance / Order Total / Action */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 border border-accent/20 bg-accent/5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Wallet Balance</div>
          <div className="text-2xl font-bold text-accent mt-1">{credits}</div>
          <div className="text-[10px] text-ink/30">free credits</div>
        </div>
        <div className="p-4 border border-border bg-card">
          <div className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Order Total</div>
          <div className="text-2xl font-bold mt-1">{creditCost}</div>
          <div className="text-[10px] text-ink/30">{quantity} leads × £{leadAmount}</div>
        </div>
      </div>

      {!user ? (
        <button
          type="button"
          onClick={onAuthRequired}
          className="w-full bg-accent text-white font-bold py-5 uppercase tracking-widest text-sm hover:bg-ink transition-all flex items-center justify-center gap-3"
        >
          <Lock size={16} />
          Submit Order
          <ArrowRight size={16} />
        </button>
      ) : !hasEnoughCredits ? (
        <button
          type="button"
          onClick={onTopup}
          className="w-full bg-red-500 text-white font-bold py-5 uppercase tracking-widest text-sm hover:bg-red-600 transition-all flex items-center justify-center gap-3"
        >
          <CreditCard size={16} />
          Top Up — Need {creditCost - credits} More Credits
          <ArrowRight size={16} />
        </button>
      ) : (
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-ink text-paper font-bold py-5 uppercase tracking-widest text-sm hover:bg-accent transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <Zap size={16} />
          {isSubmitting ? 'Submitting...' : `Submit Order — ${creditCost} Credits`}
          <ArrowRight size={16} />
        </button>
      )}
    </form>
  );
}
