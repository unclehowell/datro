
import React, { useState, useEffect } from 'react';
import { 
  GlobeAltIcon, 
  ArrowsRightLeftIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  PuzzlePieceIcon,
  BanknotesIcon,
  ChartBarIcon,
  UserGroupIcon,
  LockClosedIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  ScaleIcon,
  HeartIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface LandingPageProps {
  onLaunch: () => void;
}

type SubView = 'home' | 'problem' | 'how-it-works' | 'impact';

const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  const [subView, setSubView] = useState<SubView>('home');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [subView]);

  const Nav = () => (
    <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center border-b border-slate-50 sticky top-0 bg-white/80 backdrop-blur-md z-[100]">
      <button onClick={() => setSubView('home')} className="flex items-center gap-3 group">
        <div className="bg-slate-900 p-2 rounded-xl shadow-lg group-hover:bg-indigo-600 transition-colors">
          <ArrowsRightLeftIcon className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-black tracking-tighter text-slate-900">DCC</span>
      </button>
      <div className="hidden md:flex gap-8 text-xs font-black uppercase tracking-widest text-slate-500">
                <button onClick={() => setSubView('problem')} className={`hover:text-indigo-600 transition-colors ${subView === 'problem' ? 'text-indigo-600' : ''}`}>The Problem</button>
                <button onClick={() => setSubView('how-it-works')} className={`hover:text-indigo-600 transition-colors ${subView === 'how-it-works' ? 'text-indigo-600' : ''}`}>How it Works</button>
                <button onClick={() => setSubView('impact')} className={`hover:text-indigo-600 transition-colors ${subView === 'impact' ? 'text-indigo-600' : ''}`}>Our Impact</button>
                <a href="/" className="hover:text-indigo-600 transition-colors">Docs</a>
              </div>
              <button 
                onClick={onLaunch}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95"
              >
                Open Web Wallet
              </button>
            </nav>
          );
        
          const HomeView = () => (
            <>
              {
        /* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-green-100">
            <ShieldCheckIcon className="w-4 h-4" />
            Join the Financial Revolution
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.05] tracking-tighter">
            Unlock Financial Freedom: The <span className="text-indigo-600">DCC Revolution.</span>
          </h1>
          <p className="text-xl text-slate-600 font-medium leading-relaxed max-w-xl">
            Imagine a world where everyday debts vanish through collective trust, slashing personal burdens—without a single dollar changing hands.
          </p>
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-4">
               <button 
                onClick={onLaunch}
                className="bg-slate-900 hover:bg-black text-white px-10 py-5 rounded-[1.5rem] font-black text-lg shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 border-b-4 border-indigo-600"
              >
                <RocketLaunchIcon className="w-6 h-6 text-indigo-400" />
                Launch Browser App
              </button>
              <div className="flex gap-2">
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center grayscale hover:grayscale-0 transition-all cursor-not-allowed group">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="h-6" />
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center grayscale hover:grayscale-0 transition-all cursor-not-allowed group">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Play Store" className="h-6" />
                </div>
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <LockClosedIcon className="w-3 h-3" />
              100% Client-Side. No servers. No interest traps.
            </p>
          </div>
        </div>

        <div className="relative animate-in zoom-in duration-1000">
          <div className="bg-indigo-600/10 absolute -inset-10 rounded-[4rem] blur-3xl"></div>
          <div className="relative bg-white p-6 rounded-[3rem] shadow-2xl border border-slate-100 transform rotate-1">
             <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Ledger Status</span>
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-12 bg-slate-800 rounded-xl flex items-center px-4 border-l-4 border-indigo-500">
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-indigo-500"></div>
                    </div>
                  </div>
                  <div className="bg-indigo-600 p-6 rounded-2xl text-center transform hover:scale-105 transition-transform cursor-pointer shadow-lg">
                    <div className="text-2xl font-black uppercase">Circle Found</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Tap to Cancel Chains</div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Tetris Analogy Intro */}
      <section className="bg-slate-900 py-24 text-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-black tracking-tighter leading-tight">The Tetris Analogy</h2>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              Debt is weighing heavier on people than ever. DCC flips the script. When IOU and UOME records form a circular chain (where User 1 owes User 2 who owes User 3 who owes User 1), debts are deleted—wiped—cancelled out.
            </p>
            <button onClick={() => setSubView('how-it-works')} className="flex items-center gap-2 text-indigo-400 font-black uppercase tracking-widest text-xs hover:text-indigo-300 transition-colors">
              Learn the Mechanics <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2 opacity-20">
            {[...Array(16)].map((_, i) => (
              <div key={i} className={`h-12 rounded-lg ${i % 5 === 0 ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
            ))}
          </div>
        </div>
      </section>
    </>
  );

  const ProblemView = () => (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button onClick={() => setSubView('home')} className="mb-8 flex items-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-xs">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Home
      </button>
      <div className="space-y-12">
        <header className="space-y-4">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-[1.1]">The Modern Debt Burden</h1>
          <p className="text-xl text-slate-500 font-medium">Why the current financial model is designed for your failure.</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
            <ChartBarIcon className="w-10 h-10 text-rose-500 mb-6" />
            <h3 className="text-xl font-black mb-2">DTI Skyrocketing</h3>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              In the 1980s, U.S. household debt-to-income (DTI) was under 70%. Peaks before 2008 hit 130%. Today, it's hovering at 81%—meaning families carry more obligations relative to earnings than in stable times.
            </p>
          </div>
          <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
            <UserGroupIcon className="w-10 h-10 text-indigo-500 mb-6" />
            <h3 className="text-xl font-black mb-2">Informal "Shadow" Debts</h3>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              Up to 60% of Americans borrow from friends or family. These informal debts total around $52 Billion nationwide, straining relationships and hidden from standard banking metrics.
            </p>
          </div>
        </div>

        <article className="prose prose-slate lg:prose-xl font-medium text-slate-600 max-w-none space-y-8">
          <p>
            Traditional lenders (banks, corporations, institutions) thrive on perpetual debt cycles. In 2022 alone, credit card issuers raked in <strong>$105 Billion in interest</strong> and <strong>$25 Billion in fees</strong>. Late fees alone hit $12-14 billion annually.
          </p>
          <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white my-12">
            <h4 className="text-indigo-400 font-black uppercase tracking-widest text-xs mb-4">The Verdict</h4>
            <p className="text-2xl font-black italic">
              "The system thrives on your ongoing servitude. Banks profit most when you never quite reach zero."
            </p>
          </div>
          <p>
            DCC isn't about borrowing more—it's about breaking free together. We provide the tools to log these pledges and offset them mutually, bypassing the interest traps entirely.
          </p>
        </article>
      </div>
    </div>
  );

  const HowItWorksView = () => (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button onClick={() => setSubView('home')} className="mb-8 flex items-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-xs">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Home
      </button>
      <div className="space-y-12">
        <header className="space-y-4">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-[1.1]">How the Circle Works</h1>
          <p className="text-xl text-slate-500 font-medium">A simple, powerful mechanism for mutual debt relief.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 border border-slate-100 rounded-3xl bg-slate-50">
            <div className="text-indigo-600 font-black text-3xl mb-4">01</div>
            <h4 className="font-black text-slate-900 mb-2">Log Pledges</h4>
            <p className="text-xs text-slate-500 font-medium">Private IOUs and UOMEs are logged into your client-side cache. Only you hold the data.</p>
          </div>
          <div className="p-8 border border-slate-100 rounded-3xl bg-slate-50">
            <div className="text-indigo-600 font-black text-3xl mb-4">02</div>
            <h4 className="font-black text-slate-900 mb-2">Circle Detection</h4>
            <p className="text-xs text-slate-500 font-medium">BCC dcc@datro.xyz to allow the pattern detector to find circular chains across peers.</p>
          </div>
          <div className="p-8 border border-slate-100 rounded-3xl bg-slate-50">
            <div className="text-indigo-600 font-black text-3xl mb-4">03</div>
            <h4 className="font-black text-slate-900 mb-2">Simultaneous Wipe</h4>
            <p className="text-xs text-slate-500 font-medium">When a circle balances, everyone agrees to cancel. Debts vanish like lines in Tetris.</p>
          </div>
        </div>

        <article className="prose prose-slate lg:prose-xl font-medium text-slate-600 max-w-none space-y-8">
          <h3 className="text-slate-900 font-black text-3xl">Pledge-Based Empowerment</h3>
          <p>
            DCC flips the script. We let you log IOUs and "You Owe Me" pledges in a private, mutual network. It's all about information exchange and voluntary commitments—not moving regulated funds.
          </p>
          <ul className="space-y-4 list-none pl-0">
            <li className="flex gap-4">
              <div className="bg-indigo-100 p-2 rounded-lg h-fit"><CheckIcon className="w-5 h-5 text-indigo-600" /></div>
              <span><strong>Simultaneous Debt Relief:</strong> Your debt vanishes only if others' debts to you are canceled at the same time and amount.</span>
            </li>
            <li className="flex gap-4">
              <div className="bg-indigo-100 p-2 rounded-lg h-fit"><CheckIcon className="w-5 h-5 text-indigo-600" /></div>
              <span><strong>Legally Straightforward:</strong> It's like enforceable promises under contract law (promissory estoppel) for mutual benefit. No transfer triggering banking oversight.</span>
            </li>
          </ul>
        </article>
      </div>
    </div>
  );

  const ImpactView = () => (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button onClick={() => setSubView('home')} className="mb-8 flex items-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-xs">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Home
      </button>
      <div className="space-y-12">
        <header className="space-y-4">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-[1.1]">Liquidating the Shadow Economy</h1>
          <p className="text-xl text-slate-500 font-medium">Injecting trillions in relief without government intervention.</p>
        </header>

        <div className="bg-indigo-600 p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 opacity-10"><GlobeAltIcon className="w-64 h-64" /></div>
          <div className="relative z-10 space-y-6">
            <div className="text-[10px] font-black uppercase tracking-[0.3em]">Potential Scale</div>
            <div className="text-6xl font-black tracking-tighter">$26,000,000,000</div>
            <p className="text-indigo-100 text-lg font-medium leading-relaxed">
              Widespread adoption could liquidate up to 50% of informal debts through interconnected circles, freeing up cash flow equivalent to a massive stimulus.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 border border-slate-100 rounded-3xl bg-slate-50 space-y-4">
             <ScaleIcon className="w-10 h-10 text-indigo-600" />
             <h4 className="text-xl font-black">5-10% DTI Drop</h4>
             <p className="text-sm text-slate-600 font-medium leading-relaxed">
               If a typical household cancels just $500-1,000 in informal IOUs, it directly shaves their debt-to-income ratio, easing monthly pressures by 1-2% of total income.
             </p>
          </div>
          <div className="p-8 border border-slate-100 rounded-3xl bg-slate-50 space-y-4">
             <BanknotesIcon className="w-10 h-10 text-green-600" />
             <h4 className="text-xl font-black">Relationship Restoration</h4>
             <p className="text-sm text-slate-600 font-medium leading-relaxed">
               By erasing "shadow debts" through circles, we remove the social friction that informal borrowing places on friends and family.
             </p>
          </div>
        </div>

        <div className="text-center py-10">
          <p className="text-slate-500 font-bold italic mb-8">"Scale it globally? Trillions in relief."</p>
          <button 
            onClick={onLaunch}
            className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-black transition-all shadow-xl"
          >
            Sign Up Free & Start Your Circle
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen text-slate-900 selection:bg-indigo-100">
      <Nav />

      <main>
        {subView === 'home' && <HomeView />}
        {subView === 'problem' && <ProblemView />}
        {subView === 'how-it-works' && <HowItWorksView />}
        {subView === 'impact' && <ImpactView />}
      </main>

      {/* Unified Footer */}
      <footer className="bg-slate-900 text-slate-500 py-16 mt-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-slate-800 pb-16">
          <div className="space-y-4">
            <button onClick={() => setSubView('home')} className="flex items-center gap-2 text-white">
              <ArrowsRightLeftIcon className="w-5 h-5 text-indigo-500" />
              <span className="text-xl font-black tracking-tighter">DCC</span>
            </button>
            <p className="text-sm font-medium leading-relaxed">
              Where mutual trust cancels debt—instantly and fairly. Join the movement to reclaim financial breathing room.
            </p>
          </div>
          <div className="space-y-4">
            <h5 className="text-white text-xs font-black uppercase tracking-widest">Navigation</h5>
            <div className="space-y-2 text-xs font-bold uppercase tracking-widest">
              <button onClick={() => setSubView('problem')} className="block hover:text-white transition-colors">The Problem</button>
              <button onClick={() => setSubView('how-it-works')} className="block hover:text-white transition-colors">How it Works</button>
              <button onClick={() => setSubView('impact')} className="block hover:text-white transition-colors">Our Impact</button>
            </div>
          </div>
          <div className="space-y-4">
            <h5 className="text-white text-xs font-black uppercase tracking-widest">Legal & Privacy</h5>
            <div className="space-y-2 text-xs font-bold uppercase tracking-widest">
              <a href="#" className="block hover:text-white transition-colors">Client-Side Policy</a>
              <a href="#" className="block hover:text-white transition-colors">Promissory Estoppel</a>
              <a href="#" className="block hover:text-white transition-colors">No Fund Movement</a>
            </div>
          </div>
          <div className="space-y-4">
            <h5 className="text-white text-xs font-black uppercase tracking-widest">Contact</h5>
            <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <SparklesIcon className="w-3 h-3 text-indigo-400" />
              BCC: dcc@datro.xyz
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-12 text-center text-[10px] font-bold uppercase tracking-[0.2em]">
          © 2024 DCC - Debt Cancellation Circle. Decentralized Ledger Solutions.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

// Helper icons
const CheckIcon = ({ className }: { className?: string }) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);
