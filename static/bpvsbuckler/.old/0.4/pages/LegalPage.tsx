import React from 'react';
import Section from '../components/Section';
import { LEGAL_CONFLICTS } from '../constants';
import { Scale, FileWarning, ArrowRight } from 'lucide-react';

const LegalPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-justice-red text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block p-4 rounded-full bg-red-800 mb-8">
            <Scale size={40} />
          </div>
          <h1 className="text-5xl font-serif font-bold mb-6">Legal Malfeasance</h1>
          <p className="text-xl text-red-100 max-w-3xl mx-auto leading-relaxed font-serif">
            "The court dismissal of 'rather technical' is legally indefensible. Fundamental principle: cannot grant rights over property you do not own."
          </p>
        </div>
      </div>

      <Section title="The Precedent" subtitle="BP Properties Ltd v Buckler [1987] EWCA Civ 2">
        <div className="bg-white p-10 border-l-4 border-justice-red shadow-sm mb-16 rounded-r-lg">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-900">
                <FileWarning className="text-justice-red"/>
                The Core Injustice
            </h3>
            <div className="prose prose-lg text-slate-600">
                <p>
                    The case established a controversial principle in adverse possession law: 
                    <strong className="text-slate-900"> Where a license is offered but never refused, this may be taken to mean that the license has been granted.</strong>
                </p>
                <p>
                    A unilateral license (one offered by the land owner but not signed or agreed to by the squatter) can stop time running for adverse possession. This ruling effectively allowed a corporate entity to impose permission on a family that was actively claiming ownership.
                </p>
            </div>
        </div>

        <div className="space-y-12">
            <h2 className="text-3xl font-serif font-bold text-center mb-12 text-slate-900">Case Analysis</h2>
            <div className="grid gap-8">
                {LEGAL_CONFLICTS.map((arg, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-1 border-r border-slate-100 pr-8">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Count {idx + 1}</span>
                            <h3 className="text-xl font-serif font-bold text-slate-900">{arg.title}</h3>
                        </div>
                        <div className="md:col-span-2">
                            <div className="grid grid-cols-2 gap-8 mb-6">
                                <div>
                                    <h4 className="text-xs font-bold text-red-600 uppercase mb-2">Court Ruling</h4>
                                    <p className="text-sm text-slate-600">{arg.officialNarrative}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-blue-600 uppercase mb-2">Family Claim</h4>
                                    <p className="text-sm text-slate-600">{arg.familyReality}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded border border-slate-200">
                                <span className="text-xs font-bold text-slate-900 uppercase flex items-center gap-2">
                                    Summary Verdict <ArrowRight size={12} />
                                </span>
                                <p className="text-base font-serif text-slate-800 mt-2">{arg.verdict}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </Section>
    </div>
  );
};

export default LegalPage;