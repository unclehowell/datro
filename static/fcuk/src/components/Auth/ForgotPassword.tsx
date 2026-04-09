import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowRight, ChevronLeft } from 'lucide-react';

interface ForgotPasswordProps {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-md frame p-12 space-y-10 shadow-2xl bg-card">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink/40 hover:text-ink transition-colors"
        >
          <ChevronLeft size={14} />
          Back to Sign In
        </button>

        <div className="space-y-4">
          <h2 className="text-4xl font-bold tracking-tighter">Reset Password</h2>
          <p className="text-sm text-ink/50 font-medium">
            {submitted 
              ? "Check your email for reset instructions." 
              : "Enter your email to receive a reset link."}
          </p>
        </div>

        {!submitted ? (
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  className="w-full bg-paper border border-border px-12 py-4 focus:outline-none focus:border-accent transition-colors font-medium"
                  required
                />
              </div>
            </div>

            <button className="w-full bg-ink text-paper font-bold py-5 uppercase tracking-widest text-sm hover:bg-accent transition-all flex items-center justify-center gap-3">
              Send Reset Link
              <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <button 
            onClick={onBack}
            className="w-full bg-ink text-paper font-bold py-5 uppercase tracking-widest text-sm hover:bg-accent transition-all"
          >
            Return to Sign In
          </button>
        )}
      </div>
    </div>
  );
}
