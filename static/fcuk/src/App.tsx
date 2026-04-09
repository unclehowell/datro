import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
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
  CheckCircle2
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
import { Smartphone, Apple as AppleIcon, Monitor, PlayCircle } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'exchange' | 'signin' | 'signup' | 'forgot-password'>('home');

  const content = {
    en: {
      heroTitle: "A free, income generating",
      heroTitleAccent: "A.I entrepreneur, for everyone.",
      heroSub: "Your agent provides an estimate of your weekly income through FCUK coins. Payouts are made every Sunday directly to your bank account for doing 'favours for your agent'—like connecting your social accounts.",
      cta: "Get Early Access",
      docs: "Documentation",
      api: "API Reference",
      features: "Features",
      plans: "Plans",
      exchange: "Exchange",
      subAgentTitle: "Scale Your Network",
      subAgentDesc: "Spawn sub-agents as subordinates or associates to build a multi-layered affiliate empire. Your agents work 24/7 while you earn."
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

  return (
    <div className="min-h-screen bg-paper selection:bg-ink selection:text-paper">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] bg-paper/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1800px] mx-auto px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-16">
            <button onClick={() => setCurrentPage('home')} className="font-bold text-3xl tracking-tighter text-ink">Finance Cheque UK</button>
            <div className="hidden lg:flex items-center gap-10">
              <a href="#features" className="text-[11px] uppercase tracking-widest font-bold text-ink/40 hover:text-ink transition-colors">{t.features}</a>
              <a href="#plans" className="text-[11px] uppercase tracking-widest font-bold text-ink/40 hover:text-ink transition-colors">{t.plans}</a>
              <button 
                onClick={() => setCurrentPage('exchange')}
                className={`text-[11px] uppercase tracking-widest font-bold transition-colors ${currentPage === 'exchange' ? 'text-accent' : 'text-ink/40 hover:text-ink'}`}
              >
                {t.exchange}
              </button>
              <button 
                className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-accent hover:text-ink transition-colors"
              >
                <PlayCircle size={14} />
                Demo
              </button>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <ThemeToggle />
            <LanguageSelector currentLang={lang} onLangChange={setLang} />
            <div className="hidden md:flex items-center gap-4">
              <button 
                onClick={() => setCurrentPage('signin')}
                className="text-[11px] uppercase tracking-widest font-bold text-ink/40 hover:text-ink transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => setCurrentPage('signup')}
                className="flex items-center gap-3 bg-ink text-paper px-8 py-3 rounded-none font-bold text-xs uppercase tracking-widest hover:bg-accent transition-all"
              >
                Register
                <ChevronRight size={14} />
              </button>
            </div>
            <button className="lg:hidden text-ink" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[90] bg-paper pt-32 px-12 lg:hidden"
          >
            <div className="flex flex-col gap-12">
              <button onClick={() => { setCurrentPage('home'); setIsMenuOpen(false); }} className="text-5xl font-bold tracking-tighter text-left">{t.features}</button>
              <button onClick={() => { setCurrentPage('home'); setIsMenuOpen(false); }} className="text-5xl font-bold tracking-tighter text-left">{t.plans}</button>
              <button onClick={() => { setCurrentPage('exchange'); setIsMenuOpen(false); }} className="text-5xl font-bold tracking-tighter text-left">{t.exchange}</button>
              <button onClick={() => { setCurrentPage('signin'); setIsMenuOpen(false); }} className="text-5xl font-bold tracking-tighter text-left">Sign In</button>
              <button onClick={() => { setCurrentPage('signup'); setIsMenuOpen(false); }} className="text-5xl font-bold tracking-tighter text-left">Register</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-24">
        {currentPage === 'exchange' ? (
          <Exchange />
        ) : currentPage === 'signin' ? (
          <SignIn 
            onBack={() => setCurrentPage('home')} 
            onSignUp={() => setCurrentPage('signup')}
            onForgotPassword={() => setCurrentPage('forgot-password')}
          />
        ) : currentPage === 'signup' ? (
          <SignUp 
            onBack={() => setCurrentPage('home')} 
            onSignIn={() => setCurrentPage('signin')}
          />
        ) : currentPage === 'forgot-password' ? (
          <ForgotPassword onBack={() => setCurrentPage('signin')} />
        ) : (
          <>
            {/* Hero Section - Split Layout */}
            <section className="min-h-[calc(100vh-6rem)] grid grid-cols-1 lg:grid-cols-2 border-b border-border">
              <div className="p-12 lg:p-24 flex flex-col justify-center space-y-12 border-r border-border bg-card">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-12 h-[1px] bg-accent" />
                  <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-accent">UK's #1 AI Affiliate Platform</span>
                </motion.div>
                
                <div className="space-y-8">
                  <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] text-ink"
                  >
                    {t.heroTitle}<br />
                    <span className="text-accent">{t.heroTitleAccent}</span>
                  </motion.h1>

                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-ink/50 max-w-xl leading-relaxed font-medium"
                  >
                    {t.heroSub}
                  </motion.p>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-6"
                >
                  <button 
                    onClick={() => setCurrentPage('signup')}
                    className="bg-ink text-paper px-12 py-5 rounded-none font-bold text-lg uppercase tracking-widest hover:bg-accent transition-all"
                  >
                    Get my free agent
                  </button>
                  <button className="bg-transparent border border-border text-ink px-12 py-5 rounded-none font-bold text-lg uppercase tracking-widest hover:bg-paper transition-all">
                    See it in action
                  </button>
                </motion.div>
              </div>

              <div className="relative bg-paper flex items-center justify-center p-12 lg:p-24 overflow-hidden">
                <div className="absolute top-12 right-12 rail-text">EST. 2024 • LONDON • UK</div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="w-full max-w-xl relative z-10"
                >
                  <OAuthAnimation />
                  <div className="absolute -bottom-12 -left-12 p-8 frame shadow-2xl flex items-center gap-6">
                    <div className="w-16 h-16 bg-accent/10 text-accent rounded-none flex items-center justify-center">
                      <Coins size={32} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Live Earnings</div>
                      <div className="text-3xl font-bold text-ink tracking-tighter">450.00 FCUK</div>
                    </div>
                  </div>
                </motion.div>
                {/* Decorative Elements */}
                <div className="absolute bottom-12 left-12 flex gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-border" />
                  ))}
                </div>
              </div>
            </section>

            {/* Marquee - Full Width */}
            <div className="w-full bg-ink py-6 overflow-hidden border-b border-border">
              <div className="marquee-track">
                {[...Array(10)].map((_, i) => (
                  <span key={i} className="text-paper font-bold text-2xl mx-16 whitespace-nowrap tracking-tighter uppercase">
                    Finance Cheque UK • Autonomous Marketing • AI Agents • Weekly Income • FCUK Coins •
                  </span>
                ))}
              </div>
            </div>

            {/* Features Grid - Honcho Style */}
            <section id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b border-border">
              <div className="p-16 border-r border-border space-y-6 bg-card">
                <div className="text-accent font-mono text-sm">01</div>
                <h3 className="text-2xl font-bold tracking-tighter">Voice Agents</h3>
                <p className="text-ink/50 text-sm leading-relaxed">High-fidelity video avatars that answer your calls and take instructions 24/7.</p>
              </div>
              <div className="p-16 border-r border-border space-y-6 bg-card">
                <div className="text-accent font-mono text-sm">02</div>
                <h3 className="text-2xl font-bold tracking-tighter">Live View</h3>
                <p className="text-ink/50 text-sm leading-relaxed">Watch your agents work in real-time with a raw computer dashboard view.</p>
              </div>
              <div className="p-16 border-r border-border space-y-6 bg-card">
                <div className="text-accent font-mono text-sm">03</div>
                <h3 className="text-2xl font-bold tracking-tighter">Income Estimates</h3>
                <p className="text-ink/50 text-sm leading-relaxed">Receive FCUK coins as an estimate of your weekly bank payout.</p>
              </div>
              <div className="p-16 space-y-6 bg-card">
                <div className="text-accent font-mono text-sm">04</div>
                <h3 className="text-2xl font-bold tracking-tighter">Sub-Agents</h3>
                <p className="text-ink/50 text-sm leading-relaxed">Spawn subordinates or associates to scale your affiliate empire.</p>
              </div>
            </section>

            {/* Agent Avatar Section - Framed */}
            <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-border">
              <div className="p-12 lg:p-24 border-r border-border bg-paper flex items-center justify-center">
                <AvatarSection />
              </div>
              <div className="p-12 lg:p-24 flex flex-col justify-center space-y-12 bg-card">
                <div className="rail-text absolute top-12 right-12">INTERFACE • V1.0</div>
                <h2 className="text-5xl font-bold tracking-tighter leading-none">Your Agent is Your Employee.</h2>
                <p className="text-lg text-ink/50 leading-relaxed max-w-xl">
                  Every affiliate is assigned a unique AI agent with a high-fidelity video avatar. They answer your calls, take instructions, and report back on campaign performance.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {[
                    "Voice-activated command center",
                    "24/7 autonomous management",
                    "Real-time video feedback",
                    "Native UK Regional support"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-2 h-2 bg-accent" />
                      <span className="font-bold text-xs uppercase tracking-widest text-ink/70">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Agent Computer Section - Full Width Frame */}
            <section className="p-12 lg:p-24 border-b border-border bg-paper">
              <div className="max-w-[1800px] mx-auto space-y-16">
                <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                  <h2 className="text-5xl font-bold tracking-tighter">Watch the Work Happen.</h2>
                  <p className="text-lg text-ink/50 max-w-xl leading-relaxed">
                    The lower half of your dashboard shows the raw computer view of your agents. See them analyze data, post content, and optimize ads in real-time.
                  </p>
                </div>
                <div className="frame p-1 shadow-2xl">
                  <AgentComputer />
                </div>
              </div>
            </section>

            {/* Arbitrage Section - Reclaiming Personhood */}
            <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-border">
              <div className="p-12 lg:p-24 flex flex-col justify-center space-y-12 border-r border-border bg-card">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-[1px] bg-accent" />
                  <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-accent">Arbitrage</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] text-ink">
                  Reclaiming<br />
                  <span className="text-accent">Personhood.</span>
                </h2>
                <div className="space-y-8 text-lg text-ink/50 leading-relaxed max-w-xl font-medium">
                  <p>
                    The current architecture of work and compensation is fundamentally broken. Mankind is effectively enslaved within litigious, legal, and financial systems that demand our constant attention, intellect, and worry.
                  </p>
                  <p>
                    Our agents are designed to handle this 'brainy stuff' on your behalf. By delegating the administrative burden to autonomous intelligence, your heart and soul are finally unburdened from the bureaucracy that stifles human potential.
                  </p>
                  <p className="text-ink font-bold">
                    This is effectively handing back personhood to the system—removing the ball and chain of modern existence. It is a liberation of time and spirit never before seen in human history.
                  </p>
                </div>
              </div>
              <div className="relative bg-paper p-12 lg:p-24 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                  <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--ink) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                </div>
                <div className="relative z-10 space-y-12 text-center">
                  <div className="inline-block p-12 frame bg-paper shadow-2xl">
                    <div className="text-[10px] font-bold text-accent uppercase tracking-[0.4em] mb-8">System Status</div>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between gap-12 border-b border-border pb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-ink/30">Bureaucracy</span>
                        <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Automated</span>
                      </div>
                      <div className="flex items-center justify-between gap-12 border-b border-border pb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-ink/30">Legal Complexity</span>
                        <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Handled</span>
                      </div>
                      <div className="flex items-center justify-between gap-12 border-b border-border pb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-ink/30">Human Spirit</span>
                        <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Unburdened</span>
                      </div>
                    </div>
                    <div className="mt-12 pt-8 border-t border-border">
                      <div className="text-4xl font-bold tracking-tighter text-ink">FREEDOM.EXE</div>
                    </div>
                  </div>
                  <div className="rail-text">LIBERATION • AUTONOMY • ABUNDANCE</div>
                </div>
              </div>
            </section>

            {/* Plans Section */}
            <section id="plans" className="p-12 lg:p-24 border-b border-border bg-paper">
              <div className="max-w-7xl mx-auto space-y-16">
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-12 h-[1px] bg-accent" />
                    <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-accent">Pricing Plans</span>
                    <div className="w-12 h-[1px] bg-accent" />
                  </div>
                  <h2 className="text-5xl md:text-7xl font-bold tracking-tighter">Choose Your Path.</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Free Tier */}
                  <div className="frame p-12 space-y-10 shadow-xl bg-card relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 bg-border/20 text-[10px] font-bold uppercase tracking-widest">Starter</div>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-bold tracking-tight">Free Tier</h3>
                      <p className="text-ink/50 text-sm">Perfect for individuals starting their AI journey.</p>
                    </div>
                    <div className="text-5xl font-bold tracking-tighter">£0<span className="text-lg text-ink/30 font-medium tracking-normal ml-2">/mo</span></div>
                    <ul className="space-y-4">
                      {[
                        "1 Active AI Agent",
                        "Standard Income Estimation",
                        "Weekly Sunday Payouts",
                        "Basic Terminal Access",
                        "Community Support"
                      ].map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-medium">
                          <CheckCircle2 size={16} className="text-accent" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={() => setCurrentPage('signup')}
                      className="w-full py-5 border border-border font-bold uppercase tracking-widest text-sm hover:bg-paper transition-all"
                    >
                      Get Started
                    </button>
                  </div>

                  {/* Premium Tier */}
                  <div className="frame p-12 space-y-10 shadow-2xl bg-card border-accent relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 bg-accent text-paper text-[10px] font-bold uppercase tracking-widest">Most Popular</div>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-bold tracking-tight">Premium</h3>
                      <p className="text-ink/50 text-sm">For power users scaling their affiliate empire.</p>
                    </div>
                    <div className="text-5xl font-bold tracking-tighter">£49<span className="text-lg text-ink/30 font-medium tracking-normal ml-2">/mo</span></div>
                    <ul className="space-y-4">
                      {[
                        "Unlimited AI Agents",
                        "Priority Income Estimation",
                        "Instant Payout Options",
                        "Advanced Sub-Agent Spawning",
                        "24/7 Priority Support",
                        "Custom Regional Avatars"
                      ].map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-medium">
                          <CheckCircle2 size={16} className="text-accent" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={() => setCurrentPage('signup')}
                      className="w-full py-5 bg-ink text-paper font-bold uppercase tracking-widest text-sm hover:bg-accent transition-all"
                    >
                      Go Premium
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Favours & Rewards Section - Split */}
            <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-border">
              <div className="p-12 lg:p-24 border-r border-border bg-card space-y-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-[1px] bg-accent" />
                  <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-accent">Favours for your agent & Rewards</span>
                </div>
                <h2 className="text-5xl font-bold tracking-tighter leading-none">Do favours for your agent. Get Paid.</h2>
                <p className="text-lg text-ink/50 leading-relaxed max-w-xl">
                  Your agent isn't just a tool; it's a partner. When you do 'favours for your agent'—like granting access to your social networks—it rewards you with income estimates in FCUK coins.
                </p>
                <div className="space-y-6">
                  <div className="p-8 frame space-y-4">
                    <h4 className="font-bold text-lg tracking-tight">Empowerment</h4>
                    <p className="text-sm text-ink/50">Connect accounts to give your agent the tools it needs to generate revenue.</p>
                  </div>
                  <div className="p-8 frame space-y-4">
                    <h4 className="font-bold text-lg tracking-tight">Weekly Payouts</h4>
                    <p className="text-sm text-ink/50">Income is payable every Sunday directly to your bank account.</p>
                  </div>
                </div>
              </div>
              <div className="p-12 lg:p-24 bg-paper flex items-center justify-center">
                <div className="w-full max-w-md frame p-12 space-y-10 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-border pb-8">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/30">Recent Favour for your agent</span>
                    <span className="text-[10px] font-bold bg-accent/10 text-accent px-3 py-1">COMPLETED</span>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-paper border border-border flex items-center justify-center">
                        <Globe size={32} className="text-ink/20" />
                      </div>
                      <div>
                        <div className="font-bold text-lg tracking-tight">Connect X.com Account</div>
                        <div className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Granted permissions</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-baseline pt-6 border-t border-border">
                      <span className="text-sm font-bold uppercase tracking-widest text-ink/40">Income Estimate</span>
                      <span className="text-3xl font-bold text-accent tracking-tighter">+250.00 FCUK</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setCurrentPage('exchange')}
                    className="w-full bg-ink text-paper font-bold py-5 uppercase tracking-widest text-sm hover:bg-accent transition-all flex items-center justify-center gap-3"
                  >
                    View Sunday Payout
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </section>

            {/* Wallet Section - Framed */}
            <section id="features" className="p-12 lg:p-24 border-b border-border bg-card">
              <WalletCredits />
            </section>

            {/* Sub-Agents Section - Split */}
            <section id="sub-agents" className="grid grid-cols-1 lg:grid-cols-2 border-b border-border">
              <div className="p-12 lg:p-24 border-r border-border bg-paper flex items-center justify-center">
                <div className="grid grid-cols-2 gap-8 w-full max-w-xl">
                  {[1, 2, 3, 4].map(i => (
                    <motion.div 
                      key={i}
                      whileHover={{ y: -5 }}
                      className="frame p-10 flex flex-col items-center gap-6 text-center shadow-xl"
                    >
                      <div className="w-20 h-20 bg-accent/5 flex items-center justify-center text-accent">
                        <Bot size={40} />
                      </div>
                      <h4 className="font-bold text-xl tracking-tight">Sub-Agent {i}</h4>
                      <div className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Active</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="p-12 lg:p-24 flex flex-col justify-center space-y-12 bg-card">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-[1px] bg-accent" />
                  <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-accent">{t.subAgents}</span>
                </div>
                <h2 className="text-5xl font-bold tracking-tighter leading-none">{t.subAgentTitle}</h2>
                <p className="text-lg text-ink/50 leading-relaxed max-w-xl">
                  {t.subAgentDesc}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="p-8 frame space-y-3">
                    <h4 className="font-bold text-lg tracking-tight">Subordinates</h4>
                    <p className="text-sm text-ink/50">Directly manage and earn from their output.</p>
                  </div>
                  <div className="p-8 frame space-y-3">
                    <h4 className="font-bold text-lg tracking-tight">Associates</h4>
                    <p className="text-sm text-ink/50">Collaborate on large-scale UK campaigns.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA Section - Massive Framed */}
            <section className="p-12 lg:p-24 bg-paper">
              <div className="frame p-16 md:p-32 space-y-24 relative overflow-hidden shadow-2xl">
                <div className="absolute top-12 right-12 rail-text">JOIN THE NETWORK • UK</div>
                
                <div className="text-center space-y-8 relative z-10">
                  <h2 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] text-ink">
                    Join the AI<br />Revolution.
                  </h2>
                  <p className="text-xl text-ink/50 max-w-3xl mx-auto leading-relaxed font-medium">
                    Be the first to know when we launch our mobile apps. Secure early access to the future of affiliate marketing and start earning today.
                  </p>
                </div>

                <div className="max-w-2xl mx-auto relative z-10">
                  <form className="flex flex-col sm:flex-row gap-0 frame p-2">
                    <input 
                      type="email" 
                      placeholder="Enter your email" 
                      className="flex-1 bg-transparent px-8 py-6 text-xl focus:outline-none font-medium"
                      required
                    />
                    <button className="bg-ink text-paper px-12 py-6 font-bold text-lg uppercase tracking-widest hover:bg-accent transition-all">
                      Join List
                    </button>
                  </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 border-t border-border">
                  <button className="flex flex-col items-center gap-6 p-12 border-r border-border hover:bg-paper transition-all group">
                    <AppleIcon size={48} className="text-ink/20 group-hover:text-accent transition-colors" />
                    <div className="text-center">
                      <div className="text-[10px] uppercase font-bold text-ink/30 tracking-[0.2em] mb-2">Coming Soon</div>
                      <div className="text-xl font-bold text-ink tracking-tight">App Store</div>
                    </div>
                  </button>
                  <button className="flex flex-col items-center gap-6 p-12 border-r border-border hover:bg-paper transition-all group">
                    <Smartphone size={48} className="text-ink/20 group-hover:text-accent transition-colors" />
                    <div className="text-center">
                      <div className="text-[10px] uppercase font-bold text-ink/30 tracking-[0.2em] mb-2">Coming Soon</div>
                      <div className="text-xl font-bold text-ink tracking-tight">Google Play</div>
                    </div>
                  </button>
                  <button className="flex flex-col items-center gap-6 p-12 hover:bg-paper transition-all group">
                    <Monitor size={48} className="text-ink/20 group-hover:text-accent transition-colors" />
                    <div className="text-center">
                      <div className="text-[10px] uppercase font-bold text-accent tracking-[0.2em] mb-2">Available Now</div>
                      <div className="text-xl font-bold text-ink tracking-tight">Web App</div>
                    </div>
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <Compliance />
    </div>
  );
}
