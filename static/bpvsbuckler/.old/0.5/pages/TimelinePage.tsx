import React from 'react';
import Section from '../components/Section';
import { TIMELINE_DATA } from '../constants';
import { Flag, Gavel, Hammer, Shovel, CheckCircle2 } from 'lucide-react';

const TimelinePage: React.FC = () => {
  const getIcon = (category: string) => {
    switch(category) {
      case 'legal': return <Gavel size={16} className="text-white" />;
      case 'eviction': return <Hammer size={16} className="text-white" />;
      case 'archaeology': return <Shovel size={16} className="text-white" />;
      default: return <Flag size={16} className="text-white" />;
    }
  };

  const getColor = (category: string) => {
    switch(category) {
      case 'legal': return 'bg-slate-700';
      case 'eviction': return 'bg-justice-red';
      case 'archaeology': return 'bg-amber-600';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-slate-900 text-white py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-serif font-bold mb-2">The Timeline</h1>
          <p className="text-slate-400">1916 — 1994</p>
        </div>
      </div>

      <Section className="pt-8">
        <div className="max-w-3xl mx-auto border-l-2 border-slate-200 ml-4 md:ml-8 space-y-8">
          {TIMELINE_DATA.map((event, index) => (
            <div key={index} className="relative pl-8">
              {/* Dot */}
              <div className={`absolute top-1 left-[-9px] w-4 h-4 rounded-full border-2 border-white ${getColor(event.category)} z-10 shadow-sm`}></div>

              {/* Content */}
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
                 <span className="font-bold text-justice-red text-xl font-serif min-w-[60px]">{event.year}</span>
                 <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                 <div className={`inline-flex items-center justify-center w-6 h-6 rounded ml-2 ${getColor(event.category)} shadow-sm`}>
                    {getIcon(event.category)}
                 </div>
              </div>
              
              <div className="text-slate-600 leading-snug text-sm max-w-xl">
                 {event.description}
              </div>

              {event.verified && (
                 <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded uppercase tracking-wider">
                    <CheckCircle2 size={10} /> Verified
                 </div>
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default TimelinePage;