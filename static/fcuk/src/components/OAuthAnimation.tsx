import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, CheckCircle2, ArrowRight, MousePointer2, Coins } from 'lucide-react';

export default function OAuthAnimation() {
  const [step, setStep] = useState(0);
  const [showCoins, setShowCoins] = useState(false);

  // Play sound effect (simulated with a function)
  const playMoneySound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {}); // Catch browser blocking audio
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(prev => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (step === 4) {
      setShowCoins(true);
      playMoneySound();
      const t = setTimeout(() => setShowCoins(false), 2000);
      return () => clearTimeout(t);
    }
  }, [step]);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square bg-card border border-border rounded-3xl overflow-hidden shadow-2xl shadow-accent/5">
      {/* Browser Header */}
      <div className="bg-paper border-b border-border px-4 py-3 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-card border border-border rounded-md px-3 py-1 text-[10px] text-ink/40 font-mono truncate">
          {step === 2 ? 'accounts.google.com/signin' : 'financecheque.uk/oauth'}
        </div>
      </div>

      <div className="relative h-full p-8 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center space-y-6"
            >
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto text-accent">
                <Mail size={32} />
              </div>
              <h3 className="text-xl font-semibold">Connect Gmail</h3>
              <p className="text-sm text-ink/60">Empower your agent with email access</p>
              <div className="relative inline-block">
                <button className="bg-accent text-white px-6 py-2.5 rounded-full text-sm font-medium flex items-center gap-2">
                  Connect Now
                  <ArrowRight size={16} />
                </button>
                <motion.div
                  animate={{ x: [0, 20, 0], y: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-4 -right-4 text-accent"
                >
                  <MousePointer2 size={24} fill="currentColor" />
                </motion.div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-4"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white">G</div>
                <span className="font-medium">Sign in with Google</span>
              </div>
              <div className="space-y-4">
                <div className="h-10 bg-card border border-border rounded-md px-3 flex items-center text-xs text-ink/40">
                  Email or phone
                </div>
                <div className="h-10 bg-accent text-paper rounded-md flex items-center justify-center text-sm font-medium">
                  Next
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 rounded-full border-4 border-accent border-t-transparent animate-spin mx-auto" />
              <p className="text-sm font-medium">Authenticating...</p>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-xl font-semibold">Success!</h3>
              <p className="text-sm text-ink/60">Gmail connected successfully</p>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-8"
            >
              <div className="relative">
                <div className="w-24 h-24 bg-accent rounded-3xl flex items-center justify-center mx-auto text-paper shadow-xl shadow-accent/20">
                  <Coins size={48} />
                </div>
                {showCoins && (
                  <div className="absolute inset-0">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 1, y: 0, x: 0 }}
                        animate={{ 
                          opacity: 0, 
                          y: -100 - Math.random() * 100,
                          x: (Math.random() - 0.5) * 200
                        }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute top-1/2 left-1/2 text-accent"
                      >
                        <Coins size={24} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-accent">+100 FCUK</h3>
                <p className="text-sm text-ink/60">Credits deposited to wallet</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Dots */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
        {[0, 1, 2, 3, 4].map(i => (
          <div 
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${step === i ? 'bg-accent w-4' : 'bg-border'}`}
          />
        ))}
      </div>
    </div>
  );
}
