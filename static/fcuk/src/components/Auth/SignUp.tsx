import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowRight, ChevronLeft } from 'lucide-react';

interface SignUpProps {
  onBack: () => void;
  onSignIn: () => void;
  onSignUp: (user: any) => void;
}

export default function SignUp({ onBack, onSignIn, onSignUp }: SignUpProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email && password && name) {
      onSignUp({ name, email });
    }
  };

  const handleStripeLogin = () => {
    setIsLoading(true);
    // Emulate Stripe OAuth redirect
    setTimeout(() => {
      onSignUp({ name: 'Stripe Merchant', email: 'stripe@example.com' });
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
          <h2 className="text-4xl font-bold tracking-tighter">Register</h2>
          <p className="text-sm text-ink/50 font-medium">Start your AI affiliate journey today.</p>
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
                Register with Stripe
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
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-paper border border-border px-12 py-4 focus:outline-none focus:border-accent transition-colors font-medium"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
                  <input 
                    type="email" 
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-paper border border-border px-12 py-4 focus:outline-none focus:border-accent transition-colors font-medium"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-paper border border-border px-12 py-4 focus:outline-none focus:border-accent transition-colors font-medium"
                  />
                </div>
              </div>
            </div>

            <button className="w-full bg-ink text-paper font-bold py-5 uppercase tracking-widest text-sm hover:bg-accent transition-all flex items-center justify-center gap-3">
              Create Account
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
            Already have an account?{' '}
            <button 
              onClick={onSignIn}
              className="text-accent font-bold hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
