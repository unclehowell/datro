import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'News', path: '/news' },
    { name: 'About', path: '/about' },
    { name: 'Check Eligibility', path: '/claim', highlight: true },
  ];

  if (location.pathname === '/edit') return <>{children}</>;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-slate-900 p-2 rounded-lg">
                <ShieldCheck className="w-8 h-8 text-brand-accent" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-display font-black leading-none tracking-tight">PCP REFUND</span>
                <span className="text-[10px] uppercase font-bold text-slate-500">Reclaiming mis-sold car finance</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-xs font-bold uppercase tracking-widest transition-all ${
                    link.highlight
                      ? 'bg-brand-accent text-white py-3 px-6 rounded-full hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
                      : 'text-slate-600 hover:text-brand-secondary'
                  } ${location.pathname === link.path && !link.highlight ? 'text-brand-secondary' : ''}`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button className="md:hidden brutal-border p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden bg-white border-b-4 border-black overflow-hidden"
            >
              <div className="px-4 py-8 space-y-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-4xl font-display font-black uppercase italic"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-grow">{children}</main>

      {/* Global CTA */}
      <section className="bg-slate-900 text-white py-32 px-4 border-t border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <h2 className="text-6xl md:text-8xl font-display font-black uppercase tracking-tight leading-none">
            Check Your Eligibility Today
          </h2>
          <p className="text-2xl font-medium text-slate-400 max-w-2xl mx-auto">
            Don't let mis-sold car finance go unchallenged. Join thousands of others in the fight for justice.
          </p>
          <Link to="/claim" className="inline-block brutal-btn text-2xl px-12 py-6">
            Check Eligibility
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-16 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-brand-accent p-2 rounded-lg">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <span className="text-3xl font-display font-black">PCP REFUND</span>
              </div>
              <p className="text-lg font-medium text-slate-400 max-w-md">
                Dedicated to helping UK consumers recover compensation for mis-sold PCP and Hire Purchase agreements.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-12">
              <div>
                <h4 className="font-bold uppercase text-brand-accent mb-6 tracking-widest text-xs">Campaign</h4>
                <ul className="space-y-4 text-sm font-medium text-slate-400">
                  <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                  <li><Link to="/news" className="hover:text-white transition-colors">Latest News</Link></li>
                  <li><Link to="/claim" className="hover:text-white transition-colors">Check Eligibility</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold uppercase text-brand-accent mb-6 tracking-widest text-xs">Contact</h4>
                <p className="text-sm font-medium text-slate-400">info@jigsawclaims.co.uk</p>
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-slate-900">
            <div className="mb-8 p-6 bg-slate-900/50 rounded-lg border border-slate-800">
              <p className="text-sm font-bold text-white leading-relaxed">
                <span className="text-brand-accent">Claim Figure: £829*</span>
              </p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                *On 30/03/2026, the FCA, in their Statement of a confirmed redress scheme, expect eligible consumers to receive an average of £829 per agreement.
              </p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                the final deadline to complain is the 31st of August 2027.
              </p>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600 text-justify md:text-left font-medium">
              PCP Refund is a trading name of Jigsaw Claims Ltd, authorised and regulated by the Financial Conduct Authority (FCA) for claims management activities (FRN: 912323). Registered Address: 66 Seymour Grove, Manchester, M16 0LN. Contact: info@jigsawclaims.co.uk. We will receive referral fees from third parties for successful claims at no cost to you. Using our service does not guarantee a faster or better outcome. You can also claim for free through your lender, the Financial Ombudsman Service, or the FCA compensation scheme launching in 2026.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
