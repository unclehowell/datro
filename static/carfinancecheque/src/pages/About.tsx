import React from 'react';
import { Shield, Info, HelpCircle, Scale } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="pb-24">
      {/* Header */}
      <section className="bg-slate-900 text-white py-24 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-display font-black uppercase leading-none mb-6">
            The <br />Campaign
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl font-medium text-slate-400 uppercase tracking-tight">
            UNDERSTANDING THE PCP MIS-SELLING SCANDAL AND WHY WE ARE FIGHTING FOR YOUR RIGHTS.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-24 space-y-24">
        {/* What is PCP */}
        <section className="space-y-8 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 text-brand-secondary">
            <Info className="w-10 h-10" />
            <h2 className="text-4xl font-display font-black uppercase">What is PCP Finance?</h2>
          </div>
          <div className="prose prose-xl text-slate-600 max-w-none space-y-6 font-medium">
            <p className="leading-tight">
              Personal Contract Purchase (PCP) is a type of hire purchase agreement for vehicles. It's popular because it offers lower monthly payments by deferring a large portion of the car's value to a "balloon payment" at the end of the term.
            </p>
            <p className="bg-slate-50 p-6 rounded-2xl border-l-4 border-brand-secondary italic text-slate-700">
              While the product itself is legitimate, the way it was sold to millions of UK consumers was often unfair and lacked transparency.
            </p>
          </div>
        </section>

        {/* How Mis-selling Occurred */}
        <section className="space-y-8 bg-slate-900 rounded-3xl text-white p-8 shadow-xl">
          <div className="flex items-center gap-4 text-brand-accent">
            <Scale className="w-10 h-10" />
            <h2 className="text-4xl font-display font-black uppercase">How Mis-selling Occurred</h2>
          </div>
          <div className="prose prose-xl text-slate-400 max-w-none space-y-6 font-medium">
            <p className="leading-tight">
              The core of the scandal lies in "Discretionary Commission Arrangements" (DCAs). Lenders allowed car dealers to set the interest rate for the customer. The higher the interest rate the dealer could convince the customer to pay, the more commission the dealer received.
            </p>
            <p className="text-brand-accent font-bold">
              This created a massive incentive for dealers to overcharge customers, often without disclosing that they were receiving a commission at all, let alone one tied to the interest rate.
            </p>
          </div>
        </section>

        {/* Why Consumers Were Affected */}
        <section className="space-y-8 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 text-brand-secondary">
            <Users className="w-10 h-10" />
            <h2 className="text-4xl font-display font-black uppercase">Why Consumers Were Affected</h2>
          </div>
          <div className="prose prose-xl text-slate-600 max-w-none space-y-6 font-medium">
            <p className="leading-tight">
              Millions of people across the UK took out car finance between 2007 and 2021. Many of these people were hard-working individuals who trusted their local car dealers to provide a fair deal.
            </p>
            <p className="bg-brand-accent/10 p-6 rounded-2xl border-l-4 border-brand-accent italic text-slate-700">
              Instead, they were often treated as profit centers, with hidden fees and inflated rates adding thousands of pounds to the cost of their vehicles. This campaign is about reclaiming that money and ensuring it goes back to the people it was taken from.
            </p>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="bg-brand-secondary rounded-3xl p-12 text-center space-y-6 shadow-2xl shadow-blue-500/20">
          <Shield className="w-20 h-20 mx-auto text-white" />
          <h2 className="text-5xl font-display font-black uppercase text-white">Our Mission</h2>
          <p className="text-2xl text-white font-bold uppercase leading-tight">
            "TO PROVIDE EVERY MIS-SOLD CONSUMER WITH THE TOOLS, INFORMATION, AND LEGAL SUPPORT NEEDED TO RECLAIM WHAT IS RIGHTFULLY THEIRS, WHILE DRIVING SYSTEMIC CHANGE IN THE UK FINANCE INDUSTRY."
          </p>
        </section>
      </div>
    </div>
  );
};

const Users = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
