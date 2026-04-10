import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, 
  Settings, 
  User, 
  Camera, 
  ChevronUp, 
  ChevronDown,
  Bell,
  Shield,
  CreditCard
} from 'lucide-react';

interface DashboardProps {
  onSignOut: () => void;
}

export default function Dashboard({ onSignOut }: DashboardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden z-[200]">
      {/* Full Screen Iframe */}
      <iframe 
        src="https://gui.datro.xyz" 
        className="w-full h-full border-none"
        title="Agent Dashboard"
        allow="camera; microphone; geolocation"
      />

      {/* Floating Menu - Bottom Left */}
      <div className="fixed bottom-8 left-8 z-[300]">
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="mb-4 w-64 bg-paper border border-border shadow-2xl p-4 space-y-2"
            >
              <div className="flex items-center gap-4 p-2 border-b border-border mb-4 pb-4">
                <div className="relative group">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent overflow-hidden">
                    <User size={24} />
                  </div>
                  <button className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity rounded-full">
                    <Camera size={14} />
                  </button>
                </div>
                <div>
                  <div className="font-bold text-sm">Demo User</div>
                  <div className="text-[10px] text-ink/40 uppercase font-bold tracking-widest">Active Agent</div>
                </div>
              </div>

              <button className="w-full flex items-center gap-3 p-3 hover:bg-card transition-colors text-sm font-bold text-ink/70">
                <Settings size={18} />
                Settings
              </button>
              <button className="w-full flex items-center gap-3 p-3 hover:bg-card transition-colors text-sm font-bold text-ink/70">
                <Bell size={18} />
                Notifications
              </button>
              <button className="w-full flex items-center gap-3 p-3 hover:bg-card transition-colors text-sm font-bold text-ink/70">
                <Shield size={18} />
                Security
              </button>
              <button className="w-full flex items-center gap-3 p-3 hover:bg-card transition-colors text-sm font-bold text-ink/70 border-b border-border pb-4 mb-2">
                <CreditCard size={18} />
                Billing
              </button>
              
              <button 
                onClick={onSignOut}
                className="w-full flex items-center gap-3 p-3 hover:bg-red-50 text-red-500 transition-colors text-sm font-bold"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-4 bg-ink text-paper px-6 py-4 shadow-2xl hover:bg-accent transition-all group"
        >
          <div className="w-8 h-8 bg-paper/10 rounded-full flex items-center justify-center">
            <User size={16} />
          </div>
          <span className="font-bold text-sm uppercase tracking-widest">Menu</span>
          {isMenuOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {/* Status Bar - Top Right Overlay */}
      <div className="fixed top-6 right-6 flex items-center gap-4 z-[300]">
        <div className="px-4 py-2 bg-paper/80 backdrop-blur-md border border-border text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          System Online
        </div>
      </div>
    </div>
  );
}
