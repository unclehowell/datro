import React from 'react';
import Section from '../components/Section';
import { LEGAL_ARGUMENTS } from '../constants';
import { Scale, FileWarning } from 'lucide-react';

const LegalPage: React.FC = () => {
  return (
    <div className="bg-parchment min-h-screen">
      <div className="bg-justice-red text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Scale size={48} className="mx-auto mb-6 opacity-80" />
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Legal Analysis</h1>
          <p className="text-xl text-red-100 max-w-2xl mx-auto">
            "The suggested possessory title was not made out for Great House Farm as a whole... However, for the farmhouse and garden, there was no doubt."
          </p>
          <p className="mt-4 text-sm font-mono opacity-70">- Dillon LJ, Court of Appeal (1987)</p>
        </div>
      </div>

      <Section title="The Precedent" subtitle="BP Properties Ltd v Buckler [1987] EWCA Civ 2">
        <div className="bg-white p-8 border border-stone-200 shadow-sm mb-12">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileWarning className="text-justice-red"/>
                The Principle Established
            </h3>
            <p className="text-stone-700 leading-relaxed mb-4">
                The case established a controversial principle in adverse possession law: 
                <strong> Where a license is offered but never refused, this may be taken to mean that the license has been granted.</strong>
            </p>
            <p className="text-stone-700 leading-relaxed">
                A unilateral license (one offered by the land owner but not signed or agreed to by the squatter) can stop time running for adverse possession. This ruling effectively allowed a corporate entity to impose permission on a family that was actively claiming ownership.
            </p>
        </div>

        <div className="space-y-8">
            <h2 className="text-3xl font-serif font-bold text-center mb-8">Key Legal Grievances</h2>
            <div className="grid md:grid-cols-3 gap-6">
                {LEGAL_ARGUMENTS.map((arg, idx) => (
                    <div key={idx} className="bg-parchment-dark p-6 border-t-4 border-justice-red">
                        <div className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Argument {idx + 1}</div>
                        <h3 className="text-xl font-serif font-bold mb-3">{arg.title}</h3>
                        <p className="font-medium text-stone-900 mb-2">{arg.summary}</p>
                        <p className="text-sm text-stone-600 leading-relaxed">{arg.detail}</p>
                    </div>
                ))}
            </div>
        </div>
      </Section>
    </div>
  );
};

export default LegalPage;