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
  CheckCircle2
} from 'lucide-react';

interface DashboardProps {
  onSignOut: () => void;
  onClose?: () => void;
  variant?: 'mobile' | 'full';
  forceConnect?: boolean;
  onConnectAttempt?: () => void;
  onAuthorize?: (amount: number) => void;
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
  initialBalance,
  guideStep,
  onGuideStepChange,
  reloadKey
}: DashboardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWalletNotice, setShowWalletNotice] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [walletBalance, setWalletBalance] = useState(initialBalance ?? 1240.50);
  const [tourStep, setTourStep] = useState(0);
  const [activeOAuth, setActiveOAuth] = useState<{ platform: string, icon: any } | null>(null);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (forceConnect) {
      setActiveOAuth({ platform: 'Facebook', icon: <Facebook size={14} /> });
      setTourStep(0);
    }
  }, [forceConnect]);

  useEffect(() => {
    // Initialize audio - Money/Coin sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1071/1071-preview.mp3');
    
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

  const handleConnect = (platform: string, icon: any) => {
    if (variant === 'mobile' && onConnectAttempt && !forceConnect) {
      onConnectAttempt();
      return;
    }
    setActiveOAuth({ platform, icon });
    setTourStep(0); // Hide tour during OAuth
    if (guideStep === 3 && platform === 'Gmail') onGuideStepChange?.(4);
  };

  const completeOAuth = () => {
    setIsOAuthLoading(true);
    if (guideStep === 5) onGuideStepChange?.(6);
    setTimeout(() => {
      const reward = parseFloat((Math.random() * (5 - 1.75) + 1.75).toFixed(2));
      if (onAuthorize) {
        onAuthorize(reward);
      }
      setWalletBalance(prev => prev + reward);
      playSuccessSound();
      setIsOAuthLoading(false);
      setActiveOAuth(null);
      setHasInteracted(true);
      // Show reward notification
      setTourStep(3);
    }, 1500);
  };

  const connectionCategories = [
    {
      id: 'social',
      name: 'Social Media',
      icon: <Share2 size={16} />,
      items: [
        { name: 'Facebook', icon: <Facebook size={14} /> },
        { name: 'Twitter', icon: <Twitter size={14} /> },
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

  const renderMenuContent = () => (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="mt-12 w-64 bg-paper border border-border shadow-2xl p-4 space-y-2 max-h-[60vh] overflow-y-auto rounded-2xl absolute right-0"
    >
      <div className="flex items-center gap-3 p-1.5 border-b border-border mb-2 pb-2">
        <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center text-accent overflow-hidden">
          <User size={16} />
        </div>
        <div>
          <div className="font-bold text-[10px] text-ink">Demo User</div>
          <div className="text-[7px] text-ink/40 uppercase font-bold tracking-widest">Active Agent</div>
        </div>
      </div>

      {(variant === 'full' || hasInteracted) && (
        <>
          <div className="flex items-center justify-between p-2 bg-accent/5 border border-accent/10 mb-1.5 rounded-lg">
            <div className="flex items-center gap-2 text-accent">
              <Wallet size={12} />
              <span className="text-[7px] font-bold uppercase tracking-widest">Wallet</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[10px] text-ink">£{walletBalance.toLocaleString()}</span>
              <button 
                onClick={() => setShowWalletNotice(!showWalletNotice)}
                className="relative p-0.5 text-accent hover:bg-accent/10 rounded-full transition-colors"
              >
                <Bell size={10} />
                <span className="absolute top-0 right-0 w-1 h-1 bg-red-500 rounded-full border border-paper" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showWalletNotice && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 bg-red-50 text-[8px] font-bold text-red-600 border border-red-100 mb-2 leading-tight rounded-lg">
                  Connect Gmail to your A.I agent for 5 FCUK credits.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <div className="space-y-1">
        <div className="px-3 py-1 text-[8px] font-bold uppercase tracking-widest text-ink/30">Connections</div>
        {connectionCategories.map((category) => (
          <div key={category.id} className="space-y-1">
            <button 
              onClick={() => {
                setExpandedCategory(expandedCategory === category.id ? null : category.id);
                if (tourStep === 2) setTourStep(0); 
              }}
              className="w-full flex items-center justify-between p-1.5 hover:bg-card transition-colors text-[10px] font-bold text-ink/70 rounded-lg"
            >
              <div className="flex items-center gap-2">
                {category.icon}
                {category.name}
              </div>
              {expandedCategory === category.id ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            </button>
            <AnimatePresence>
              {expandedCategory === category.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pl-5 space-y-0.5"
                >
                  {category.items.map((item) => (
                    <div key={item.name} className="relative">
                      <button 
                        onClick={() => handleConnect(item.name, item.icon)}
                        className="w-full flex items-center gap-2 p-1.5 hover:bg-accent/5 transition-colors text-[9px] font-medium text-ink/50 hover:text-accent rounded-lg"
                      >
                        {item.icon}
                        Connect {item.name}
                      </button>
                      {guideStep === 3 && item.name === 'Gmail' && (
                        <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-[10px] font-bold animate-bounce">3</div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="h-[1px] bg-border my-1.5" />
      <button onClick={onSignOut} className="w-full flex items-center gap-2 p-1.5 hover:bg-red-50 text-red-500 transition-colors text-[10px] font-bold rounded-lg">
        <LogOut size={14} />
        Sign Out
      </button>
    </motion.div>
  );

  const renderMenuTrigger = (isSmall = false) => (
    <div className="relative">
      <button 
        onClick={() => {
          setIsMenuOpen(!isMenuOpen);
          if (tourStep === 1) setTourStep(2);
          if (guideStep === 2) onGuideStepChange?.(3);
        }}
        className={`${isSmall ? 'px-3 py-1.5' : 'px-6 py-3'} bg-paper/80 backdrop-blur-md border border-border text-xs font-bold uppercase tracking-[0.1em] flex items-center gap-3 rounded-full hover:bg-accent hover:text-paper transition-all ${guideStep === 2 && variant === 'mobile' ? 'animate-glow ring-2 ring-accent' : ''}`}
      >
        {(variant === 'full' || hasInteracted) ? (
          <>
            <div className={`flex items-center gap-2 border-r border-border ${isSmall ? 'pr-3' : 'pr-4'}`}>
              <div className={`${isSmall ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-green-500 rounded-full animate-pulse`} />
              Online
            </div>
            <div 
              className="flex items-center gap-2 text-accent group-hover:text-paper"
              onClick={(e) => {
                if (variant === 'mobile' || hasInteracted) {
                  e.stopPropagation();
                  alert('Sign in or Register to withdraw funds');
                }
              }}
            >
              <Wallet size={isSmall ? 10 : 14} />
              £{walletBalance.toLocaleString()}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Menu size={isSmall ? 12 : 16} />
            Menu
          </div>
        )}
      </button>
    </div>
  );

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
                width: orientation === 'portrait' ? '380px' : '800px',
                height: orientation === 'portrait' ? 'min(780px, 85vh)' : 'min(500px, 85vh)'
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

              {/* Floating Menu Removed */}
            </div>

            {/* Home Indicator */}
            <div className="h-8 bg-[#1a1a1a] flex items-center justify-center">
              <div className="w-32 h-1.5 bg-white/10 rounded-full" />
            </div>
          </motion.div>

          {/* External Controls */}
          <div className="fixed top-32 right-8 flex flex-col gap-4 z-[400]">
            <button 
              onClick={() => setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait')}
              className="w-14 h-14 bg-paper border border-border flex items-center justify-center text-ink hover:bg-accent hover:text-paper transition-all shadow-xl rounded-full"
              title="Rotate Device"
            >
              <RotateCw size={24} className={orientation === 'landscape' ? 'rotate-90' : ''} />
            </button>
            {variant !== 'mobile' ? (
              <button 
                onClick={onSignOut}
                className="w-14 h-14 bg-paper border border-border flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-paper transition-all shadow-xl rounded-full"
                title="Exit Demo"
              >
                <X size={24} />
              </button>
            ) : (
              onClose && (
                <button 
                  onClick={onClose}
                  className="w-14 h-14 bg-paper border border-border flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-paper transition-all shadow-xl rounded-full"
                  title="Close Agent"
                >
                  <X size={24} />
                </button>
              )
            )}
          </div>
        </div>
      </div>
      )}

      {/* Simulated OAuth Modal */}
      <AnimatePresence>
        {activeOAuth && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-paper border border-border p-10 space-y-8 shadow-2xl frame"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 relative">
                  <div className="w-12 h-12 bg-accent/10 text-accent flex items-center justify-center rounded-xl">
                    {activeOAuth.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-ink">Connect {activeOAuth.platform}</h3>
                    <p className="text-[10px] text-ink/40 uppercase font-bold tracking-widest">Grant Agent Permissions</p>
                  </div>
                  {guideStep === 4 && (
                    <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-[10px] font-bold animate-bounce">4</div>
                  )}
                </div>
                <button onClick={() => setActiveOAuth(null)} className="text-ink/20 hover:text-ink">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-accent/5 border border-accent/10 space-y-4">
                  <div className="flex items-center gap-3 text-accent">
                    <Shield size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Secure Connection</span>
                  </div>
                  <p className="text-xs text-ink/60 leading-relaxed">
                    This agent requires permission to analyze your {activeOAuth.platform} distribution footprint to optimize affiliate campaigns.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30">Username</label>
                    <input 
                      type="text" 
                      value="demo" 
                      readOnly 
                      className="w-full bg-card border border-border px-4 py-3 text-sm font-medium focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30">Password</label>
                    <input 
                      type="password" 
                      value="demo" 
                      readOnly 
                      className="w-full bg-card border border-border px-4 py-3 text-sm font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div className="relative">
                  <button 
                    onClick={() => {
                      completeOAuth();
                      if (guideStep === 5) onGuideStepChange?.(6);
                    }}
                    disabled={isOAuthLoading}
                    className="w-full bg-ink text-paper font-bold py-5 uppercase tracking-widest text-sm hover:bg-accent transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isOAuthLoading ? (
                      <div className="w-5 h-5 border-2 border-paper/30 border-t-paper rounded-full animate-spin" />
                    ) : (
                      <>
                        Authorize Agent
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                  {guideStep === 5 && (
                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-[10px] font-bold animate-bounce">5</div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
