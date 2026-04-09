import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, ChevronLeft } from 'lucide-react';

interface SignInProps {
  onBack: () => void;
  onSignUp: () => void;
  onForgotPassword: () => void;
}

export default function SignIn({ onBack, onSignUp, onForgotPassword }: SignInProps) {
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

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
                <input 
                  type="email" 
                  placeholder="name@example.com"
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
                  placeholder="••••••••"
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
