import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Scale, Gavel, Users, Zap, CheckCircle2 } from 'lucide-react';
import { NEWS_ITEMS } from '../constants';
import { Render } from "@measured/puck";
import { config } from "../puck.config";

export const Home: React.FC = () => {
  const puckData = localStorage.getItem("puck-data");
  const data = puckData ? JSON.parse(puckData) : null;

  if (data && data.content && data.content.length > 0) {
    return <Render config={config} data={data} />;
  }

  return (
    <div className="space-y-32 pb-32">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-black">
        <div className="absolute inset-0 opacity-60">
          <img 
            src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=2070" 
            alt="Car Finance" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl space-y-10"
          >
            <h1 className="text-7xl md:text-9xl font-display font-black text-white leading-[0.85] tracking-tight uppercase">
              Were You <br />
              <span className="text-brand-accent">Mis-Sold</span> <br />
              Car Finance?
            </h1>
            <p className="text-2xl text-white font-bold max-w-2xl leading-tight">
              Join thousands reclaiming what they’re owed. The FCA is investigating secret commissions—you could be entitled to thousands.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <Link to="/claim" className="brutal-btn text-2xl px-12 py-6">
                Check Eligibility
              </Link>
              <Link to="/about" className="brutal-btn-secondary text-2xl px-12 py-6">
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Marquee 2 */}
      <div className="marquee border-y border-slate-200">
        <div className="flex gap-12 animate-marquee">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="flex items-center gap-2">
              <Zap className="w-4 h-4 fill-current" /> NO WIN NO FEE* • FCA INVESTIGATION • CHECK ELIGIBILITY
            </span>
          ))}
        </div>
      </div>

      {/* What is PCP Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <h2 className="text-6xl md:text-8xl font-display font-black uppercase leading-none tracking-tight">
              What is <br />
              <span className="text-brand-secondary">PCP Mis-selling?</span>
            </h2>
            <div className="space-y-6 text-xl font-bold leading-relaxed">
              <p>
                Personal Contract Purchase (PCP) is the most common way to finance a car in the UK. However, many lenders and dealers used "discretionary commission arrangements" to inflate interest rates without telling customers.
              </p>
              <p className="text-gray-500">
                This meant the more interest you paid, the more commission the dealer earned. This conflict of interest was hidden from you, and now the FCA is stepping in to ensure justice is served.
              </p>
            </div>
            <ul className="space-y-6">
              {[
                'Hidden commissions paid to dealers',
                'Inflated interest rates to boost profits',
                'Lack of transparency in contract terms',
                'Unfair financial burden on consumers'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-2xl font-black uppercase italic">
                  <div className="bg-brand-accent p-1 rounded-full">
                    <CheckCircle2 className="text-white w-6 h-6" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
              <img 
                src="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=2070" 
                alt="Happy Family" 
                className="w-full transition-all duration-700"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 bg-white p-10 rounded-2xl shadow-2xl border border-slate-100 hidden md:block">
              <p className="text-6xl font-display font-black leading-none text-brand-secondary">£1,100</p>
              <p className="text-sm uppercase font-bold tracking-widest text-slate-500">Average Refund Value</p>
              <p className="text-xl font-display font-black leading-none text-brand-secondary mt-4">Claim Figure: £829*</p>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">FCA Confirmed Average</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Matters */}
      <section className="bg-slate-900 py-32 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-20">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-6xl md:text-8xl font-display font-black uppercase tracking-tight leading-none text-white">
              Why This <span className="text-brand-accent">Matters</span>
            </h2>
            <p className="text-2xl font-medium text-slate-400">This isn't just about money—it's about corporate accountability and consumer justice.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Scale, title: 'Justice for All', desc: 'Holding multi-billion pound lenders accountable for unfair practices.' },
              { icon: Gavel, title: 'Legal Precedent', desc: 'Setting a standard that protects future car buyers from hidden fees.' },
              { icon: Users, title: 'Community Power', desc: 'Joining a collective movement of thousands seeking what they are owed.' }
            ].map((item, i) => (
              <div key={i} className="space-y-6 p-10 bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-700 hover:bg-slate-800 transition-all">
                <item.icon className="w-16 h-16 mx-auto text-brand-accent" />
                <h3 className="text-3xl font-display font-black uppercase text-white">{item.title}</h3>
                <p className="text-lg font-medium text-slate-400 leading-tight">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div className="space-y-4">
            <h2 className="text-6xl md:text-8xl font-display font-black uppercase leading-none tracking-tight">
              Latest <span className="text-brand-accent">Updates</span>
            </h2>
            <p className="text-2xl font-bold text-gray-500">Stay informed with the latest campaign news.</p>
          </div>
          <Link to="/news" className="brutal-btn py-3 px-8 flex items-center gap-2">
            View All News <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {NEWS_ITEMS.map((item) => (
            <article key={item.id} className="group cursor-pointer space-y-6">
              <div className="aspect-video rounded-2xl overflow-hidden shadow-lg border border-slate-100">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent px-3 py-1 bg-brand-accent/10 rounded-full inline-block">
                  {item.category}
                </span>
                <h3 className="text-3xl font-display font-black uppercase group-hover:text-brand-secondary transition-colors leading-none">
                  {item.title}
                </h3>
                <p className="text-lg font-medium text-slate-500 line-clamp-2">{item.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
