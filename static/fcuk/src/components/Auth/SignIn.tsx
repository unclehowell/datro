import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, ChevronLeft } from 'lucide-react';

interface SignInProps {
  onBack: () => void;
  onSignUp: () => void;
  onForgotPassword: () => void;
  onSignIn: (user: any) => void;
}

export default function SignIn({ onBack, onSignUp, onForgotPassword, onSignIn }: SignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email === 'demo' && password === 'demo') {
      onSignIn({ name: 'Demo User', email: 'demo@example.com' });
    } else {
      // For demo purposes, any login works if it's not empty
      if (email && password) {
        onSignIn({ name: email.split('@')[0], email });
      }
    }
  };

  const handleStripeLogin = () => {
    setIsLoading(true);
    // Emulate Stripe OAuth redirect
    setTimeout(() => {
      onSignIn({ name: 'Stripe Merchant', email: 'stripe@example.com' });
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-md frame p-12 space-y-10 shadow-2xl bg-card">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink/40 hover:text-ink transition-colors"
        >
          <ChevronLeft size={14} />
          Back to Home
        </button>

        <div className="space-y-4">
          <h2 className="text-4xl font-bold tracking-tighter">Sign In</h2>
          <p className="text-sm text-ink/50 font-medium">Access your AI agent dashboard.</p>
        </div>

        <div className="space-y-6">
          <button 
            onClick={handleStripeLogin}
            disabled={isLoading}
            className="w-full bg-[#635BFF] text-white font-bold py-5 uppercase tracking-widest text-sm hover:bg-[#5249E0] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Sign in with Stripe
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-card px-4 text-ink/30">Or continue with email</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
                  <input 
                    type="text" 
                    placeholder="demo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-paper border border-border px-12 py-4 focus:outline-none focus:border-accent transition-colors font-medium"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30">Password</label>
                  <button 
                    type="button"
                    onClick={onForgotPassword}
                    className="text-[10px] font-bold uppercase tracking-widest text-accent hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
                  <input 
                    type="password" 
                    placeholder="demo"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-paper border border-border px-12 py-4 focus:outline-none focus:border-accent transition-colors font-medium"
                  />
                </div>
              </div>
            </div>

            <button className="w-full bg-ink text-paper font-bold py-5 uppercase tracking-widest text-sm hover:bg-accent transition-all flex items-center justify-center gap-3">
              Sign In
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="p-4 bg-paper border border-border space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-accent">Demo Credentials</div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-ink/40">Username:</span>
              <span className="text-ink">demo</span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-ink/40">Password:</span>
              <span className="text-ink">demo</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center">
          <p className="text-sm text-ink/50 font-medium">
            Don't have an account?{' '}
            <button 
              onClick={onSignUp}
              className="text-accent font-bold hover:underline"
            >
              Register Now
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
