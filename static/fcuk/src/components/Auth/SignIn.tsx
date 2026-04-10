import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Lock, ArrowRight, ChevronLeft, ShieldCheck } from 'lucide-react';

interface SignInProps {
  onBack: () => void;
  onSignIn: (user: any) => void;
}

export default function SignIn({ onBack, onSignIn }: SignInProps) {
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!passphrase) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('https://ui.financecheque.uk/api/login', {
        method: 'POST',
        body: JSON.stringify({ password: passphrase }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        // Successful login
        onSignIn({ name: 'Authorized User', email: 'user@financecheque.uk' });
      } else {
        setError('Incorrect passphrase. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Please check your network.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-6 bg-black/5">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-paper border border-border p-10 space-y-8 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-accent/10 text-accent flex items-center justify-center rounded-full">
            <ShieldCheck size={32} />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-ink">Secure Unlock</h2>
            <p className="text-xs text-ink/40 font-bold uppercase tracking-widest">Enter Passphrase</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
              <input 
                type="password" 
                placeholder="••••••••"
                value={passphrase}
                onChange={(e) => {
                  setPassphrase(e.target.value);
                  setError('');
                }}
                className="w-full bg-card border border-border px-12 py-4 focus:outline-none focus:border-accent transition-all font-mono text-lg"
                autoFocus
              />
            </div>
            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center"
              >
                {error}
              </motion.p>
            )}
          </div>

          <button 
            disabled={isLoading || !passphrase}
            className="w-full bg-ink text-paper font-bold py-5 uppercase tracking-widest text-sm hover:bg-accent transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Unlocking...' : 'Unlock Dashboard'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="pt-6 border-t border-border flex flex-col items-center gap-4">
          <button 
            onClick={onBack}
            className="text-[10px] font-bold uppercase tracking-widest text-ink/40 hover:text-ink transition-colors flex items-center gap-2"
          >
            <ChevronLeft size={14} />
            Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
