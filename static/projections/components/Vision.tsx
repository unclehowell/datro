import React from 'react';
import Section from './Section';

const Vision: React.FC = () => {
  const PlanCard: React.FC<{ title: string; duration: string; children: React.ReactNode }> = ({ title, duration, children }) => (
    <div className="bg-slate-800 p-6 rounded-lg shadow-md border-l-4 border-amber-400 ring-1 ring-white/10">
      <h3 className="text-2xl font-bold text-slate-100">{title}</h3>
      <p className="text-md text-gray-400 mb-4 font-semibold">{duration}</p>
      <div className="space-y-3 text-base">{children}</div>
    </div>
  );

  return (
    <Section id="vision" title="Our Vision & Business Plan">
        <p>Based on market demand, we prepared this business plan to enable dynamic growth and penetrate the lucrative VIP transportation market. The plan is divided by time horizon.</p>
        <div className="space-y-12 mt-8">
            <PlanCard title="Short-Term Plan" duration="6-12 months (Start: May 2024)">
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>Vehicle Purchase:</strong> Acquire 4 high-end SUVs (Chevrolet Suburban/Tahoe, Lincoln Navigator, Cadillac Escalade).</li>
                    <li><strong>Partnerships:</strong> Sign initial contracts with Hard Rock Hotel Punta Cana and Live Aqua Hotel.</li>
                    <li><strong>Banking:</strong> Select a primary banking partner to build credit history and secure future financing.</li>
                    <li><strong>Operations Hub:</strong> Establish a back-office in the Uvero Alto area with parking, offices, and a car wash.</li>
                    <li><strong>Capital Raising:</strong> Launch the first bond issue of USD 1,000,000.</li>
                    <li><strong>Financial Stability:</strong> Accumulate capital to repay startup investors and transition to bond/bank loan financing.</li>
                </ul>
            </PlanCard>

            <PlanCard title="Medium-Term Plan" duration="1-2 years">
                 <ul className="list-disc list-inside space-y-2">
                    <li><strong>Fleet Expansion:</strong> Purchase 8 additional luxury vehicles and 1 armored vehicle for VIP clients.</li>
                    <li><strong>Brand Merger:</strong> Incorporate an existing car rental company under the Platinum brand.</li>
                    <li><strong>Diversification:</strong> Renew rental fleet with 8 SUVs/2 convertibles and add 6 ATVs, 4 buggies, and tour buses.</li>
                    <li><strong>New Venture:</strong> Establish a subsidiary for importing and selling vehicles from the USA.</li>
                    <li><strong>Financing:</strong> Issue a second wave of bonds worth USD 1,000,000.</li>
                    <li><strong>Corporate Structure:</strong> Unify all business segments under a single comprehensive brand.</li>
                </ul>
            </PlanCard>

            <PlanCard title="Long-Term Plan" duration="2-5 years">
                 <ul className="list-disc list-inside space-y-2">
                    <li><strong>Headquarters:</strong> Purchase land in Punta Cana to build a company headquarters with offices, a showroom, service center, and more.</li>
                    <li><strong>Asset Monetization:</strong> Lease parts of the premises to third parties to increase cash flow.</li>
                    <li><strong>Major Funding:</strong> Issue 3rd, 4th, and 5th bond waves totaling USD 3,000,000 for construction.</li>
                    <li><strong>Financial Transition:</strong> Fully transition from bond financing to bank financing, refinance the HQ, and sell shares to private investors for long-term stability.</li>
                </ul>
            </PlanCard>
        </div>
    </Section>
  );
};

export default Vision;