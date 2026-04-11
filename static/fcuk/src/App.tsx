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
  ExternalLink,
  Link2,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  MessageCircle,
  Send
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
import { Smartphone, Apple as AppleIcon, Monitor, PlayCircle, CreditCard } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'exchange' | 'signin' | 'signup' | 'forgot-password' | 'docs'>('home');
  const [user, setUser] = useState<any>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoOrientation, setDemoOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [isDemo, setIsDemo] = useState(false);

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
  const [demoAgents, setDemoAgents] = useState<{id: number, isOpen: boolean, balance: number, hasInteracted: boolean, title: string, isSpawned: boolean}[]>([
    { id: 1, isOpen: false, balance: 0, hasInteracted: false, title: 'CEO', isSpawned: true },
    { id: 2, isOpen: false, balance: 0, hasInteracted: false, title: 'Employee 1', isSpawned: false },
    { id: 3, isOpen: false, balance: 0, hasInteracted: false, title: 'Employee 2', isSpawned: false }
  ]);
  const [showSpawnModal, setShowSpawnModal] = useState(false);
  const [spawnType, setSpawnType] = useState<'friend' | 'employee' | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [demoPrompt, setDemoPrompt] = useState<string | null>(null);
  const [activeAgentId, setActiveAgentId] = useState<number | null>(null);
  const [forceConnect, setForceConnect] = useState(false);
  const [guideStep, setGuideStep] = useState(0);

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
      if (guideStep === 7) setGuideStep(8);
      return;
    }

    const nextAgent = demoAgents.find(a => !a.isSpawned);
    if (!nextAgent) {
      setDemoPrompt('Sign in with the demo account to see more');
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
    if (guideStep === 7) setGuideStep(8);
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
      setDemoPrompt('Sign in with the demo account to see more');
      return;
    }
    setDemoAgents(prev => prev.map(a => ({ ...a, isOpen: a.id === id })));
    setActiveAgentId(id);
    setHasSelectedAgent(true);
    if (guideStep === 0) setGuideStep(1);
  };

  const handleConnectAgent = (id: number) => {
    if (id !== 1) {
      setDemoPrompt('Sign in with the demo account to see more');
      return;
    }
    handleOpenAgent(id);
    setForceConnect(true);
    if (guideStep === 1) setGuideStep(2);
  };

  const handleAgentAuthorize = (id: number, amount: number) => {
    setDemoAgents(prev => prev.map(a => 
      a.id === id ? { ...a, balance: a.balance + amount, hasInteracted: true } : a
    ));
    setForceConnect(false);
    if (guideStep === 5) setGuideStep(6);
  };

  const isDemoUser = user?.email === 'demo@example.com';

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
              <span className="font-bold text-3xl tracking-tighter text-white leading-none group-hover:text-accent transition-colors">FINANCE CHEQUE UK</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent/80">Free, Fully Agentic, A.I Sales & Marketing Agent</span>
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
                onClick={() => setIsWalletMenuOpen(!isWalletMenuOpen)}
                className="flex items-center gap-3 bg-white text-black px-8 py-3 rounded-none font-bold text-xs uppercase tracking-widest hover:bg-accent hover:text-white transition-all"
              >
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
                        <div className="flex items-center justify-between p-3 bg-accent/5 border border-accent/10 mb-2">
                          <div className="flex items-center gap-2 text-accent">
                            <Coins size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">£1,240.50</span>
                          </div>
                          <button 
                            onClick={() => setShowWalletNotice(!showWalletNotice)}
                            className="relative p-1 text-accent hover:bg-accent/10 rounded-full transition-colors"
                          >
                            <Bell size={14} />
                            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-paper" />
                          </button>
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
                    
                    {!user ? (
                      <>
                        <button 
                          onClick={() => { setAuthModalTab('signin'); setShowAuthModal(true); setIsWalletMenuOpen(false); }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-card transition-colors text-xs font-bold text-ink/70"
                        >
                          <User size={16} />
                          Sign In
                        </button>
                        <button 
                          onClick={() => { setAuthModalTab('signup'); setShowAuthModal(true); setIsWalletMenuOpen(false); }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-card transition-colors text-xs font-bold text-ink/70"
                        >
                          <Users size={16} />
                          Register
                        </button>
                      </>
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
                      onClick={() => { setCurrentPage('docs'); setIsWalletMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-card transition-colors text-xs font-bold text-accent"
                    >
                      <BookOpen size={16} />
                      Documentation
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
        {currentPage === 'exchange' ? (
          <Exchange />
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
        ) : currentPage === 'forgot-password' ? (
          <ForgotPassword onBack={() => { setCurrentPage('home'); setShowAuthModal(true); }} />
        ) : (user && user.email !== 'demo') ? (
          <div className="flex flex-col h-[calc(100vh-6rem)]">
            <Dashboard onSignOut={() => setUser(null)} variant="full" />
          </div>
        ) : (
          <>
            <div className="flex flex-col h-[calc(100vh-6rem)] relative">
              {/* Demo Manager UI */}
              <div className="absolute inset-0 z-[200] pointer-events-none overflow-y-auto">
                <div className="max-w-[1800px] mx-auto px-8 py-24 min-h-full flex items-center justify-center">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-16 sm:gap-20 lg:gap-24 items-center justify-items-center w-full">
                    {/* CEO Silhouette */}
                    <div className="flex flex-col items-center gap-6 pointer-events-auto">
                      {/* Silhouette */}
                      <div className="relative">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleOpenAgent(1)}
                          className={`w-32 h-32 rounded-full bg-[#0a0a0a] border-4 border-[#1a1a1a] relative overflow-hidden shadow-2xl transition-all flex items-center justify-center hover:border-accent/50`}
                        >
                          <User size={60} className="text-accent/20" />
                          {guideStep === 0 && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-accent/20 backdrop-blur-[2px]">
                              <div className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center text-[10px] font-bold animate-bounce shadow-2xl">Start</div>
                            </div>
                          )}
                        </motion.button>
                      </div>

                      {/* Controls Stack */}
                      <div className="flex flex-col items-center gap-4 w-[200px]">
                        <div className="flex items-center justify-center gap-3 w-full">
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => setShowContactModal(true)}
                              className="hover:scale-110 transition-transform opacity-90 hover:opacity-100"
                            >
                              <Mail size={16} className="text-accent" />
                            </button>
                            <button 
                              onClick={() => setShowContactModal(true)}
                              className="hover:scale-110 transition-transform opacity-90 hover:opacity-100"
                            >
                              <img 
                                src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
                                alt="WhatsApp" 
                                className="w-5 h-5 object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </button>
                            <button 
                              onClick={() => setShowContactModal(true)}
                              className="hover:scale-110 transition-transform opacity-90 hover:opacity-100"
                            >
                              <img 
                                src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" 
                                alt="Telegram" 
                                className="w-5 h-5 object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </button>
                          </div>
                          <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-ink/80 truncate whitespace-nowrap">CEO</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 w-full">
                          <button className="flex items-center justify-center gap-2 bg-card border border-border py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest text-ink/40 hover:text-accent hover:border-accent transition-all">
                            <Zap size={12} />
                            Connect
                          </button>
                          <button className="flex items-center justify-center gap-2 bg-card border border-border py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest text-ink/40 hover:text-accent hover:border-accent transition-all">
                            <Coins size={12} />
                            Balance
                          </button>
                          <button className="flex items-center justify-center gap-2 bg-card border border-border py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest text-ink/40 hover:text-accent hover:border-accent transition-all">
                            <Plus size={12} />
                            Spawn
                          </button>
                          <button className="flex items-center justify-center gap-2 bg-card border border-border py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest text-ink/40 hover:text-accent hover:border-accent transition-all">
                            <X size={12} />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Add Agent Silhouettes */}
                    {[2, 3, 4].map((id) => (
                      <div key={id} className={`flex flex-col items-center gap-6 pointer-events-auto opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0 ${id === 2 ? 'hidden sm:flex' : id === 3 ? 'hidden lg:flex' : 'hidden xl:flex'}`}>
                        {/* Silhouette */}
                        <div className="relative">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              if (!user) {
                                setAuthModalTab('signup');
                                setShowAuthModal(true);
                              } else if (user.email === 'demo') {
                                setShowPaymentModal(true);
                              }
                            }}
                            className="w-32 h-32 rounded-full bg-[#0a0a0a]/30 border-4 border-[#1a1a1a] border-dashed relative overflow-hidden shadow-xl transition-all flex items-center justify-center hover:border-accent/50 group"
                          >
                            <div className="relative">
                              <User size={60} className="text-accent/5 opacity-20" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Plus size={24} className="text-accent/40 group-hover:text-accent transition-colors" />
                              </div>
                            </div>
                          </motion.button>
                        </div>

                        {/* Controls Stack */}
                        <div className="flex flex-col items-center gap-4 w-[200px]">
                          <div className="flex items-center justify-center gap-3 w-full">
                            <div className="flex items-center gap-1.5">
                              <button disabled className="opacity-50">
                                <Mail size={16} className="text-accent" />
                              </button>
                              <button disabled className="opacity-50">
                                <img 
                                  src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
                                  alt="WhatsApp" 
                                  className="w-5 h-5 object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              </button>
                              <button disabled className="opacity-50">
                                <img 
                                  src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" 
                                  alt="Telegram" 
                                  className="w-5 h-5 object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              </button>
                            </div>
                            <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-ink/40 truncate whitespace-nowrap">Add Agent</div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 w-full">
                            <button disabled className="flex items-center justify-center gap-2 bg-card/50 border border-border/50 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest text-ink/20">
                              <Zap size={12} />
                              Connect
                            </button>
                            <button disabled className="flex items-center justify-center gap-2 bg-card/50 border border-border/50 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest text-ink/20">
                              <Coins size={12} />
                              Balance
                            </button>
                            <button disabled className="flex items-center justify-center gap-2 bg-card/50 border border-border/50 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest text-ink/20">
                              <Plus size={12} />
                              Spawn
                            </button>
                            <button disabled className="flex items-center justify-center gap-2 bg-card/50 border border-border/50 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest text-ink/20">
                              <X size={12} />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <AuthModal 
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                initialTab={authModalTab}
                onNavigate={(page) => setCurrentPage(page)}
                onAuthSuccess={(user) => {
                  setUser(user);
                  setShowAuthModal(false);
                  setDashboardKey(prev => prev + 1);
                }}
              />

              <AnimatePresence>
                {demoPrompt && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="mt-4 bg-accent text-white px-6 py-3 rounded-xl text-xs font-bold shadow-2xl relative"
                  >
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 border-8 border-transparent border-r-accent" />
                    {demoPrompt}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1 flex items-center justify-center">
              {activeAgentId && demoAgents.find(a => a.id === activeAgentId)?.isOpen ? (
                <Dashboard 
                  reloadKey={dashboardKey}
                  onSignOut={() => setUser(null)} 
                  onClose={() => {
                    setDemoAgents(prev => prev.map(a => ({ ...a, isOpen: false })));
                    setForceConnect(false);
                  }}
                  variant="mobile" 
                  forceConnect={forceConnect}
                  initialBalance={demoAgents.find(a => a.id === activeAgentId)?.balance}
                  onAuthorize={(amount) => handleAgentAuthorize(activeAgentId, amount)}
                  guideStep={guideStep}
                  onGuideStepChange={setGuideStep}
                  onConnectAttempt={() => {
                    setDemoPrompt('Sign in with the demo account to see more');
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

      <Compliance />

      {/* Demo Modal Removed - Now integrated into main view when logged in */}

      {!user && (
        <footer className="bg-black text-white/40 p-6 border-t border-white/5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="font-bold text-sm tracking-tighter text-white/60">Finance Cheque UK</span>
            <p className="text-[9px] uppercase tracking-widest">
              DATRO CONSORTIUM LIMITED • Waterlooville, PO8 0BT • 02031377118
            </p>
            <div className="flex gap-4">
              <button onClick={() => setCurrentPage('docs')} className="text-[9px] font-bold uppercase tracking-widest hover:text-accent transition-colors">Docs</button>
              <button onClick={() => setCurrentPage('exchange')} className="text-[9px] font-bold uppercase tracking-widest hover:text-accent transition-colors">Exchange</button>
            </div>
          </div>
        </footer>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm bg-paper border border-border p-10 space-y-8 shadow-2xl frame text-center"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-accent/10 text-accent flex items-center justify-center rounded-full">
                  <User size={32} />
                </div>
                <h3 className="text-xl font-bold text-ink">Sign in to speak to your free agent</h3>
              </div>
              <button 
                onClick={() => setShowContactModal(false)}
                className="w-full bg-ink text-paper font-bold py-4 uppercase tracking-widest text-xs hover:bg-accent transition-all"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}

        {showLogoutWarning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm bg-paper border border-border p-10 space-y-8 shadow-2xl frame text-center"
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
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-4xl bg-paper border border-border p-12 space-y-12 shadow-2xl frame"
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
