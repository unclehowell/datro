import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell,
  Terminal, 
  Cpu, 
  Zap, 
  Shield, 
  Users, 
  ArrowRight, 
  Menu, 
  X, 
  BookOpen, 
  Code2, 
  Layers,
  Bot,
  Coins,
  Globe,
  ChevronRight,
  CheckCircle2,
  RotateCw,
  Lock,
  ChevronDown,
  User,
  Plus,
  Phone,
  ExternalLink,
  Link2,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  MessageCircle,
  Send,
  Trash2,
  Copy,
  Check,
  Wallet,
  FileText,
  Info,
  Linkedin,
  Sun,
  Moon
} from 'lucide-react';
import LanguageSelector, { Language } from './components/LanguageSelector';
import AgentComputer from './components/AgentComputer';
import AvatarSection from './components/AvatarSection';
import WalletCredits from './components/WalletCredits';
import Compliance from './components/Compliance';
import OAuthAnimation from './components/OAuthAnimation';

import ThemeToggle from './components/ThemeToggle';
import Exchange from './components/Exchange';
import AuthModal from './components/Auth/AuthModal';
import ForgotPassword from './components/Auth/ForgotPassword';
import Dashboard from './components/Dashboard';
import ConnectionsModal from './components/ConnectionsModal';
import { Smartphone, Apple as AppleIcon, Monitor, PlayCircle, CreditCard } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const SineWave = () => (
  <div className="flex items-center justify-center gap-1.5 h-12">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="w-1.5 bg-accent rounded-full"
        animate={{
          height: [8, 32, 8],
          opacity: [0.3, 1, 0.3]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: i * 0.15,
          ease: "easeInOut"
        }}
      />
    ))}
  </div>
);

