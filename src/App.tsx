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
  Trash2
} from 'lucide-react';
import LanguageSelector, { Language } from './components/LanguageSelector';
import HowItWorks from './components/HowItWorks';
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
import JobSubmitForm from './components/JobSubmitForm';
import TopupModal from './components/TopupModal';
import NetworkAgents from './components/NetworkAgents';
import ProxyGraph from './components/ProxyGraph';
import { Smartphone, Apple as AppleIcon, Monitor, PlayCircle, CreditCard } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { createWallet, creditWallet, transferToAgent, getAgentWallet } from './services/tatumService';
import type { WalletInfo } from './services/tatumService';

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
  const [currentPage, setCurrentPage] = useState<'home' | 'exchange' | 'signin' | 'signup' | 'forgot-password' | 'docs' | 'api' | 'how-it-works'>('home');
  const [user, setUser] = useState<any>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoOrientation, setDemoOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatReply, setChatReply] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [activeOAuth, setActiveOAuth] = useState<{ platform: string, icon: any } | null>(null);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');
  const [showGraph, setShowGraph] = useState(false);
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [isDemo, setIsDemo] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(() => {
    return localStorage.getItem('fcuk-cookie-consent') === 'true';
  });

  useEffect(() => {
    if (user && user.email === 'demo') {
      setIsDemo(true);
      setTimeLeft(90);
    } else {
      setIsDemo(false);
    }
  }, [user?.email]);

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
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [agentWalletBalance, setAgentWalletBalance] = useState(0);
  const [sessionWallet, setSessionWallet] = useState<WalletInfo | null>(null);
  const [agentWallet, setAgentWallet] = useState<WalletInfo | null>(null);

  // Fetch credits when user logs in
  useEffect(() => {
    if (user && user.email && user.email !== 'demo') {
      const token = localStorage.getItem('auth_token') || '';
      fetch('/api/jobs', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setUserCredits(d.credits ?? 0))
        .catch(() => {});
    } else if (user?.email === 'demo') {
      setUserCredits(50);
    } else {
      setUserCredits(0);
    }
  }, [user?.email]);

  // Check for payment success in URL (Stripe redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const credits = Number(params.get('credits'));
    if (params.get('payment') === 'success' && credits > 0) {
      setUserCredits(prev => prev + credits);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // Initialize Tatum session wallet on page load — create & credit 50 FCUK
  useEffect(() => {
    let sessionId = localStorage.getItem('fcuk_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('fcuk_session_id', sessionId);
    }
    async function initWallet() {
      try {
        const wallet = await createWallet(sessionId);
        setSessionWallet(wallet);
        if (!wallet.credited) {
          const credited = await creditWallet(sessionId, 50);
          setSessionWallet(credited);
        }
        const agent = await getAgentWallet();
        setAgentWallet(agent);
      } catch (err) {
        console.error('Wallet init failed:', err);
      }
    }
    initWallet();
  }, []);

  const handleJobSubmit = async (job: { url: string; leadAmount: number; quantity: number; creditCost: number }) => {
    setUserCredits(prev => prev - job.creditCost);
    setAgentWalletBalance(prev => prev + job.creditCost);

    const sessionId = localStorage.getItem('fcuk_session_id');
    if (sessionId && sessionWallet && sessionWallet.balance >= job.creditCost) {
      try {
        const result = await transferToAgent(sessionId, job.creditCost);
        setSessionWallet(prev => prev ? { ...prev, balance: result.senderBalance } : null);
        setAgentWallet(prev => prev ? { ...prev, balance: result.agentBalance } : { walletId: 'agent-network-wallet', balance: result.agentBalance, currency: 'FCUK', credited: true });
      } catch (err) {
        console.error('Token transfer failed:', err);
      }
    }
  };

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
    <div className="min-h-screen bg-paper selection:bg-ink selection:text-paper">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[500] bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-[1800px] mx-auto px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-16">
            <button onClick={() => setCurrentPage('home')} className="flex flex-col gap-2 group text-left">
              <span className="font-bold text-xl sm:text-3xl tracking-tighter text-white leading-none group-hover:text-accent transition-colors">FINANCE CHEQUE UK</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent/80">
                <span className="sm:hidden">marketing Agent</span>
                <span className="hidden sm:inline">Free, Fully Agentic, A.I Sales & Marketing Agent</span>
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
                    <User size={20} className="text-white" />
                    <Plus size={8} className="absolute -top-1 -right-1 text-white" />
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-white">Add</span>
                </div>
              </div>
            ) : null}

            <div className="relative">
              <button 
                onClick={() => {
                  setIsWalletMenuOpen(!isWalletMenuOpen);
                  if (onboardingStep === 7) setOnboardingStep(8);
                }}
                className="flex items-center gap-3 bg-white text-black px-8 py-3 rounded-none font-bold text-xs uppercase tracking-widest hover:bg-accent hover:text-white transition-all relative"
              >
                {onboardingStep === 7 && cookiesAccepted && (
                  <div className="absolute -left-2 -top-2 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-[10px] font-bold animate-bounce shadow-lg z-50">5</div>
                )}
                <Menu size={16} />
                Menu
                <ChevronDown size={14} className={`transition-transform ${isWalletMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isWalletMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-64 bg-paper border border-border shadow-2xl p-4 space-y-1"
                  >
                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-ink/30 border-b border-border mb-2">Account & Settings</div>
                    
                    {user && (
                      <>
                        <div className="flex items-center justify-between p-3 bg-accent/5 border border-accent/10 mb-2 relative">
                          <div className="flex items-center gap-2 text-accent">
                            <Coins size={16} />
                            <span className="text-xs font-bold">{walletBalance.toFixed(2)} FCUK</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-ink/40">{userCredits} credits</span>
                            <button
                              onClick={() => { setShowTopupModal(true); setIsWalletMenuOpen(false); }}
                              className="text-[8px] font-bold uppercase tracking-widest bg-accent text-white px-2 py-1 rounded hover:bg-ink transition-colors"
                            >
                              Top Up
                            </button>
                            <button
                              onClick={() => { 
                                setCurrentPage('exchange'); 
                                setIsWalletMenuOpen(false); 
                                if (onboardingStep === 4) setOnboardingStep(5);
                              }}
                              className="text-[8px] font-bold uppercase tracking-widest bg-accent text-white px-2 py-1 rounded hover:bg-ink transition-colors"
                            >
                              Exchange
                            </button>
                          </div>
                          {onboardingStep === 4 && user?.email === 'demo' && cookiesAccepted && (
                            <div className="absolute -left-2 -top-2 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-[10px] font-bold animate-bounce shadow-lg z-50">5</div>
                          )}
                        </div>

                        <AnimatePresence>
                          {showWalletNotice && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 bg-red-50 text-[10px] font-bold text-red-600 border border-red-100 mb-2 leading-tight">
                                Connect Gmail to your A.I agent for 5 FCUK credits.
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                    
                    {sessionWallet && !user && (
                      <>
                        <div className="flex items-center justify-between p-3 bg-accent/5 border border-accent/10 mb-2">
                          <div className="flex items-center gap-2 text-accent">
                            <Coins size={16} />
                            <span className="text-xs font-bold">{sessionWallet.balance} FCUK</span>
                          </div>
                          <span className="text-[10px] font-bold text-ink/40 tracking-widest">Visitor Wallet</span>
                        </div>
                        {agentWallet && (
                          <div className="flex items-center justify-between p-3 bg-card border border-border mb-2">
                            <div className="flex items-center gap-2 text-ink/60">
                              <Coins size={16} />
                              <span className="text-xs font-bold">{agentWallet.balance} FCUK</span>
                            </div>
                            <span className="text-[10px] font-bold text-ink/30 tracking-widest">Agent Network</span>
                          </div>
                        )}
                      </>
                    )}
                    {!user ? (
                      <button 
                        onClick={() => { setAuthModalTab('signin'); setShowAuthModal(true); setIsWalletMenuOpen(false); }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-card transition-colors text-xs font-bold text-ink/70"
                      >
                        <User size={16} />
                        Sign In / Register
                      </button>
                    ) : (
                      <button 
                        onClick={() => setUser(null)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-red-50 transition-colors text-xs font-bold text-red-500"
                      >
                        <Lock size={16} />
                        Sign Out
                      </button>
                    )}
                    
                    {user && user.email !== 'demo' && (
                      <button 
                        onClick={() => { handleManageBilling(); setIsWalletMenuOpen(false); }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-card transition-colors text-xs font-bold text-ink/70"
                      >
                        <CreditCard size={16} />
                        Billing
                      </button>
                    )}
                    
                    <div className="h-[1px] bg-border my-2" />
                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-ink/30">Navigation</div>
                    
                    <button 
                      onClick={() => { setCurrentPage('exchange'); setIsWalletMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-card transition-colors text-xs font-bold text-ink/70"
                    >
                      <Globe size={16} />
                      FCUK Exchange
                    </button>
                    <button 
                      onClick={() => { setCurrentPage('how-it-works'); setIsWalletMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-card transition-colors text-xs font-bold text-accent"
                    >
                      <BookOpen size={16} />
                      How It Works
                    </button>
                    <button 
                      onClick={() => { setCurrentPage('docs'); setIsWalletMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-card transition-colors text-xs font-bold text-ink/70"
                    >
                      <BookOpen size={16} />
                      Documentation
                    </button>
                    <button 
                      onClick={() => { setShowGraph(true); setIsWalletMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-card transition-colors text-xs font-bold text-accent"
                    >
                      <Layers size={16} />
                      Network Graph
                    </button>

                    <div className="h-[1px] bg-border my-2" />
                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-ink/30">Preferences</div>
                    
                    <div className="flex items-center justify-between p-3">
                      <span className="text-xs font-bold text-ink/70">Theme</span>
                      <ThemeToggle />
                    </div>
                    <div className="flex items-center justify-between p-3">
                      <span className="text-xs font-bold text-ink/70">Language</span>
                      <LanguageSelector currentLang={lang} onLangChange={setLang} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Removed - Wallet Menu Replaces It */}

      <main className="pt-24">
        {currentPage === 'how-it-works' ? (
          <HowItWorks onBack={() => setCurrentPage('home')} />
        ) : currentPage === 'exchange' ? (
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
              <h2 className="text-5xl font-bold tracking-tighter">How Finance Cheque UK Works.</h2>
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
        ) : currentPage === 'api' ? (
          <div className="max-w-4xl mx-auto p-12 lg:p-24 space-y-16">
            <section className="space-y-8">
              <h2 className="text-5xl font-bold tracking-tighter">Parent Proxy API.</h2>
              <p className="text-lg text-ink/60 leading-relaxed">
                The Finance Cheque parent proxy orchestrates a distributed network of child proxy nodes.
                It handles registration, health monitoring, AI chat routing, and OpenRouter-backed completions.
                All endpoints live under <code className="bg-accent/10 text-accent px-2 py-0.5 text-sm font-mono">https://www.financecheque.uk/api/proxy</code>.
              </p>
            </section>

            <section className="space-y-8">
              <h2 className="text-3xl font-bold tracking-tighter">Endpoints</h2>

              <div className="space-y-6">
                <div className="p-8 frame space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">POST</span>
                    <code className="text-sm font-mono">/api/proxy?action=register</code>
                  </div>
                  <p className="text-xs text-ink/50 leading-relaxed">Register a child proxy node in the network. Child proxies call this on startup so the parent knows how to reach them.</p>
                  <pre className="bg-black/5 dark:bg-white/5 p-4 text-xs font-mono overflow-x-auto rounded">{
`{
  "childId": "aws-172-31-29-216",
  "url": "http://172.31.29.216:4001",
  "version": "1.0.0",
  "machine_name": "aws-prod-1"
}`}</pre>
                  <div className="text-xs text-ink/50"><span className="text-accent font-bold">Response:</span> <code>{"{ \"ok\": true, \"machine_id\": \"aws-172-31-29-216\" }"}</code></div>
                </div>

                <div className="p-8 frame space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">POST</span>
                    <code className="text-sm font-mono">/api/proxy?action=heartbeat</code>
                  </div>
                  <p className="text-xs text-ink/50 leading-relaxed">Periodic heartbeat from child proxies (typically every 30s). Keeps the node marked as online.</p>
                  <pre className="bg-black/5 dark:bg-white/5 p-4 text-xs font-mono overflow-x-auto rounded">{
`{
  "childId": "aws-172-31-29-216",
  "load": 3
}`}</pre>
                  <div className="text-xs text-ink/50"><span className="text-accent font-bold">Response:</span> <code>{"{ \"ok\": true }"}</code></div>
                </div>

                <div className="p-8 frame space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">GET</span>
                    <code className="text-sm font-mono">/api/proxy/nodes</code>
                  </div>
                  <p className="text-xs text-ink/50 leading-relaxed">List all active proxy nodes seen within the last hour. Returns their machine info and last-seen timestamp.</p>
                  <pre className="bg-black/5 dark:bg-white/5 p-4 text-xs font-mono overflow-x-auto rounded">{
`[
  {
    "machine_id": "aws-172-31-29-216",
    "machine_name": "aws-prod-1",
    "ip_address": "172.31.29.216",
    "proxy_port": 6000,
    "version": "1.0.0",
    "last_seen": "2026-05-21 12:00:00"
  }
]`}</pre>
                </div>

                <div className="p-8 frame space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">POST</span>
                    <code className="text-sm font-mono">/api/proxy/chat</code>
                  </div>
                  <p className="text-xs text-ink/50 leading-relaxed">Simple chat endpoint. Sends a message to OpenRouter (auto model) and returns the AI reply. Falls back to echo if OpenRouter is unavailable.</p>
                  <pre className="bg-black/5 dark:bg-white/5 p-4 text-xs font-mono overflow-x-auto rounded">{
`{
  "message": "What services do you offer?",
  "sessionId": "abc123"
}`}</pre>
                  <div className="text-xs text-ink/50"><span className="text-accent font-bold">Response:</span> <code>{"{ \"ok\": true, \"reply\": \"We offer...\" }"}</code></div>
                </div>

                <div className="p-8 frame space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">POST</span>
                    <code className="text-sm font-mono">/api/proxy/v1/chat/completions</code>
                  </div>
                  <p className="text-xs text-ink/50 leading-relaxed">OpenAI-compatible chat completions endpoint. Routes through the proxy network. When multiple child nodes are online, responses include routing metadata via the <code className="bg-accent/10 text-accent px-1 text-[10px] font-mono">X-Chat-Only</code> header.</p>
                  <pre className="bg-black/5 dark:bg-white/5 p-4 text-xs font-mono overflow-x-auto rounded">{
`{
  "model": "openrouter/auto",
  "messages": [
    { "role": "user", "content": "Hello!" }
  ]
}`}</pre>
                  <p className="text-xs text-ink/50 mt-2"><span className="text-accent font-bold">Headers:</span> <code className="text-[10px] font-mono">X-Machine-ID</code> (origin node identifier)</p>
                  <div className="text-xs text-ink/50"><span className="text-accent font-bold">Response:</span> Standard OpenAI chat completion with <code className="text-[10px] font-mono">_proxy</code> metadata block.</div>
                </div>

                <div className="p-8 frame space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">POST</span>
                    <code className="text-sm font-mono">/api/proxy?action=chat</code>
                  </div>
                  <p className="text-xs text-ink/50 leading-relaxed">Dispatch a chat message to the least-loaded online child proxy. Returns the child's response or a 503 if no child proxies are available.</p>
                  <pre className="bg-black/5 dark:bg-white/5 p-4 text-xs font-mono overflow-x-auto rounded">{
`{
  "message": "Process this request",
  "chat_only": true
}`}</pre>
                  <div className="text-xs text-ink/50"><span className="text-accent font-bold">Response:</span> <code>{"{ \"ok\": true, \"routedTo\": \"aws-...\", \"childUrl\": \"http://...\", \"reply\": \"...\" }"}</code></div>
                </div>

                <div className="p-8 frame space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">GET</span>
                    <code className="text-sm font-mono">/api/proxy</code>
                  </div>
                  <p className="text-xs text-ink/50 leading-relaxed">List all online child proxies seen within the last 60 seconds.</p>
                  <div className="text-xs text-ink/50"><span className="text-accent font-bold">Response:</span> Array of <code className="text-[10px] font-mono">{"{ id, url, load, last_seen }"}</code></div>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <h2 className="text-3xl font-bold tracking-tighter">Child Proxy Integration</h2>
              <p className="text-xs text-ink/50 leading-relaxed">
                Child proxies run on remote machines (e.g., AWS EC2) and register with the parent at startup.
                The <code className="bg-accent/10 text-accent px-1 font-mono">child-proxy.js</code> script handles registration, heartbeat, and job execution via Hermes/Kiro agents.
                Set <code className="bg-accent/10 text-accent px-1 font-mono">PARENT_URL</code> to <code className="bg-accent/10 text-accent px-1 font-mono">https://www.financecheque.uk</code> and run.
              </p>
              <pre className="bg-black/5 dark:bg-white/5 p-4 text-xs font-mono overflow-x-auto rounded">{
`PARENT_URL=https://www.financecheque.uk \\  
CHILD_ID=aws-my-node \\  
SELF_URL=http://<public-ip>:4001 \\  
node child-proxy.js`}</pre>
            </section>
          </div>
        ) : currentPage === 'forgot-password' ? (
          <ForgotPassword onBack={() => { setCurrentPage('home'); setShowAuthModal(true); }} />
        ) : (user && user.email !== 'demo') ? (
          <div className="flex flex-col h-[calc(100vh-6rem)]">
            {/* Authenticated user: show job form + pipeline + dashboard */}
            <div className="max-w-5xl mx-auto w-full px-6 py-12 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Job Submit Form */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tighter">Generate Leads</h2>
                    <p className="text-xs text-ink/40 mt-1">Enter your webapp URL. Lead value auto-detects. Credits move to agent wallet on submission.</p>
                  </div>
                  <JobSubmitForm
                    user={user}
                    credits={userCredits}
                    onSubmit={handleJobSubmit}
                    onAuthRequired={() => { setAuthModalTab('signin'); setShowAuthModal(true); }}
                    onTopup={() => setShowTopupModal(true)}
                  />
                  {userCredits === 0 && (
                    <button
                      onClick={() => setShowTopupModal(true)}
                      className="w-full border border-accent text-accent font-bold py-3 uppercase tracking-widest text-xs hover:bg-accent hover:text-white transition-all"
                    >
                      Top Up Credits
                    </button>
                  )}
                </div>
                {/* Pipeline Illustration */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tighter">Agent Network</h2>
                      <p className="text-xs text-ink/40 mt-1">Live child proxy nodes. Click a circle to open the UI.</p>
                    </div>
                    {agentWallet && (
                      <div className="ml-auto bg-accent/5 border border-accent/20 px-4 py-2 text-right shrink-0">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-accent">Agent Wallet</div>
                        <div className="text-lg font-bold text-accent">{agentWallet.balance} FCUK</div>
                      </div>
                    )}
                  </div>
                  <NetworkAgents
                    onChatOpen={() => {
                      if (!user) { setAuthModalTab('signin'); setShowAuthModal(true); return; }
                      setShowContactModal(true);
                    }}
                    onExchange={() => setCurrentPage('exchange')}
                    onSpawn={handleSpawn}
                  />
                </div>
              </div>
            </div>
            <div className="flex-1">
              <Dashboard onSignOut={() => setUser(null)} variant="full" />
            </div>
          </div>
        ) : (
          <>
            {/* Pre-auth hero: job form + pipeline illustration */}
            <div className="max-w-5xl mx-auto w-full px-6 pt-12 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tighter text-white">Generate Leads</h2>
                    <p className="text-xs text-white/40 mt-1">Enter your webapp URL. Lead value auto-detects. Sign in to submit.</p>
                  </div>
                  {sessionWallet && (
                    <div className="ml-auto bg-white/5 border border-white/10 px-4 py-2 text-right shrink-0">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-accent">Your Wallet</div>
                      <div className="text-lg font-bold text-white">{sessionWallet.balance} FCUK</div>
                    </div>
                  )}
                </div>
                <JobSubmitForm
                  user={user}
                  credits={sessionWallet?.balance ?? 0}
                  onSubmit={handleJobSubmit}
                  onAuthRequired={() => { setAuthModalTab('signin'); setShowAuthModal(true); }}
                  onTopup={() => setShowTopupModal(true)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tighter text-white">Agent Network</h2>
                    <p className="text-xs text-white/40 mt-1">Live child proxy nodes connected to the parent proxy.</p>
                  </div>
                  {agentWallet && (
                    <div className="ml-auto bg-white/5 border border-white/10 px-4 py-2 text-right shrink-0">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-accent">Agent Wallet</div>
                      <div className="text-lg font-bold text-white">{agentWallet.balance} FCUK</div>
                    </div>
                  )}
                </div>
                <NetworkAgents
                  onChatOpen={() => {
                    if (!user) { setAuthModalTab('signin'); setShowAuthModal(true); return; }
                    setShowContactModal(true);
                  }}
                  onExchange={() => setCurrentPage('exchange')}
                  onSpawn={handleSpawn}
                />
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
                className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
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

      <TopupModal
        isOpen={showTopupModal}
        onClose={() => setShowTopupModal(false)}
        currentCredits={userCredits}
        onSuccess={(credits) => setUserCredits(prev => prev + credits)}
      />

      {/* Demo Modal Removed - Now integrated into main view when logged in */}

      {!user && (
        <FooterWithVersion setCurrentPage={setCurrentPage} />
      )}

      {/* Modals */}
      <AnimatePresence>
        {/* Chat popup — bottom-right panel */}
        {showContactModal && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-[1000] w-80 sm:w-96 bg-paper border border-border shadow-2xl frame overflow-hidden"
          >
            <div className="bg-accent text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Chat</span>
              </div>
              <button onClick={() => setShowContactModal(false)} className="text-white/60 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-[10px] text-ink/40 uppercase tracking-wider font-bold">Ask anything — chat only, no agentic actions.</p>
              <textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    document.getElementById('chat-send-btn')?.click();
                  }
                }}
                placeholder="Type your message..."
                className="w-full border border-border bg-card p-3 text-sm min-h-20 resize-none"
              />
              {chatReply && (
                <div className="text-xs bg-accent/5 border border-accent/10 p-3 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {chatReply}
                </div>
              )}
              <button
                id="chat-send-btn"
                disabled={isChatting || !chatMessage.trim()}
                onClick={async () => {
                  setIsChatting(true);
                  setChatReply('');
                  try {
                    const resp = await fetch('/api/proxy', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        message: chatMessage.trim(),
                        sessionId: 'fcuk-web-' + (localStorage.getItem('fcuk_session_id') || 'anon'),
                        chat_only: true,
                        action: 'chat',
                      }),
                    });
                    const data = await resp.json();
                    setChatReply(data.reply || data.error || 'No response');
                  } catch {
                    setChatReply('Unable to reach parent proxy.');
                  } finally {
                    setIsChatting(false);
                  }
                }}
                className="w-full bg-ink text-paper py-3 text-xs font-bold uppercase tracking-widest hover:bg-accent disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isChatting ? (
                  <><div className="w-3 h-3 border-2 border-paper/30 border-t-paper rounded-full animate-spin" /> Sending...</>
                ) : (
                  <><Send size={14} /> Send</>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Floating chat button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowContactModal(true)}
          className="fixed bottom-6 right-6 z-[900] w-14 h-14 bg-accent text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-ink transition-all"
        >
          <MessageCircle size={24} />
        </motion.button>

        {showLogoutWarning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-[106px] left-0 right-0 bottom-0 z-[1000] flex items-start justify-center p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full max-w-sm bg-paper border border-border p-10 space-y-8 shadow-2xl frame text-center my-8"
            >
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
            className="fixed top-[106px] left-0 right-0 bottom-0 z-[1000] flex items-start justify-center p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full max-w-4xl bg-paper border border-border p-12 space-y-12 shadow-2xl frame my-8"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-ink tracking-tighter">Select Package</h3>
                  <p className="text-[10px] text-ink/40 uppercase font-bold tracking-widest">Scale Your Agentic Network</p>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="text-ink/20 hover:text-ink">
                  <X size={32} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8">
                {/* Personal Package */}
                <div className="p-8 border border-border bg-card space-y-8 flex flex-col">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-accent/10 text-accent flex items-center justify-center rounded-xl">
                      <Users size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-ink">Personal Package</h4>
                    <p className="text-sm text-ink/60 leading-relaxed">
                      Free agent for friends and family. Share your success across social platforms.
                    </p>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 text-xs font-bold text-ink/80">
                      <CheckCircle2 size={16} className="text-green-500" />
                      Social Media Sharing
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
                    <div className="flex items-center gap-4 justify-center">
                      <button className="p-3 bg-blue-500 text-white rounded-full hover:scale-110 transition-transform">
                        <Facebook size={20} />
                      </button>
                      <button className="p-3 bg-sky-400 text-white rounded-full hover:scale-110 transition-transform">
                        <Twitter size={20} />
                      </button>
                      <button className="p-3 bg-ink text-white rounded-full hover:scale-110 transition-transform">
                        <Mail size={20} />
                      </button>
                    </div>
                    <button className="w-full bg-accent text-white font-bold py-5 uppercase tracking-widest text-xs hover:bg-ink transition-all">
                      Select Personal
                    </button>
                  </div>
                </div>

                {/* Business Package */}
                <div className="p-8 border-2 border-accent bg-accent/5 space-y-8 flex flex-col relative">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-1 text-[10px] font-bold uppercase tracking-widest">Recommended</div>
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-accent text-white flex items-center justify-center rounded-xl">
                      <Shield size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-ink">Business Package</h4>
                    <p className="text-sm text-ink/60 leading-relaxed">
                      Create a subordinate agent to the existing CEO agent. Full commercial rights.
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

      {/* Full-screen Proxy Graph Modal */}
      <AnimatePresence>
        {showGraph && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black"
            onClick={() => setShowGraph(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full h-full flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-3 bg-[#0a0a0a] border-b border-white/5 z-10">
                <div className="flex items-center gap-3">
                  <Layers size={16} className="text-accent" />
                  <span className="text-xs font-bold uppercase tracking-widest text-white/60">Child Proxy Architecture</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[9px] text-white/20 font-mono">Drag nodes · Scroll to zoom</span>
                  <button onClick={() => setShowGraph(false)} className="text-white/30 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 relative">
                <ProxyGraph />
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

function FooterWithVersion({ setCurrentPage }: { setCurrentPage: (page: any) => void }) {
  const [ver, setVer] = useState('');
  useEffect(() => {
    fetch('/api/version').then(r => r.json()).then(d => setVer(d.version || '')).catch(() => {});
  }, []);
  return (
    <footer className="bg-black text-white/40 p-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="font-bold text-sm tracking-tighter text-white/60">Finance Cheque UK{ver ? <span className="ml-2 text-[10px] font-mono text-white/20 align-middle">v{ver}</span> : null}</span>
        <p className="text-[9px] uppercase tracking-widest">
          DATRO CONSORTIUM LIMITED • Waterlooville, PO8 0BT • 02031377118
        </p>
        <div className="flex gap-4">
          <button onClick={() => setCurrentPage('how-it-works')} className="text-[9px] font-bold uppercase tracking-widest hover:text-accent transition-colors">How It Works</button>
          <button onClick={() => setCurrentPage('docs')} className="text-[9px] font-bold uppercase tracking-widest hover:text-accent transition-colors">Docs</button>
          <button onClick={() => setCurrentPage('api')} className="text-[9px] font-bold uppercase tracking-widest hover:text-accent transition-colors">API</button>
          <button onClick={() => setCurrentPage('exchange')} className="text-[9px] font-bold uppercase tracking-widest hover:text-accent transition-colors">Exchange</button>
        </div>
      </div>
    </footer>
  );
}
