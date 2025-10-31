import React from 'react';
import Section from './Section';

const InvestmentTerms: React.FC = () => {

  const TermCard: React.FC<{ title: string; content: string; rate: string }> = ({ title, content, rate }) => (
    <div className="bg-slate-800 p-6 rounded-lg shadow-md text-center border-t-4 border-slate-600 ring-1 ring-white/10">
      <h4 className="text-xl font-bold text-slate-100">{title}</h4>
      <p className="text-gray-400 mt-1">{content}</p>
      <p className="text-3xl font-bold text-amber-400 mt-3">{rate}</p>
    </div>
  );
  
  return (
    <Section id="terms" title="Terms for Startup Investors">
        <p>We have developed several financing alternatives for investors, offering a contract with a guaranteed fixed interest rate throughout the entire duration of the investment. Interest payments are made quarterly.</p>

        <div className="grid md:grid-cols-2 gap-8 my-8">
            <TermCard title="Short-Term Investment" content="12-month duration" rate="18% p.a. (1.5%/month)" />
            <TermCard title="Long-Term Investment" content="24-month duration" rate="12% p.a. (1%/month)" />
        </div>
        
        <div className="bg-slate-800/50 p-6 rounded-lg ring-1 ring-white/10">
            <h4 className="font-bold text-xl text-slate-100 mb-3">Interest Payment Examples</h4>
            <ul className="list-disc list-inside space-y-2">
                <li>A <strong>USD 100,000</strong> investment over 12 months yields <strong>USD 18,000</strong> in total interest.</li>
                <li>A <strong>USD 200,000</strong> investment over 12 months yields <strong>USD 36,000</strong> in total interest.</li>
                <li>A <strong>USD 100,000</strong> investment over 24 months yields <strong>USD 24,000</strong> in total interest.</li>
                 <li>A <strong>USD 200,000</strong> investment over 24 months yields <strong>USD 48,000</strong> in total interest.</li>
            </ul>
             <p className="mt-4 pt-4 border-t border-gray-700 font-semibold">The fixed interest rate for future investors owning corporate bonds will be 11% per annum.</p>
        </div>
        
    </Section>
  );
};

export default InvestmentTerms;