const RingingPhone = () => (
  <div className="relative flex items-center justify-center w-full h-full">
    <motion.div
      className="absolute inset-0 bg-accent/20 rounded-full"
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.5, 0, 0.5]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeOut"
      }}
    />
    <motion.div
      animate={{
        rotate: [-10, 10, -10, 10, 0],
        scale: [1, 1.1, 1]
      }}
      transition={{
        duration: 0.5,
        repeat: Infinity,
        repeatDelay: 1
      }}
    >
      <Smartphone size={40} className="sm:size-[60px] text-accent" />
    </motion.div>
  </div>
);

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'exchange' | 'signin' | 'signup' | 'forgot-password' | 'docs'>('home');
  const [user, setUser] = useState<any>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoOrientation, setDemoOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const [isFreeMenuOpen, setIsFreeMenuOpen] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [activeOAuth, setActiveOAuth] = useState<{ platform: string, icon: any } | null>(null);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [isDemo, setIsDemo] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fcuk-theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('fcuk-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const [showJointVentureTooltip, setShowJointVentureTooltip] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(() => {
    return localStorage.getItem('fcuk-cookie-consent') === 'true';
  });

  // Buyer Form State
  const [buyerWebsiteUrl, setBuyerWebsiteUrl] = useState('');
  const [payPerLead, setPayPerLead] = useState('');
  const [leadCount, setLeadCount] = useState('');
  const [buyerBalance, setBuyerBalance] = useState(0);
  const [sellerBalance, setSellerBalance] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.email === 'demo') {
      setIsDemo(true);
      setTimeLeft(90);
    } else {
      setIsDemo(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isDemo) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setUser(null);
          return 0;
        }
        if (prev === 31) {
          setShowLogoutWarning(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDemo]);
  const [showWalletNotice, setShowWalletNotice] = useState(false);
  const [demoAgents, setDemoAgents] = useState<{id: number, isOpen: boolean, balance: number, hasInteracted: boolean, title: string, isSpawned: boolean, isAnswered: boolean}[]>([
    { id: 1, isOpen: false, balance: 0, hasInteracted: false, title: 'CEO', isSpawned: true, isAnswered: false },
    { id: 2, isOpen: false, balance: 0, hasInteracted: false, title: 'Employee 1', isSpawned: false, isAnswered: false },
    { id: 3, isOpen: false, balance: 0, hasInteracted: false, title: 'Employee 2', isSpawned: false, isAnswered: false },
    { id: 4, isOpen: false, balance: 0, hasInteracted: false, title: 'Employee 3', isSpawned: false, isAnswered: false },
    { id: 5, isOpen: false, balance: 0, hasInteracted: false, title: 'Employee 4', isSpawned: false, isAnswered: false }
  ]);
  const [showSpawnModal, setShowSpawnModal] = useState(false);
  const [spawnType, setSpawnType] = useState<'friend' | 'employee' | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [demoPrompt, setDemoPrompt] = useState<string | null>(null);
  const [activeAgentId, setActiveAgentId] = useState<number | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0.00);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [forceConnect, setForceConnect] = useState(false);

  const [hasSelectedAgent, setHasSelectedAgent] = useState(false);

  useEffect(() => {
    if (demoPrompt) {
      const timer = setTimeout(() => setDemoPrompt(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [demoPrompt]);

  const [dashboardKey, setDashboardKey] = useState(0);

  const handleSpawn = () => {
    setShowSpawnModal(true);
  };

  const confirmSpawn = () => {
    if (spawnType === 'friend') {
      setDemoPrompt(`Invitation sent to ${inviteEmail}`);
      setShowSpawnModal(false);
      setSpawnType(null);
      setInviteEmail('');
      return;
    }

    const nextAgent = demoAgents.find(a => !a.isSpawned);
    if (!nextAgent) {
      setAuthModalTab('signup');
      setShowAuthModal(true);
      setShowSpawnModal(false);
      return;
    }

    setDemoAgents(prev => prev.map(a => 
      a.id === nextAgent.id 
        ? { ...a, isSpawned: true, title: spawnType === 'employee' ? `Employee ${a.id - 1}` : a.title } 
        : a
    ));
    
    setDemoPrompt(spawnType === 'employee' ? 'New agent spawned' : 'Invitation sent');
    setShowSpawnModal(false);
    setSpawnType(null);
  };

  const handleRemoveAgent = (id: number) => {
    if (id === 1) return; // Don't let the first agent be deleted
    setDemoAgents(prev => prev.map(a => a.id === id ? { ...a, isSpawned: false, isOpen: false } : a));
    if (activeAgentId === id) {
      setActiveAgentId(null);
    }
  };

  const handleOpenAgent = (id: number) => {
    // Only allow opening the first agent (id 1) in demo
    if (id !== 1 && demoAgents.find(a => a.id === id)) {
      setAuthModalTab('signup');
      setShowAuthModal(true);
      return;
    }
    if (id === 1) {
      playHi();
    }
    setDemoAgents(prev => prev.map(a => ({ ...a, isOpen: a.id === id, isAnswered: a.id === id ? true : a.isAnswered })));
    setActiveAgentId(id);
    setHasSelectedAgent(true);
    if (onboardingStep === 0) setOnboardingStep(1);
  };

  const handleConnectAgent = (id: number) => {
    if (id !== 1) {
      setAuthModalTab('signup');
      setShowAuthModal(true);
      return;
    }
    setActiveAgentId(id);
    setShowConnectionsModal(true);
    if (onboardingStep === 2) setOnboardingStep(3);
  };

  const playHi = () => {
    try {
      const utterance = new SpeechSynthesisUtterance("Hi");
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // Fallback to audio if speech synth fails
      const audio = new Audio('https://api.dictionaryapi.dev/media/pronunciations/en/hi-uk.mp3');
      audio.play().catch(() => {});
    }
  };

  const [wasStaceyOpen, setWasStaceyOpen] = useState(false);

  // useEffect(() => {
  //   const stacey = demoAgents.find(a => a.id === 1);
  //   const isOpen = activeAgentId === 1 && stacey?.isOpen;
  //   
  //   if (isOpen && !wasStaceyOpen) {
  //     playHi();
  //   }
  //   
  //   setWasStaceyOpen(!!isOpen);
  // }, [activeAgentId, demoAgents, wasStaceyOpen]);

  const playDing = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3');
    audio.play().catch(() => {});
  };

  const handleAgentAuthorize = (id: number, amount: number) => {
    if (!activeOAuth) return;
    const platform = activeOAuth.platform;
    setIsOAuthLoading(true);
    setTimeout(() => {
      setDemoAgents(prev => prev.map(a => 
        a.id === id ? { ...a, balance: a.balance + amount, hasInteracted: true } : a
      ));
      setWalletBalance(prev => {
        const newBalance = prev + amount;
        playDing();
        return newBalance;
      });
      setConnectedPlatforms(prev => [...prev, platform]);
      setIsOAuthLoading(false);
      setActiveOAuth(null);
      if (onboardingStep === 4) {
        setOnboardingStep(5);
      }
    }, 1500);
  };

  const handleDisconnect = (platform: string) => {
    setConnectedPlatforms(prev => prev.filter(p => p !== platform));
  };

  const isDemoUser = user?.email === 'demo';

  const content = {
    en: {
      heroTitle: "Your AI affiliate operator.",
      heroTitleAccent: "Running campaigns. Generating revenue.",
      heroSub: "Connect your accounts. Your agent builds, runs, and optimizes real affiliate campaigns 24/7. You own the output. You get paid weekly in GBP.",
      cta: "Start Your Agent",
      docs: "Documentation",
      api: "API Reference",
      features: "Features",
      plans: "Plans",
      exchange: "Exchange",
      subAgentTitle: "Spawn Subordinate Agents",
      subAgentDesc: "Expand your network by spawning subordinate agents. Each sub-agent requires custom configuration by our team and costs a one-time fee of $100."
    },
    cy: {
      heroTitle: "A.I entrepreneur rhad,",
      heroTitleAccent: "sy'n cynhyrchu incwm, i bawb.",
      heroSub: "Mae eich asiant yn eich gwobrwyo â chredydau FCUK am wneud 'ffafrau' iddo—fel cysylltu eich cyfrifon cymdeithasol. Nid rhifau yn unig yw'r credydau hyn; gellir eu cyfnewid am GBP go iawn.",
      cta: "Hawliwch Eich Asiant Am Ddim",
      docs: "Dogfennaeth",
      api: "Cyfeirnod API",
      features: "Nodweddion",
      subAgents: "Is-asiantau",
      exchange: "Cyfnewid (FCUK > GBP)",
      subAgentTitle: "Graddiwch Eich Rhwydwaith",
      subAgentDesc: "Silio is-asiantau fel is-weithwyr neu gymdeithion i adeiladu ymerodraeth gysylltiedig aml-haenog. Mae eich asiantau yn gweithio 24/7 tra byddwch chi'n ennill."
    },
    gd: {
      heroTitle: "Neach-tionnsgain AI an-asgaidh,",
      heroTitleAccent: "a bhios a’ gineadh teachd-a-steach, dha na h-uile.",
      heroSub: "Bidh an t-àidseant agad a’ toirt duais dhut le creideasan FCUK airson a bhith a’ dèanamh ‘fàbhar’ dha - leithid a bhith a’ ceangal do chunntasan sòisealta. Chan e dìreach àireamhan a th’ anns na creideasan sin; faodar an atharrachadh airson fìor GBP.",
      cta: "Tagraidh an Riochdaire an-asgaidh agad",
      docs: "Dogfennaeth",
      api: "Iomradh API",
      features: "Feartan",
      subAgents: "Fo-riochdairean",
      exchange: "Malairt (FCUK > GBP)",
      subAgentTitle: "Sgèile an Lìonra agad",
      subAgentDesc: "Sìolaich fo-riochdairean mar fo-oifigearan no companaich gus ìmpireachd ceangailte ioma-shreath a thogail. Bidh na riochdairean agad ag obair 24/7 fhad ‘s a choisneas tu."
    }
  };

  const t = content[lang];

  const handleOrderSpawn = async () => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const session = await response.json();

      if (session.error) {
        console.error(session.error);
        return;
      }

      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await (stripe as any).redirectToCheckout({
          sessionId: session.id,
        });
        if (error) {
          console.error(error);
        }
      }
    } catch (err) {
      console.error('Payment failed:', err);
    }
  };

  const handleManageBilling = async () => {
    try {
      // In a real app, you'd have the customer ID from the user's profile
      const customerId = 'cus_test_123'; // Placeholder
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId }),
      });

      const { url, error } = await response.json();
      if (error) {
        console.error(error);
        return;
      }

      window.location.href = url;
    } catch (err) {
      console.error('Portal redirect failed:', err);
    }
  };

  // Remove the early return to keep the header
  // if (user) {
  //   return <Dashboard onSignOut={() => setUser(null)} />;
  // }

  return (
    <div className="min-h-screen flex flex-col bg-paper selection:bg-ink selection:text-paper">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[500] bg-paper/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1800px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-16">
            <button onClick={() => setCurrentPage('home')} className="flex flex-col gap-2 group text-left">
              <span className="font-bold text-xl sm:text-3xl tracking-tighter text-ink leading-none group-hover:text-accent transition-colors">FINANCE CHEQUE UK (FCUK)</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent/80">
                <span className="sm:hidden">Universal Agentic A.I Lead Generation</span>
                <span className="hidden sm:inline">Universal Agentic A.I Lead Generation</span>
              </span>
            </button>
          </div>

          <div className="flex items-center gap-8">
            {user ? (
              <div className="hidden md:flex items-center gap-6">
                <div className="flex flex-col items-center">
                  <User size={20} className="text-accent" />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-accent">CEO</span>
                </div>
                <div className="flex flex-col items-center opacity-30">
                  <div className="relative">
                    <User size={20} className="text-ink" />
                    <Plus size={8} className="absolute -top-1 -right-1 text-ink" />
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-ink">Add</span>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="p-2 text-ink/40 hover:text-ink transition-colors"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              <div className="relative group">
                <button 
                  className="flex items-center gap-2 bg-ink text-paper px-8 py-3 border border-border rounded-none font-bold text-xs uppercase tracking-widest hover:bg-accent hover:border-accent hover:text-paper transition-all"
                >
                  Menu
                  <ChevronDown size={14} />
                </button>
                <div className="absolute right-0 top-full pt-2 w-64 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[600]">
                  <div className="bg-paper border border-border shadow-2xl p-2 space-y-1">
                    {/* Buyer Menu */}
                    <div className="relative group/buyer">
                      <button 
                        className="w-full flex items-center justify-between p-3 hover:bg-card transition-colors text-xs font-bold text-ink/70"
                      >
                        Buyer
                        <ChevronRight size={14} />
                      </button>
                      <div className="absolute right-full top-0 pr-2 w-64 opacity-0 pointer-events-none group-hover/buyer:opacity-100 group-hover/buyer:pointer-events-auto transition-all">
                        <div className="bg-paper border border-border shadow-2xl p-2 space-y-1">
                          <button 
                            onClick={() => { setAuthModalTab('signin'); setShowAuthModal(true); }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-card transition-colors text-xs font-bold text-ink/70"
                          >
                            <User size={16} />
                            Register / Sign In
                          </button>
                          <button 
                            onClick={() => { setCurrentPage('home'); setShowPaymentModal(true); }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-card transition-colors text-xs font-bold text-ink/70"
                          >
                            <Layers size={16} />
                            Compare Paid Tiers
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Seller Menu */}
                    <div className="relative group/seller">
                      <button 
                        className="w-full flex items-center justify-between p-3 hover:bg-card transition-colors text-xs font-bold text-ink/70"
                      >
                        Seller
                        <ChevronRight size={14} />
                      </button>
                      <div className="absolute right-full top-0 pr-2 w-64 opacity-0 pointer-events-none group-hover/seller:opacity-100 group-hover/seller:pointer-events-auto transition-all">
                        <div className="bg-paper border border-border shadow-2xl p-2 space-y-1">
                          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-ink/30 border-b border-border mb-2">Install Options</div>
                          <div className="grid grid-cols-2 gap-2 p-2">
                            <button onClick={() => setShowInstallModal(true)} className="flex flex-col items-center gap-2 p-3 hover:bg-card border border-transparent hover:border-border transition-all">
                              <Terminal size={20} className="text-ink/60" />
                              <span className="text-[8px] font-bold uppercase">Linux</span>
                            </button>
                            <button onClick={() => setShowInstallModal(true)} className="flex flex-col items-center gap-2 p-3 hover:bg-card border border-transparent hover:border-border transition-all">
                              <Smartphone size={20} className="text-ink/60" />
                              <span className="text-[8px] font-bold uppercase">Android</span>
                            </button>
                            <button onClick={() => setShowInstallModal(true)} className="flex flex-col items-center gap-2 p-3 hover:bg-card border border-transparent hover:border-border transition-all">
                              <Monitor size={20} className="text-ink/60" />
                              <span className="text-[8px] font-bold uppercase">Windows</span>
                            </button>
                            <button onClick={() => setShowInstallModal(true)} className="flex flex-col items-center gap-2 p-3 hover:bg-card border border-transparent hover:border-border transition-all">
                              <AppleIcon size={20} className="text-ink/60" />
                              <span className="text-[8px] font-bold uppercase">MacOS</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <button 
                      onClick={() => setCurrentPage('docs')}
                      className="w-full flex items-center gap-3 p-3 hover:bg-card transition-colors text-xs font-bold text-ink/70"
                    >
                      <FileText size={16} />
                      Documents
                    </button>

                    {/* Exchange */}
                    <button 
                      onClick={() => setCurrentPage('exchange')}
                      className="w-full flex items-center gap-3 p-3 hover:bg-card transition-colors text-xs font-bold text-ink/70"
                    >
                      <Coins size={16} />
                      Exchange
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Removed - Wallet Menu Replaces It */}

      {/* Install Modal */}
      <AnimatePresence>
        {showInstallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 left-0 right-0 bottom-0 z-[1100] flex items-start justify-center p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl bg-paper border border-border p-10 space-y-8 shadow-2xl relative my-8"
            >
              <button 
                onClick={() => setShowInstallModal(false)}
                className="absolute top-6 right-6 text-ink/20 hover:text-ink transition-colors"
              >
                <X size={24} />
              </button>

              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter">Install Finance Cheque UK (FCUK)</h2>
                <p className="text-xs text-ink/40 font-bold uppercase tracking-widest">Run this one-liner in your terminal to get started for free.</p>
                
                <div className="relative group">
                  <div className="bg-ink text-paper p-6 font-mono text-sm leading-relaxed overflow-x-auto rounded-none border border-white/10 pr-16">
                    curl -fsSL https://pirateclaw.datro.xyz/install.sh | sh
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('curl -fsSL https://pirateclaw.datro.xyz/install.sh | sh');
                      setCopyStatus(true);
                      setTimeout(() => setCopyStatus(false), 2000);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white transition-colors rounded-none"
                  >
                    {copyStatus ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                </div>

                <div className="p-4 bg-accent/5 border border-accent/10 flex items-start gap-4">
                  <Shield size={20} className="text-accent mt-0.5" />
                  <p className="text-[10px] text-ink/60 leading-relaxed font-medium uppercase tracking-wider">
                    This script installs the FCUK binary and sets up your local environment for decentralized campaign management.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-20">
        {currentPage === 'exchange' ? (
          <Exchange 
            onBack={() => setCurrentPage('home')} 
            balance={walletBalance}
            onboardingStep={onboardingStep}
            onAuthRequired={() => {
              setAuthModalTab('signup');
              setShowAuthModal(true);
            }}
          />
        ) : currentPage === 'docs' ? (
          <div className="max-w-4xl mx-auto p-12 lg:p-24 space-y-16">
            <section className="space-y-8">
              <h2 className="text-5xl font-bold tracking-tighter">How Finance Cheque UK (FCUK) Works.</h2>
              <p className="text-lg text-ink/60 leading-relaxed">
                We partner with verified affiliate networks. Your agent operates within these ecosystems to generate real-world value.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-8 frame space-y-4">
                  <div className="w-10 h-10 bg-accent text-paper flex items-center justify-center font-bold">01</div>
                  <h3 className="font-bold">Connect</h3>
                  <p className="text-xs text-ink/50 leading-relaxed">Grant access to platforms (Gmail, X, Meta) to provide the distribution footprint needed.</p>
                </div>
                <div className="p-8 frame space-y-4">
                  <div className="w-10 h-10 bg-accent text-paper flex items-center justify-center font-bold">02</div>
                  <h3 className="font-bold">Operate</h3>
                  <p className="text-xs text-ink/50 leading-relaxed">Your agent creates content, runs outreach, and optimizes campaigns 24/7.</p>
                </div>
                <div className="p-8 frame space-y-4">
                  <div className="w-10 h-10 bg-accent text-paper flex items-center justify-center font-bold">03</div>
                  <h3 className="font-bold">Earn</h3>
                  <p className="text-xs text-ink/50 leading-relaxed">Revenue is tracked in real-time and paid weekly in GBP directly to your bank account.</p>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <h2 className="text-3xl font-bold tracking-tighter">Core Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 frame space-y-4">
                  <h3 className="font-bold">Content Engine</h3>
                  <p className="text-xs text-ink/50 leading-relaxed">Builds landing pages and creates high-converting marketing assets automatically.</p>
                </div>
                <div className="p-8 frame space-y-4">
                  <h3 className="font-bold">Multi-Channel</h3>
                  <p className="text-xs text-ink/50 leading-relaxed">Runs email outreach and social media campaigns across X, Meta, and LinkedIn.</p>
                </div>
                <div className="p-8 frame space-y-4">
                  <h3 className="font-bold">Real-Time Optimization</h3>
                  <p className="text-xs text-ink/50 leading-relaxed">Tests ads and outreach scripts in real-time to maximize your affiliate commission.</p>
                </div>
                <div className="p-8 frame space-y-4">
                  <h3 className="font-bold">Revenue Share</h3>
                  <p className="text-xs text-ink/50 leading-relaxed">You provide the distribution footprint; the agent provides the execution. You share the profit.</p>
                </div>
              </div>
            </section>
          </div>
        ) : currentPage === 'forgot-password' ? (
          <ForgotPassword onBack={() => { setCurrentPage('home'); setShowAuthModal(true); }} />
        ) : (user && user.email !== 'demo') ? (
          <div className="flex flex-col h-[calc(100vh-6rem)]">
            <Dashboard onSignOut={() => setUser(null)} variant="full" />
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row min-h-[calc(100vh-10rem)] relative">
              {/* Buyer Form Section (Left Half) */}
              <div className="w-full md:w-1/2 px-8 py-2 flex flex-col justify-start bg-paper/50 relative z-[300]">
                <div className="max-w-md mx-auto w-full space-y-8">
                  <div className="flex items-center justify-between w-full mb-4 pb-8 border-b border-border">
                    <h2 className="text-3xl font-bold tracking-tighter text-ink">Buyer</h2>
                    {/* Mock Wallet Balance */}
                    <button 
                      onClick={() => {
                        setAuthModalTab('signin');
                        setShowAuthModal(true);
                      }}
                      className="group flex flex-col items-end gap-1 p-4 bg-card border border-border hover:border-accent transition-all min-w-[130px]"
                    >
                      <div className="flex items-center gap-2">
                        <Wallet size={14} className="text-accent group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-ink/30">Balance</span>
                      </div>
                      <span className={`text-xl font-bold font-mono ${buyerBalance < 0 ? 'text-red-500' : 'text-ink'}`}>
                        £{buyerBalance.toFixed(2)}
                      </span>
                    </button>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const cost = parseFloat(payPerLead) * parseInt(leadCount);
                      if (isNaN(cost)) {
                        setFormError("Please enter valid amounts.");
                        return;
                      }

                      // Check if balance covers the order
                      if (buyerBalance <= -500) {
                        setFormError("Credit limit reached (£-500). Please sign in to top up your wallet.");
                        return;
                      }

                      if (buyerBalance === 0 && cost > 0) {
                        setFormError("Insufficient funds. Sign in to top up your wallet.");
                        return;
                      }

                      if (buyerBalance - cost < -500) {
                        setFormError("Order exceeds credit limit. Minimum balance allowed is £-500.");
                        return;
                      }
                      
                      setBuyerBalance(prev => prev - cost);
                      setFormError(null);
                      
                      if (buyerBalance - cost < 0) {
                        setFormError("Notice: Your wallet balance is now negative. Sign in to top up.");
                      }
                    }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30">Website URL</label>
                      <input 
                        type="text" 
                        required
                        value={buyerWebsiteUrl}
                        onChange={(e) => setBuyerWebsiteUrl(e.target.value)}
                        placeholder="your-business.com"
                        onFocus={() => setDemoPrompt("Hey")}
                        className="w-full bg-card border border-border px-4 py-4 text-sm font-medium focus:outline-none focus:border-accent transition-colors rounded-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30">Budget Per Lead (£)</label>
                        <input 
                          type="number" 
                          required
                          step="0.01"
                          min="0.10"
                          value={payPerLead}
                          onChange={(e) => setPayPerLead(e.target.value)}
                          placeholder="5.00"
                          onFocus={() => setDemoPrompt("Hey")}
                          className="w-full bg-card border border-border px-4 py-4 text-sm font-medium focus:outline-none focus:border-accent transition-colors rounded-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30">Quantity (Leads)</label>
                        <input 
                          type="number" 
                          required
                          min="1"
                          value={leadCount}
                          onChange={(e) => setLeadCount(e.target.value)}
                          placeholder="100"
                          onFocus={() => setDemoPrompt("Hey")}
                          className="w-full bg-card border border-border px-4 py-4 text-sm font-medium focus:outline-none focus:border-accent transition-colors rounded-none"
                        />
                      </div>
                    </div>

                    {formError && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 flex items-start gap-4">
                        <Bell size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider leading-relaxed">
                          {formError}
                        </p>
                      </div>
                    )}

                    <div className="pt-4">
                      <button 
                        type="submit"
                        className="w-full bg-accent text-white font-bold py-5 uppercase tracking-widest text-xs hover:bg-ink transition-all flex items-center justify-center gap-3 shadow-xl shadow-accent/20"
                      >
                        <Send size={18} />
                        Order
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Demo Manager UI (Right Half) */}
              <div className="w-full md:w-1/2 relative bg-ink/5 border-l border-border/50">
                <div className="pointer-events-auto">
                  <div className="max-w-[800px] mx-auto px-8 py-2 min-h-full flex flex-col items-center justify-start">
                    <div className="flex flex-col items-center w-full">
                      {/* Seller Title & Wallet Bar */}
                      <div className="flex items-center justify-between w-full mb-4 pb-8 border-b border-border">
                        <h2 className="text-3xl font-bold tracking-tighter text-ink">Seller(s)</h2>
                        <button 
                          onClick={() => {
                            setAuthModalTab('signin');
                            setShowAuthModal(true);
                          }}
                          className="group flex flex-col items-end gap-1 p-4 bg-card border border-border hover:border-accent transition-all min-w-[130px]"
                        >
                          <div className="flex items-center gap-2">
                            <Wallet size={14} className="text-accent group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-ink/30">Balance</span>
                          </div>
                          <span className={`text-xl font-bold font-mono ${sellerBalance < 0 ? 'text-red-500' : 'text-ink'}`}>
                            £{sellerBalance.toFixed(2)}
                          </span>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 sm:gap-16 lg:gap-20 items-start justify-items-center w-full">
                        {/* Agent 1: Stacey */}
                        <div className="flex flex-col items-center gap-6 pointer-events-auto">
                          <div className="relative">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleOpenAgent(1)}
                              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full relative overflow-hidden shadow-2xl transition-all flex items-center justify-center"
                              style={{ 
                                backgroundImage: 'url("https://r2.erweima.ai/ai_image/95462580-b747-49a7-96a8-f7166e4a2d71.png")',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                border: 'none'
                              }}
                            />
                            {onboardingStep === 0 && !user && cookiesAccepted && (
                              <motion.button 
                                onClick={() => handleOpenAgent(1)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-50"
                              >
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent text-white rounded-full flex items-center justify-center animate-bounce shadow-2xl">
                                  <Phone size={16} />
                                </div>
                              </motion.button>
                            )}
                          </div>

                          <div className="flex flex-col items-center gap-4 w-full max-w-[160px] sm:max-w-[200px]">
                            <div className="flex items-center justify-center gap-3 w-full">
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => setShowContactModal(true)} className="hover:scale-110 transition-transform opacity-90 hover:opacity-100">
                                  <Mail size={16} className="text-accent" />
                                </button>
                                <button onClick={() => setShowContactModal(true)} className="hover:scale-110 transition-transform opacity-90 hover:opacity-100">
                                  <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                                </button>
                                <button onClick={() => setShowContactModal(true)} className="hover:scale-110 transition-transform opacity-90 hover:opacity-100">
                                  <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="Telegram" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                                </button>
                              </div>
                              <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-ink/80 truncate whitespace-nowrap">Stacey</div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 w-full">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleConnectAgent(1); }}
                                className="flex items-center justify-center gap-2 bg-accent text-white py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-ink transition-all shadow-lg active:scale-95 pointer-events-auto relative"
                              >
                                {onboardingStep === 2 && cookiesAccepted && (
                                  <div className="absolute -left-2 -top-2 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-[10px] font-bold animate-bounce shadow-lg z-50">2</div>
                                )}
                                <Zap size={14} />
                                Connect
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (demoAgents[0].balance > 0) {
                                    setCurrentPage('exchange');
                                  }
                                }}
                                className="flex items-center justify-center gap-2 bg-card border border-border py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest text-ink/40 hover:text-accent hover:border-accent transition-all pointer-events-auto relative"
                              >
                                <Coins size={14} />
                                {demoAgents[0].balance.toFixed(2)}
                              </button>
                            </div>
                          </div>

                          {/* Hey Prompt Space */}
                          <div className="relative h-8 mt-2 w-full flex justify-center">
                            <AnimatePresence>
                              {demoPrompt === "Hey" && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  className="bg-accent text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-lg whitespace-nowrap"
                                >
                                  Hey
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Agent 2 */}
                        {[2].map((id) => (
                          <div key={id} className="flex flex-col items-center gap-6 pointer-events-auto">
                            <div className="relative">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleOpenAgent(id)}
                                className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full ${demoAgents.find(a => a.id === id)?.isSpawned ? 'bg-[#0a0a0a]' : 'bg-[#0a0a0a]/30 border-dashed'} border-4 border-[#1a1a1a] relative overflow-hidden shadow-xl transition-all flex items-center justify-center hover:border-accent/50 group`}
                              >
                                {demoAgents.find(a => a.id === id)?.isSpawned ? (
                                  demoAgents.find(a => a.id === id)?.isAnswered ? <SineWave /> : <RingingPhone />
                                ) : (
                                  <div className="relative">
                                    <User size={40} className="sm:size-[60px] text-accent/5 opacity-20" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <Plus size={20} className="sm:size-[24px] text-accent/40 group-hover:text-accent transition-colors" />
                                    </div>
                                  </div>
                                )}
                              </motion.button>
                            </div>

                            <div className="flex flex-col items-center gap-4 w-full max-w-[160px] sm:max-w-[200px]">
                              <div className="flex items-center justify-center gap-3 w-full">
                                <div className="flex items-center gap-1.5">
                                  <button onClick={() => handleConnectAgent(id)} className="hover:scale-110 transition-transform opacity-90 hover:opacity-100">
                                    <Zap size={16} className="text-accent" />
                                  </button>
                                  <button disabled className="opacity-50">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                                  </button>
                                  <button disabled className="opacity-50">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="Telegram" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                                  </button>
                                </div>
                                <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-ink/40 truncate whitespace-nowrap">Agent {id}</div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 w-full">
                                <button onClick={(e) => { e.stopPropagation(); handleConnectAgent(id); }} className="flex items-center justify-center gap-2 bg-card/50 border border-border/50 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest text-ink/20 hover:text-accent hover:border-accent transition-all pointer-events-auto">
                                  <Zap size={14} /> Connect
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); }} className="flex items-center justify-center gap-2 bg-card/50 border border-border/50 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest text-ink/20 pointer-events-auto">
                                  <Coins size={14} /> {demoAgents.find(a => a.id === id)?.balance.toFixed(2) || '0.00'}
                                </button>
                              </div>
                            </div>
                            {/* Spacer to match Stacey's prompt area */}
                            <div className="h-8 mt-2" />
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>

        <ConnectionsModal 
          isOpen={showConnectionsModal}
            onClose={() => setShowConnectionsModal(false)}
            onboardingStep={onboardingStep}
            cookiesAccepted={cookiesAccepted}
            connectedPlatforms={connectedPlatforms}
            onDisconnect={handleDisconnect}
            onSelect={(platform, icon) => {
              setShowConnectionsModal(false);
              setActiveOAuth({ platform, icon });
              if (onboardingStep === 3) setOnboardingStep(4);
            }}
          />

          {/* Simulated OAuth Modal */}
          <AnimatePresence>
            {activeOAuth && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed top-20 left-0 right-0 bottom-0 z-[1100] flex items-start justify-center p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full max-w-md bg-paper border border-border p-10 space-y-8 shadow-2xl relative frame my-8"
                >
                  <button 
                    onClick={() => setActiveOAuth(null)} 
                    className="absolute top-6 right-6 text-ink/20 hover:text-ink transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 relative">
                      <div className="w-12 h-12 bg-accent/10 text-accent flex items-center justify-center rounded-xl">
                        {activeOAuth.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-ink">Connect {activeOAuth.platform}</h3>
                        <p className="text-[10px] text-ink/40 uppercase font-bold tracking-widest">Grant Agent Permissions</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-accent/5 border border-accent/10 space-y-4">
                      <div className="flex items-center gap-3 text-accent">
                        <Shield size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Secure Connection</span>
                      </div>
                      <p className="text-xs text-ink/60 leading-relaxed">
                        This agent requires permission.
                      </p>
                    </div>

                    <div className="relative">
                      <button 
                        onClick={() => {
                          if (activeAgentId) {
                            handleAgentAuthorize(activeAgentId, 2.33);
                          }
                        }}
                        disabled={isOAuthLoading}
                        className="w-full bg-ink text-paper font-bold py-5 uppercase tracking-widest text-sm hover:bg-accent transition-all flex items-center justify-center gap-3 disabled:opacity-50 relative"
                      >
                        {onboardingStep === 3 && cookiesAccepted && (
                          <div className="absolute -left-2 -top-2 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-[10px] font-bold animate-bounce shadow-lg z-50">4</div>
                        )}
                        {isOAuthLoading ? (
                          <div className="w-5 h-5 border-2 border-paper/30 border-t-paper rounded-full animate-spin" />
                        ) : (
                          <>
                            Authorise
                            <ArrowRight size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AuthModal 
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                initialTab={authModalTab}
                onNavigate={(page) => setCurrentPage(page)}
                onAuthSuccess={(user) => {
                  setUser(user);
                  setShowAuthModal(false);
                  setDashboardKey(prev => prev + 1);
                  if (user.email === 'demo') {
                    setOnboardingStep(0);
                  }
                }}
              />

              <AnimatePresence>
                {/* Onboarding guide box removed - markers are used instead */}
              </AnimatePresence>

              <div className="flex-1 flex items-center justify-center">
              {activeAgentId && demoAgents.find(a => a.id === activeAgentId)?.isOpen ? (
                <Dashboard 
                  reloadKey={dashboardKey}
                  onSignOut={() => setUser(null)} 
                  onClose={() => {
                    setDemoAgents(prev => prev.map(a => ({ ...a, isOpen: false })));
                    setForceConnect(false);
                    if (onboardingStep === 1) setOnboardingStep(2);
                  }}
                  onNavigate={(page) => setCurrentPage(page)}
                  onAuthRequired={() => {
                    setAuthModalTab('signup');
                    setShowAuthModal(true);
                  }}
                  variant="mobile" 
                  forceConnect={forceConnect}
                  initialBalance={demoAgents.find(a => a.id === activeAgentId)?.balance}
                  onAuthorize={(amount) => handleAgentAuthorize(activeAgentId, amount)}
                  guideStep={onboardingStep}
                  onGuideStepChange={setOnboardingStep}
                  onConnectAttempt={() => {
                    setAuthModalTab('signup');
                    setShowAuthModal(true);
                    setForceConnect(false);
                  }}
                />
              ) : (
                null
              )}
            </div>
          </>
        )}
      </main>

      <Compliance onAccept={() => setCookiesAccepted(true)} />

      {/* Modals and Overlays */}
        <footer className="bg-paper text-ink/40 py-4 px-6 border-t border-border relative">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex flex-col items-center md:items-start gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs tracking-tighter text-ink/60">Finance Cheque UK (FCUK)</span>
                  <div className="relative">
                    <button 
                      onMouseEnter={() => setShowJointVentureTooltip(true)}
                      onMouseLeave={() => setShowJointVentureTooltip(false)}
                      onClick={() => setShowJointVentureTooltip(!showJointVentureTooltip)}
                      className="text-ink/20 hover:text-accent transition-colors"
                    >
                      <Info size={12} />
                    </button>
                    <AnimatePresence>
                      {showJointVentureTooltip && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full mb-2 left-0 w-80 p-4 bg-card border border-border shadow-2xl z-[600] text-[9px] leading-relaxed font-bold normal-case text-ink/80"
                        >
                          Joint venture between Vcare Saver Club Limited, a company incorporated in England and Wales (registered number 08001973), 27 Old Gloucester Street, London, United Kingdom, WC1N 3AX and Datro Consortium Limited, a company incorporated in England and Wales (registered number 13775817), Unit 29 Highcroft Industrial Estate, Enterprise Road, Waterlooville, England, PO8 0BT.
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <p className="text-[8px] tracking-widest text-ink/20">© 2026 Vcare Saver Club Limited & Datro Consortium Limited. All Rights Reserved.</p>
              </div>
              <div className="flex gap-6 items-center">
                <a href="#" className="text-ink/20 hover:text-accent transition-colors">
                  <Facebook size={16} />
                </a>
                <a href="#" className="text-ink/20 hover:text-accent transition-colors">
                  <Twitter size={16} />
                </a>
                <a href="#" className="text-ink/20 hover:text-accent transition-colors">
                  <Instagram size={16} />
                </a>
                <a href="#" className="text-ink/20 hover:text-accent transition-colors">
                  <Linkedin size={16} />
                </a>
              </div>
            </div>
          </div>
        </footer>

      {/* Modals */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 left-0 right-0 bottom-0 z-[1100] flex items-start justify-center p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full max-w-sm bg-paper border border-border p-10 space-y-8 shadow-2xl relative frame text-center my-8"
            >
              <button 
                onClick={() => setShowContactModal(false)}
                className="absolute top-6 right-6 text-ink/20 hover:text-ink transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-accent/10 text-accent flex items-center justify-center rounded-full">
                  <User size={32} />
                </div>
                <h3 className="text-xl font-bold text-ink">Sign in to speak to your free agent</h3>
              </div>
              <button 
                onClick={() => {
                  setShowContactModal(false);
                  setAuthModalTab('signin');
                  setShowAuthModal(true);
                }}
                className="w-full bg-ink text-paper font-bold py-4 uppercase tracking-widest text-xs hover:bg-accent transition-all"
              >
                Sign In / Register
              </button>
            </motion.div>
          </motion.div>
        )}

        {showLogoutWarning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 left-0 right-0 bottom-0 z-[1200] flex items-start justify-center p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full max-w-sm bg-paper border border-border p-10 space-y-8 shadow-2xl relative frame text-center my-8"
            >
              <button 
                onClick={() => setShowLogoutWarning(false)}
                className="absolute top-6 right-6 text-ink/20 hover:text-ink transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 flex items-center justify-center rounded-full">
                  <Bell size={32} />
                </div>
                <h3 className="text-xl font-bold text-ink">Session Expiring</h3>
                <p className="text-sm text-ink/60">You will be logged out in {timeLeft} seconds.</p>
              </div>
              <button 
                onClick={() => setShowLogoutWarning(false)}
                className="w-full bg-ink text-paper font-bold py-4 uppercase tracking-widest text-xs hover:bg-accent transition-all"
              >
                Continue Demo
              </button>
            </motion.div>
          </motion.div>
        )}

        {showPaymentModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 left-0 right-0 bottom-0 z-[1300] flex items-start justify-center p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full max-w-4xl bg-paper border border-border p-12 space-y-12 shadow-2xl relative frame my-8"
            >
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-8 right-8 text-ink/20 hover:text-ink transition-colors"
              >
                <X size={32} />
              </button>

              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-ink tracking-tighter">Select Package</h3>
                  <p className="text-[10px] text-ink/40 uppercase font-bold tracking-widest">Scale Your Agentic Network</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="p-8 border border-border bg-card space-y-8 flex flex-col">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-accent/10 text-accent flex items-center justify-center rounded-xl">
                      <Users size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-ink">Soloprenuer (Pay As You Go)</h4>
                    <p className="text-sm text-ink/60 leading-relaxed">
                      Free agent for friends and family. Scale your personal reach.
                    </p>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 text-xs font-bold text-ink/80">
                      <CheckCircle2 size={16} className="text-green-500" />
                      Social Media Automation
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-ink/80">
                      <CheckCircle2 size={16} className="text-green-500" />
                      Email Distribution
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-ink/80">
                      <CheckCircle2 size={16} className="text-green-500" />
                      Free Forever
                    </div>
                  </div>
                  <div className="pt-8 space-y-4">
                    <button className="w-full bg-accent text-white font-bold py-5 uppercase tracking-widest text-xs hover:bg-ink transition-all">
                      Select Soloprenuer
                    </button>
                  </div>
                </div>

                <div className="p-8 border-2 border-accent bg-accent/5 space-y-8 flex flex-col relative">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-1 text-[10px] font-bold uppercase tracking-widest">Recommended</div>
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-accent text-white flex items-center justify-center rounded-xl">
                      <Shield size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-ink">Business</h4>
                    <p className="text-sm text-ink/60 leading-relaxed">
                      Create a subordinate agent to the existing Stacey agent. Full commercial rights.
                    </p>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 text-xs font-bold text-ink/80">
                      <CheckCircle2 size={16} className="text-green-500" />
                      Subordinate Agent Logic
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-ink/80">
                      <CheckCircle2 size={16} className="text-green-500" />
                      Advanced Sales Funnels
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-ink/80">
                      <CheckCircle2 size={16} className="text-green-500" />
                      Priority Support
                    </div>
                  </div>
                  <div className="pt-8">
                    <button className="w-full bg-ink text-paper font-bold py-5 uppercase tracking-widest text-xs hover:bg-accent transition-all">
                      Unlock Business - £49/mo
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isDemo && (
        <div className="fixed bottom-8 left-8 z-[1000] flex items-center gap-3 bg-black/80 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Demo</span>
          <span className="text-xs font-mono text-white font-bold">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
        </div>
      )}
    </div>
  );
}
