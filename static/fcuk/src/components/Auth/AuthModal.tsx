import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, X, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
  onNavigate: (page: any) => void;
  initialTab?: 'signin' | 'signup';
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess, onNavigate, initialTab = 'signin' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialTab);
  const [isDemo, setIsDemo] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDemoToggle = (checked: boolean) => {
    setIsDemo(checked);
    if (checked) {
      setEmail('demo');
      setPassword('demo');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate auth
    setTimeout(() => {
      if (isDemo) {
        onAuthSuccess({ name: 'Demo User', email: 'demo' });
      } else if (email && password) {
        onAuthSuccess({ name: email.split('@')[0], email });
      } else {
        setError('Please fill in all fields');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-[106px] left-0 right-0 bottom-0 z-[1000] flex items-start justify-center p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="w-full max-w-md bg-paper border border-border p-10 space-y-8 shadow-2xl relative my-8"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-ink/20 hover:text-ink transition-colors"
            >
              <X size={24} />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-accent/10 text-accent flex items-center justify-center rounded-full">
                <ShieldCheck size={24} />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-ink">
                  {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
                </h2>
                <p className="text-[10px] text-ink/40 font-bold uppercase tracking-widest">Secure Access Portal</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-card border border-border rounded-lg">
              <button 
                onClick={() => setActiveTab('signin')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded ${activeTab === 'signin' ? 'bg-ink text-paper shadow-lg' : 'text-ink/40 hover:text-ink'}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded ${activeTab === 'signup' ? 'bg-ink text-paper shadow-lg' : 'text-ink/40 hover:text-ink'}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30">
                    {isDemo ? 'Demo Username' : 'Email Address / Username'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
                    <input 
                      type="text" 
                      placeholder={isDemo ? 'demo' : 'name@example.com'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-card border border-border px-12 py-4 focus:outline-none focus:border-accent transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30">
                    {isDemo ? 'Demo Password' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-card border border-border px-12 py-4 focus:outline-none focus:border-accent transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Demo Checkbox */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={isDemo}
                      onChange={(e) => handleDemoToggle(e.target.checked)}
                      className="peer appearance-none w-5 h-5 border border-border bg-card rounded transition-all checked:bg-accent checked:border-accent"
                    />
                    <div className="absolute opacity-0 peer-checked:opacity-100 pointer-events-none text-white">
                      <ArrowRight size={12} className="rotate-[-45deg]" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40 group-hover:text-ink transition-colors">
                    Demo Account
                  </span>
                </label>
              </div>

              {error && (
                <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">{error}</p>
              )}

              <button 
                disabled={isLoading}
                className="w-full bg-ink text-paper font-bold py-5 uppercase tracking-widest text-sm hover:bg-accent transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : activeTab === 'signin' ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </button>

              {activeTab === 'signin' && (
                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => { onClose(); onNavigate('forgot-password'); }}
                    className="text-[10px] font-bold uppercase tracking-widest text-ink/40 hover:text-accent transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </form>

            <div className="pt-6 border-t border-border text-center">
              <p className="text-[10px] text-ink/30 font-bold uppercase tracking-widest leading-relaxed">
                By continuing, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
