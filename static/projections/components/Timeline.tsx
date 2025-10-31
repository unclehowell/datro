import React, { useState } from 'react';
import Section from './Section';
import { timelineData } from '../timelineData';
import { TimelineCategory } from '../types';

const categoryStyles: { [key in TimelineCategory]: { bg: string; text: string; border: string } } = {
    Milestone: { bg: 'bg-indigo-500', text: 'text-indigo-100', border: 'border-indigo-500' },
    Finance: { bg: 'bg-emerald-500', text: 'text-emerald-100', border: 'border-emerald-500' },
    Expansion: { bg: 'bg-amber-500', text: 'text-amber-100', border: 'border-amber-500' },
    Operations: { bg: 'bg-sky-500', text: 'text-sky-100', border: 'border-sky-500' },
};

const Timeline: React.FC = () => {
    const [activeFilter, setActiveFilter] = useState<TimelineCategory | 'All'>('All');
    const filters: (TimelineCategory | 'All')[] = ['All', 'Milestone', 'Finance', 'Expansion', 'Operations'];

    const filteredData = activeFilter === 'All'
        ? timelineData
        : timelineData.filter(event => event.category === activeFilter);

    return (
        <Section id="timeline" title="Company Roadmap">
            <div className="flex flex-wrap justify-center gap-2 mb-12">
                {filters.map(filter => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200
                            ${activeFilter === filter
                                ? 'bg-amber-400 text-slate-900'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            <div className="relative border-l-2 border-slate-700 ml-4 md:ml-0">
                {filteredData.map((event, index) => {
                    const { bg, text, border } = categoryStyles[event.category];
                    return (
                        <div key={index} className="mb-10 ml-8">
                            <span className={`absolute -left-[11px] flex items-center justify-center w-6 h-6 ${bg} rounded-full ring-8 ring-slate-900`}>
                                {/* Icon can go here */}
                            </span>
                            <div className={`p-4 rounded-lg shadow-md bg-slate-800 border-l-4 ${border} ring-1 ring-white/10`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-400">{event.date}</span>
                                    <span className={`px-2 py-1 text-xs font-bold leading-none ${text} ${bg} rounded-full`}>
                                        {event.category}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-100 mb-1">{event.title}</h3>
                                <p className="text-base text-slate-400">{event.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Section>
    );
};

export default Timeline;
