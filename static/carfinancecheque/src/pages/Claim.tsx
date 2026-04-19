import React from 'react';
import { ClaimForm } from '../components/ClaimForm';
import { ShieldCheck, Clock, CheckCircle } from 'lucide-react';

export const Claim: React.FC = () => {
  return (
    <div className="pb-8">
      {/* Header */}
      <section className="bg-slate-900 text-white py-4 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-xl md:text-2xl font-display font-black uppercase leading-none mb-2">
            Check Your Eligibility
          </h1>
          <p className="text-xs md:text-sm text-brand-accent max-w-2xl mx-auto font-medium uppercase tracking-tight">
            COMPLETE OUR SIMPLE ENQUIRY FORM TO SEE IF YOU ARE ELIGIBLE FOR A PCP CAR FINANCE REFUND.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
              <ClaimForm />
            </div>
          </div>

          {/* Sidebar / Trust Indicators */}
          <div className="space-y-8">
            <div className="p-8 bg-brand-accent rounded-3xl border border-emerald-400 shadow-xl shadow-emerald-500/20 space-y-6">
              <h3 className="font-display font-black text-3xl uppercase text-white">Why Choose Us?</h3>
              <div className="space-y-6">
                {[
                  { icon: ShieldCheck, title: 'FCA Regulated', desc: 'Authorised and regulated by the Financial Conduct Authority.' },
                  { icon: Clock, title: 'Quick Process', desc: 'Our initial check takes less than 60 seconds to complete.' },
                  { icon: CheckCircle, title: 'Expert Support', desc: 'Dedicated claims handlers to guide you through every step.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <item.icon className="w-8 h-8 text-white flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-wider text-white">{item.title}</h4>
                      <p className="text-xs font-medium text-white/70 mt-1 uppercase">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-brand-secondary text-white rounded-3xl border border-blue-400 shadow-xl shadow-blue-500/20 space-y-4">
              <h3 className="font-display font-black text-2xl uppercase">Next Steps</h3>
              <ol className="space-y-4 text-sm font-bold uppercase">
                <li className="flex gap-3"><span className="font-mono text-xl opacity-60">01.</span> Submit your initial enquiry details.</li>
                <li className="flex gap-3"><span className="font-mono text-xl opacity-60">02.</span> We review your eligibility instantly.</li>
                <li className="flex gap-3"><span className="font-mono text-xl opacity-60">03.</span> Our team contacts you to finalize the process.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
