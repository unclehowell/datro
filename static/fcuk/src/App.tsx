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
  Instagram
} from 'lucide-react';
import LanguageSelector, { Language } from './components/LanguageSelector';
import AgentComputer from './components/AgentComputer';
import AvatarSection from './components/AvatarSection';
import WalletCredits from './components/WalletCredits';
import Compliance from './components/Compliance';
import OAuthAnimation from './components/OAuthAnimation';

import ThemeToggle from './components/ThemeToggle';
import Exchange from './components/Exchange';
import SignIn from './components/Auth/SignIn';
import SignUp from './components/Auth/SignUp';
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
  const [showWalletNotice, setShowWalletNotice] = useState(false);
  const [demoAgents, setDemoAgents] = useState<{id: number, isOpen: boolean, balance: number, hasInteracted: boolean, title: string}[]>([
    { id: 1, isOpen: false, balance: 0, hasInteracted: false, title: 'My FCUK Agent' }
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

    if (demoAgents.length >= 3) {
      setDemoPrompt('Sign in with the demo account to see more');
      setShowSpawnModal(false);
      return;
    }
    const nextId = Math.max(...demoAgents.map(a => a.id), 0) + 1;
    setDemoAgents([...demoAgents, { 
      id: nextId, 
      isOpen: false, 
      balance: 0, 
      hasInteracted: false,
      title: `Employee ${nextId - 1}`
    }]);
    setShowSpawnModal(false);
    setSpawnType(null);
    if (guideStep === 7) setGuideStep(8);
  };

  const handleRemoveAgent = (id: number) => {
    if (id === 1) return; // Don't let the first agent be deleted
    setDemoAgents(prev => prev.filter(a => a.id !== id));
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
            <button onClick={() => setCurrentPage('home')} className="flex items-center gap-6 group">
              <div className="w-16 h-16 bg-white flex items-center justify-center rounded-none group-hover:scale-105 transition-transform overflow-hidden p-1 shadow-sm">
                <img 
                  src="https://images.squarespace-cdn.com/content/v1/61713d3d6e5d5e5e5e5e5e5e/1634811111111-XXXXXXXXXXXX/Logo.png" 
                  alt="Finance Cheque UK Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = 'https://picsum.photos/seed/finance/100/100';
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-bold text-3xl tracking-tighter text-white leading-none">FINANCE CHEQUE UK</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent/80">Free Agentic A.I Employee</span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-8">
            {user ? (
              <button 
                onClick={() => setCurrentPage('home')}
                className="hidden md:flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-accent hover:text-white transition-colors"
              >
                <PlayCircle size={14} />
                My Agent
              </button>
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
                          onClick={() => { setCurrentPage('signin'); setIsWalletMenuOpen(false); }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-card transition-colors text-xs font-bold text-ink/70"
                        >
                          <User size={16} />
                          Sign In
                        </button>
                        <button 
                          onClick={() => { setCurrentPage('signup'); setIsWalletMenuOpen(false); }}
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
                    
                    <button 
                      onClick={() => { handleManageBilling(); setIsWalletMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-card transition-colors text-xs font-bold text-ink/70"
                    >
                      <CreditCard size={16} />
                      Billing
                    </button>
                    
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
        ) : currentPage === 'signin' ? (
          <SignIn 
            onBack={() => setCurrentPage('home')} 
            onSignIn={(user) => {
              setUser(user);
              setDashboardKey(prev => prev + 1);
              setCurrentPage('home');
            }}
          />
        ) : currentPage === 'signup' ? (
          <SignUp 
            onBack={() => setCurrentPage('home')} 
            onSignIn={() => setCurrentPage('signin')}
            onSignUp={(user) => {
              setUser(user);
              setCurrentPage('home');
            }}
          />
        ) : currentPage === 'forgot-password' ? (
          <ForgotPassword onBack={() => setCurrentPage('signin')} />
        ) : user ? (
          <div className="flex flex-col h-[calc(100vh-6rem)]">
            <Dashboard onSignOut={() => setUser(null)} variant="full" />
          </div>
        ) : (
          <div className="flex flex-col h-[calc(100vh-6rem)] relative">
            {/* Demo Manager UI */}
            <div className="absolute inset-0 z-[200] pointer-events-none">
              <div className="max-w-[1800px] mx-auto px-8 h-full grid grid-cols-3 gap-16 items-center">
                {demoAgents.map((agent, index) => (
                  <div 
                    key={agent.id} 
                    className={`flex flex-col gap-6 items-center pointer-events-auto ${
                      index === 1 ? 'col-start-2' : ''
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-ink/40">{agent.title}</div>
                      <div className="relative">
                        {/* Miniaturized Tablet Icon (Sideways) */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (guideStep === 0 && agent.id === 1) {
                              handleOpenAgent(agent.id);
                            } else {
                              handleOpenAgent(agent.id);
                            }
                          }}
                          className={`w-64 h-40 rounded-[2rem] bg-[#0a0a0a] border-4 border-[#1a1a1a] relative overflow-hidden shadow-2xl transition-all ${
                            activeAgentId === agent.id && agent.isOpen 
                              ? 'ring-4 ring-accent/20' 
                              : 'hover:border-accent/50'
                          }`}
                        >
                          {/* Screen Content - Loading Iframe */}
                          <div className="absolute inset-2 rounded-[1.4rem] bg-paper overflow-hidden flex flex-col">
                            <div className="h-3 bg-[#0a0a0a] flex items-center justify-center">
                              <div className="w-12 h-1 bg-white/10 rounded-full" />
                            </div>
                            <div className="flex-1 relative bg-black">
                              <iframe 
                                src="https://ui.financecheque.uk" 
                                className="w-full h-full border-none opacity-40 grayscale pointer-events-none scale-[0.25] origin-top-left"
                                style={{ width: '400%', height: '400%' }}
                                title={`Mini Agent ${agent.id}`}
                              />
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20">
                                <Bot size={32} className="text-accent/40" />
                              </div>
                            </div>
                          </div>
                          
                          {guideStep === 0 && agent.id === 1 && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-accent/20 backdrop-blur-[2px]">
                              <div className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center text-xl font-bold animate-bounce shadow-2xl">Start</div>
                            </div>
                          )}
                        </motion.button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 w-72">
                      <div className="flex flex-col gap-2">
                        <div className="relative">
                          <button 
                            onClick={() => handleConnectAgent(agent.id)}
                            disabled={guideStep !== 1 && agent.id === 1}
                            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-paper/80 backdrop-blur-md border border-border text-[9px] font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all rounded-xl ${
                              guideStep !== 1 && agent.id === 1 ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <Link2 size={12} />
                            Connect
                          </button>
                          {guideStep === 1 && agent.id === 1 && (
                            <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold animate-bounce shadow-lg">Step 1</div>
                          )}
                        </div>

                        <div className="relative">
                          <button 
                            onClick={() => {
                              setDemoPrompt('Sign in or Register to withdraw funds');
                              if (guideStep === 6) setGuideStep(7);
                            }}
                            disabled={guideStep !== 6 && agent.id === 1}
                            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-ink text-paper text-[9px] font-bold uppercase tracking-widest hover:bg-accent transition-all rounded-xl ${
                              guideStep !== 6 && agent.id === 1 ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <Coins size={12} />
                            £{agent.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </button>
                          {guideStep === 6 && agent.id === 1 && (
                            <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold animate-bounce shadow-lg">6</div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {agent.id !== 1 && (
                          <button 
                            onClick={() => handleRemoveAgent(agent.id)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 text-[9px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-xl"
                          >
                            <X size={12} />
                            Remove
                          </button>
                        )}

                        {/* Spawn Button - Only show after interaction */}
                        {agent.hasInteracted && (
                          <div className="relative">
                            <button 
                              onClick={handleSpawn}
                              disabled={guideStep !== 7 && agent.id === 1}
                              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-accent text-white text-[9px] font-bold uppercase tracking-widest hover:bg-ink transition-all rounded-xl ${
                                guideStep !== 7 && agent.id === 1 ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <Plus size={12} />
                              Spawn
                            </button>
                            {guideStep === 7 && agent.id === 1 && (
                              <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold animate-bounce shadow-lg">7</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

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
                !forceConnect && !hasSelectedAgent && (
                  <div className="text-center space-y-6">
                    <div className="w-24 h-24 bg-accent/10 text-accent flex items-center justify-center rounded-full mx-auto animate-pulse">
                      <Bot size={48} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold tracking-tighter">Select an Agent to Begin</h3>
                      <p className="text-ink/40 text-sm max-w-xs mx-auto">Use the icons in the top left to spawn, open, and connect your agents.</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </main>

      {/* Spawn Modal */}
      <AnimatePresence>
        {showSpawnModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-lg bg-paper border border-border p-10 space-y-8 shadow-2xl frame"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-bold text-2xl text-ink">Scale Your Network</h3>
                  <p className="text-[10px] text-ink/40 uppercase font-bold tracking-widest">Select Agent Type</p>
                </div>
                <button onClick={() => setShowSpawnModal(false)} className="text-ink/20 hover:text-ink">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <button 
                  onClick={() => setSpawnType('friend')}
                  className={`p-8 border-2 transition-all text-left space-y-4 ${spawnType === 'friend' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'}`}
                >
                  <div className="w-12 h-12 bg-accent/10 text-accent flex items-center justify-center rounded-xl">
                    <Users size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-lg">Friend / Family</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-green-500">Free Invitation</div>
                  </div>
                  <p className="text-xs text-ink/50 leading-relaxed">Invite a contact to join the network. No agent is spawned locally.</p>
                </button>

                <button 
                  onClick={() => setSpawnType('employee')}
                  className={`p-8 border-2 transition-all text-left space-y-4 ${spawnType === 'employee' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'}`}
                >
                  <div className="w-12 h-12 bg-accent/10 text-accent flex items-center justify-center rounded-xl">
                    <Bot size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-lg">Subordinate Agent</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-accent">Employee Worker</div>
                  </div>
                  <p className="text-xs text-ink/50 leading-relaxed">Spawn a new automated worker to handle additional tasks.</p>
                </button>
              </div>

              {spawnType === 'friend' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-6 border-t border-border">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30">Recipient Email</label>
                    <input 
                      type="email" 
                      placeholder="friend@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full bg-card border border-border px-4 py-3 text-sm font-medium focus:outline-none focus:border-accent"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30">Or Share Via</label>
                    <div className="flex gap-4">
                      {[Facebook, Twitter, Instagram, Globe].map((Icon, i) => (
                        <button key={i} className="w-12 h-12 bg-card border border-border flex items-center justify-center text-ink/40 hover:text-accent hover:border-accent transition-all rounded-xl">
                          <Icon size={20} />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <button 
                onClick={confirmSpawn}
                disabled={!spawnType || (spawnType === 'friend' && !inviteEmail)}
                className="w-full bg-ink text-paper font-bold py-5 uppercase tracking-widest text-sm hover:bg-accent transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                Confirm Selection
                <ArrowRight size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Compliance />

      {/* Demo Modal Removed - Now integrated into main view when logged in */}

      {!user && (
        <footer className="bg-black text-white p-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-accent flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg tracking-tighter">Finance Cheque UK</span>
            </div>
            
            <p className="text-[10px] text-white/40 leading-relaxed text-center md:text-left">
              DATRO CONSORTIUM LIMITED (13775817) • Unit 29 Highcroft Industrial Estate, Waterlooville, PO8 0BT • 02031377118
            </p>

            <div className="flex gap-6">
              <button onClick={() => setCurrentPage('docs')} className="text-[10px] font-bold uppercase tracking-widest hover:text-accent transition-colors">Docs</button>
              <button onClick={() => setCurrentPage('exchange')} className="text-[10px] font-bold uppercase tracking-widest hover:text-accent transition-colors">Exchange</button>
              <button className="text-[10px] font-bold uppercase tracking-widest hover:text-accent transition-colors">Legal</button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
