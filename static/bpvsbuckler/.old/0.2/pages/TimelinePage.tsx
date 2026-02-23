import React from 'react';
import Section from '../components/Section';
import { TIMELINE_DATA } from '../constants';
import { Circle, Flag, Gavel, Hammer, Radio } from 'lucide-react';

const TimelinePage: React.FC = () => {
  const getIcon = (category: string) => {
    switch(category) {
      case 'legal': return <Gavel size={20} className="text-red-100" />;
      case 'demolition': return <Hammer size={20} className="text-red-100" />;
      case 'marconi': return <Radio size={20} className="text-blue-100" />;
      case 'archaeology': return <Flag size={20} className="text-yellow-100" />;
      default: return <Circle size={20} className="text-stone-100" />;
    }
  };

  const getColor = (category: string) => {
    switch(category) {
      case 'legal': return 'bg-justice-red';
      case 'demolition': return 'bg-stone-800';
      case 'marconi': return 'bg-blue-900';
      case 'archaeology': return 'bg-amber-700';
      default: return 'bg-stone-500';
    }
  };

  return (
    <div className="bg-parchment min-h-screen">
      <div className="bg-stone-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-serif font-bold">Chronology of Dispossession</h1>
          <p className="mt-4 text-stone-400">From ancient Roman foundations to the 1988 demolition.</p>
        </div>
      </div>

      <Section>
        <div className="relative border-l-4 border-stone-300 ml-4 md:ml-1/2 space-y-12">
          {TIMELINE_DATA.map((event, index) => (
            <div key={index} className={`relative pl-8 md:pl-0 ${index % 2 === 0 ? 'md:pr-12 md:text-right md:left-[-50%] md:ml-[-2px]' : 'md:pl-12 md:left-1/2'}`}>
              
              {/* Dot */}
              <div className={`absolute top-0 left-[-11px] md:left-auto ${index % 2 === 0 ? 'md:right-[-11px]' : 'md:left-[-11px]'} w-6 h-6 rounded-full border-4 border-parchment ${getColor(event.category)} z-10`}></div>

              {/* Card */}
              <div className="bg-white p-6 rounded shadow-md border border-stone-200 hover:shadow-lg transition-shadow">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-4 ${getColor(event.category)} shadow-sm`}>
                  {getIcon(event.category)}
                </div>
                <span className="block text-justice-red font-bold font-serif mb-1">{event.year}</span>
                <h3 className="text-xl font-bold mb-2 text-ink">{event.title}</h3>
                <p className="text-stone-600 text-sm leading-relaxed">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default TimelinePage;