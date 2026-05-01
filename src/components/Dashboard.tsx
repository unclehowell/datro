import { useState, useEffect, useRef } from 'react';
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
  CreditCard,
  Link2,
  Share2,
  Mail,
  Globe,
  Wallet,
  Menu,
  ChevronRight,
  Facebook,
  Twitter,
  Instagram,
  Banknote,
  Smartphone,
  RotateCw,
  X,
  ArrowRight,
  Lock,
  CheckCircle2,
  Search,
  Zap,
  MessageCircle,
  Send,
  PhoneOff
} from 'lucide-react';

interface DashboardProps {
  onSignOut: () => void;
  onClose?: () => void;
  variant?: 'mobile' | 'full';
  forceConnect?: boolean;
  onConnectAttempt?: () => void;
  onAuthorize?: (amount: number) => void;
  onNavigate?: (page: string) => void;
  onAuthRequired?: () => void;
  initialBalance?: number;
  guideStep?: number;
  onGuideStepChange?: (step: number) => void;
  reloadKey?: number;
}

export default function Dashboard({ 
  onSignOut, 
  onClose,
  variant = 'full', 
  forceConnect = false,
  onConnectAttempt,
  onAuthorize,
  onNavigate,
  onAuthRequired,
  initialBalance,
  guideStep,
  onGuideStepChange,
  reloadKey
}: DashboardProps) {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [walletBalance, setWalletBalance] = useState(initialBalance ?? 0.00);
  const [tourStep, setTourStep] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (forceConnect && onConnectAttempt) {
      onConnectAttempt();
    }
  }, [forceConnect]);

  useEffect(() => {
    // Initialize audio - Bank app notification sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3');
    
    // Start tour after 2 seconds
    const timer = setTimeout(() => {
      setTourStep(1);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const playSuccessSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const connectionCategories = [
    {
      id: 'social',
      name: 'Social Media',
      icon: <Share2 size={16} />,
      items: [
        { name: 'Meta', icon: <Facebook size={14} /> },
        { name: 'X.com', icon: <Twitter size={14} /> },
        { name: 'Instagram', icon: <Instagram size={14} /> }
      ]
    },
    {
      id: 'email',
      name: 'Email',
      icon: <Mail size={16} />,
      items: [
        { name: 'Gmail', icon: <Mail size={14} /> },
        { name: 'Zoho Mail', icon: <Mail size={14} /> }
      ]
    },
    {
      id: 'blog',
      name: 'Blog',
      icon: <Globe size={16} />,
      items: [
        { name: 'WordPress', icon: <Globe size={14} /> },
        { name: 'Medium', icon: <Globe size={14} /> }
      ]
    },
    {
      id: 'banking',
      name: 'Banking',
      icon: <Banknote size={16} />,
      items: [
        { name: 'Revolut', icon: <Banknote size={14} /> },
        { name: 'Monzo', icon: <Banknote size={14} /> }
      ]
    }
  ];

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {variant === 'full' ? (
        <div className="flex-1 bg-black relative">
          <iframe 
            key={reloadKey}
            src="https://ui.financecheque.uk" 
            className="w-full h-full border-none"
            title="Agent Dashboard"
            allow="geolocation"
          />
          
          {/* Floating Menu Removed */}
        </div>
      ) : (
        <div className="fixed inset-0 top-24 bg-black/95 backdrop-blur-md flex items-center justify-center overflow-hidden p-4 md:p-8 z-[300]">
          <div className="w-full max-w-[66%] h-full relative flex items-center justify-center">
            {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, var(--border) 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }} />

            <motion.div 
              layout
              initial={false}
              animate={{ 
                width: orientation === 'portrait' ? 'min(380px, 100%)' : 'min(800px, 100%)',
                height: orientation === 'portrait' ? 'min(780px, 90vh)' : 'min(500px, 90vh)'
              }}
              className="relative bg-[#1a1a1a] rounded-[2rem] border-[12px] border-[#333] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
            >
              {/* Tablet Camera/Sensor */}
              <div className={`absolute ${orientation === 'portrait' ? 'top-4 left-1/2 -translate-x-1/2 w-16 h-1.5' : 'left-4 top-1/2 -translate-y-1/2 w-1.5 h-16'} bg-[#333] rounded-full z-50`} />

            {/* Browser Header */}
            <div className="h-14 bg-[#222] border-b border-white/5 flex items-end px-6 pb-2 gap-4">
              <div className="flex-1 bg-black/40 rounded-lg h-8 flex items-center px-4 gap-2">
                <Lock size={10} className="text-green-500" />
                <span className="text-[10px] text-white/40 font-medium truncate">ui.financecheque.uk</span>
              </div>
            </div>

            {/* Iframe Content */}
            <div className="flex-1 relative bg-black">
              <iframe 
                key={reloadKey}
                src="https://ui.financecheque.uk" 
                className="w-full h-full border-none"
                title="Agent Dashboard"
                allow="geolocation"
              />
            </div>

            {/* Home Indicator */}
            <div className="h-8 bg-[#1a1a1a] flex items-center justify-center">
              <div className="w-32 h-1.5 bg-white/10 rounded-full" />
            </div>
          </motion.div>

          {/* External Controls */}
          <div className="fixed top-32 right-8 flex flex-col gap-4 z-[400]">
            {variant !== 'mobile' ? (
              <button 
                onClick={onSignOut}
                className="w-14 h-14 bg-red-500 border border-white/20 flex items-center justify-center text-white hover:bg-red-600 transition-all shadow-xl rounded-full"
                title="Exit Demo"
              >
                <PhoneOff size={24} />
              </button>
            ) : (
              onClose && (
                <button 
                  onClick={onClose}
                  className="w-14 h-14 bg-red-500 border border-white/20 flex items-center justify-center text-white hover:bg-red-600 transition-all shadow-xl rounded-full"
                  title="Close Agent"
                >
                  <PhoneOff size={24} />
                </button>
              )
            )}
          </div>
        </div>
      </div>
      )}

      {/* Simulated OAuth Modal Removed - Handled by App.tsx */}

      {/* Reward Notification */}
      <AnimatePresence>
        {tourStep === 3 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-12 right-12 bg-green-500 text-paper p-6 shadow-2xl flex items-center gap-6 z-[600]"
          >
            <div className="w-12 h-12 bg-white/20 flex items-center justify-center rounded-full">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Connection Successful</div>
              <div className="text-xl font-bold">Credits Deposited to Wallet</div>
            </div>
            <button onClick={() => setTourStep(4)} className="p-2 hover:bg-white/10 rounded-full">
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
