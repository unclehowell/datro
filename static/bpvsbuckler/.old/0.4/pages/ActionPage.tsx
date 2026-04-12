import React from 'react';
import Section from '../components/Section';
import { Send, CheckCircle } from 'lucide-react';

const ActionPage: React.FC = () => {
  return (
    <div className="bg-parchment min-h-screen">
      <div className="bg-green-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">A Call to Action</h1>
          <p className="text-xl text-green-100 italic">
            "Justice will not be served until those who are unaffected are as outraged as those who are."
          </p>
          <p className="mt-4 text-sm opacity-80">— Benjamin Franklin</p>
        </div>
      </div>

      <Section title="The Family's Request" subtitle="Paths to Justice and Compensation">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden mb-12 border border-stone-200">
          <ul className="divide-y divide-stone-100">
            {[
              { title: "Justice", desc: "Acknowledgment of the wrongs committed against the family." },
              { title: "Compensation", desc: "Financial restitution for the loss of home, livelihood, and heritage." },
              { title: "Recognition", desc: "Public acknowledgment of the family's historical connection to the land and Marconi." },
              { title: "Return", desc: "Return of any artifacts or treasures excavated from beneath the farm." },
              { title: "Remembrance", desc: "A memorial or plaque at the site commemorating the family's 400+ years of occupation." }
            ].map((item, i) => (
              <li key={i} className="p-6 flex items-start gap-4 hover:bg-stone-50 transition-colors">
                <div className="mt-1 text-green-700">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-ink">{item.title}</h3>
                  <p className="text-stone-600">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-stone-800 text-white p-8 rounded-lg">
                <h3 className="text-2xl font-serif font-bold mb-4">Contact & Support</h3>
                <p className="mb-6 text-stone-300">
                    This document is a living record. Support the Buckler family's quest for justice by sharing this story or providing legal expertise.
                </p>
                <button className="bg-white text-stone-900 px-6 py-3 rounded font-bold flex items-center gap-2 hover:bg-stone-200 transition-colors w-full justify-center">
                    <Send size={18} />
                    Contact Campaign
                </button>
            </div>
            
            <div className="bg-justice-red text-white p-8 rounded-lg">
                <h3 className="text-2xl font-serif font-bold mb-4">Legal Strategy</h3>
                <p className="mb-6 text-red-100">
                    We are currently pursuing:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-red-100">
                    <li>Civil Claims for Historical Misfeasance</li>
                    <li>Human Rights Claims (ECHR Article 8 & Protocol 1)</li>
                    <li>Public Inquiry via Welsh Government</li>
                    <li>Restitution based on Unjust Enrichment</li>
                </ul>
            </div>
        </div>
      </Section>
    </div>
  );
};

export default ActionPage;