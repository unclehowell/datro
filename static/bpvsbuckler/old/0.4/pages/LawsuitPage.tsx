import React from 'react';
import Section from '../components/Section';
import { Scale, Gavel, FileText, Users, Globe } from 'lucide-react';

const LawsuitPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-justice-red text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block p-4 rounded-full bg-red-800 mb-8">
            <Scale size={48} />
          </div>
          <h1 className="text-5xl font-serif font-bold mb-4">Buckler v. BP & UK Govt</h1>
          <p className="text-xl text-red-100 max-w-2xl mx-auto uppercase tracking-widest font-bold">
            High Court Action No. Claim-2026-GHF
          </p>
        </div>
      </div>

      <Section>
        <div className="grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-8">
                <div className="bg-white p-8 border border-slate-200 shadow-sm rounded-lg">
                    <h3 className="text-2xl font-serif font-bold mb-6 text-slate-900 flex items-center gap-3">
                        <Gavel className="text-justice-red"/> The Claim
                    </h3>
                    <p className="text-slate-700 leading-relaxed mb-4">
                        The Buckler family has launched a landmark lawsuit against BP Properties Ltd (and its successors) and the UK Government for <strong>Unlawful Dispossession</strong>, <strong>Fraudulent Misrepresentation</strong>, and <strong>Human Rights Violations</strong>.
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                        This legal action challenges the 1987 Court of Appeal ruling, arguing that it was obtained through the concealment of material facts—specifically the "Two Company" fraud where BP Properties Ltd granted a license for land it did not own.
                    </p>
                </div>

                <div className="bg-white p-8 border border-slate-200 shadow-sm rounded-lg">
                    <h3 className="text-2xl font-serif font-bold mb-6 text-slate-900 flex items-center gap-3">
                        <FileText className="text-justice-red"/> Key Arguments
                    </h3>
                    <ul className="space-y-4">
                        <li className="flex gap-4">
                            <span className="font-bold text-justice-red text-lg">01</span>
                            <div>
                                <h4 className="font-bold text-slate-900">Fraud Unravels All</h4>
                                <p className="text-sm text-slate-600">The legal principle that judgments obtained by fraud can be set aside, regardless of time elapsed.</p>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="font-bold text-justice-red text-lg">02</span>
                            <div>
                                <h4 className="font-bold text-slate-900">Institutional Failure</h4>
                                <p className="text-sm text-slate-600">The failure of CADW to list the property and the Government to enforce Human Rights protections constituted a breach of duty.</p>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="font-bold text-justice-red text-lg">03</span>
                            <div>
                                <h4 className="font-bold text-slate-900">Indigenous Rights</h4>
                                <p className="text-sm text-slate-600">Violation of rights as custodians of the Celtic heritage discovered on the site.</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-slate-900 text-white p-6 rounded-lg">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Users size={18}/> Legal Team
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                        The action is being led by a consortium of Human Rights and Property Law specialists.
                    </p>
                    <button className="w-full bg-justice-red py-2 rounded font-bold hover:bg-red-800 transition-colors">
                        Join Class Action Support
                    </button>
                </div>

                <div className="bg-slate-100 p-6 rounded-lg border border-slate-200">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-900">
                        <Globe size={18}/> Global Impact
                    </h3>
                    <p className="text-sm text-slate-600">
                        This case is set to redefine adverse possession laws and corporate accountability in the UK.
                    </p>
                </div>
            </div>
        </div>
      </Section>
    </div>
  );
};

export default LawsuitPage;