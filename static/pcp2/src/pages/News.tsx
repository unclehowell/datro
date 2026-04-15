import React from 'react';
import { NEWS_ITEMS } from '../constants';
import { Calendar, Tag, ArrowRight } from 'lucide-react';

export const News: React.FC = () => {
  return (
    <div className="pb-24">
      {/* Header */}
      <section className="bg-slate-900 text-white py-24 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-display font-black uppercase leading-none mb-6">
            News & <br />Updates
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl font-medium text-slate-400 uppercase tracking-tight">
            THE LATEST FROM THE FRONT LINE OF THE CAR FINANCE SCANDAL.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-16">
            {NEWS_ITEMS.map((item) => (
              <article key={item.id} className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-all">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                  <div className="md:col-span-2 aspect-square rounded-2xl overflow-hidden border border-slate-100">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-4">
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      <span className="flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1 rounded-full"><Calendar className="w-3 h-3" /> {item.date}</span>
                      <span className="flex items-center gap-1 bg-brand-accent/10 text-brand-accent px-3 py-1 rounded-full"><Tag className="w-3 h-3" /> {item.category}</span>
                    </div>
                    <h2 className="text-3xl font-display font-black uppercase leading-tight group-hover:text-brand-secondary transition-colors">
                      {item.title}
                    </h2>
                    <p className="text-slate-600 font-medium leading-relaxed">
                      {item.excerpt}
                    </p>
                    <button className="brutal-btn text-xs px-6 py-3 flex items-center gap-2">
                      READ FULL STORY <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Sidebar */}
          <aside className="space-y-12">
            {/* Categories */}
            <div className="p-8 bg-brand-accent rounded-3xl border border-emerald-400 shadow-xl shadow-emerald-500/20">
              <h3 className="font-display font-black text-2xl uppercase mb-6 text-white">Categories</h3>
              <ul className="space-y-4">
                {['FCA Updates', 'Court Rulings', 'Consumer Stories', 'Campaign News'].map((cat) => (
                  <li key={cat}>
                    <button className="text-sm font-bold uppercase flex justify-between w-full group hover:translate-x-2 transition-transform text-white/80 hover:text-white">
                      <span>{cat}</span>
                      <span className="font-mono opacity-60">(12)</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Twitter Feed Simulation */}
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="font-display font-black text-2xl uppercase mb-6">Campaign Feed</h3>
              <div className="space-y-6">
                {[
                  { user: '@PCPRefund', text: 'BREAKING: New evidence suggests over 90% of car finance deals between 2007-2021 were mis-sold. #PCPClaims #Justice', time: '2h ago' },
                  { user: '@PCPRefund', text: 'Join the thousands already reclaiming. Check your eligibility in 60 seconds on our site.', time: '5h ago' }
                ].map((tweet, i) => (
                  <div key={i} className="space-y-2 pb-6 border-b border-slate-100 last:border-0">
                    <p className="text-xs font-bold text-brand-secondary">{tweet.user}</p>
                    <p className="text-sm font-medium leading-tight text-slate-700">{tweet.text}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tweet.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
