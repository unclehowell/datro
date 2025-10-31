import React from 'react';
import Section from './Section';

const Guarantees: React.FC = () => {

  const GuaranteeItem: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-400 text-slate-900">
          <svg xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            {icon === 'vehicle' && <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 012.25 12v-1.5a3.375 3.375 0 003.375-3.375H7.5a1.125 1.125 0 011.125 1.125v1.5m12 1.5v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H7.5A3.375 3.375 0 004.125 6v1.5" />}
            {icon === 'land' && <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />}
            {icon === 'shares' && <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.75A.75.75 0 013 4.5h.75m0 0h.75A.75.75 0 015.25 6v.75m0 0H3.75m0 0A.75.75 0 013 6V5.25m5.25 0v.75A.75.75 0 018.25 6h-.75m0 0V5.25A.75.75 0 018.25 4.5h.75m0 0h.75a.75.75 0 01.75.75v.75m0 0h-1.5m0 0A.75.75 0 018.25 6V5.25m5.25 0v.75a.75.75 0 01-.75.75h-.75m0 0V5.25a.75.75 0 01.75-.75h.75m0 0h.75a.75.75 0 01.75.75v.75m0 0h-1.5m0 0a.75.75 0 01-.75-.75V5.25m-5.25 9v.75a.75.75 0 01-.75.75h-.75m0 0v-.75a.75.75 0 01.75-.75h.75m0 0h.75a.75.75 0 01.75.75v.75m0 0h-1.5m0 0a.75.75 0 01-.75-.75v-.75" />}
          </svg>
        </div>
      </div>
      <div>
        <h4 className="text-xl font-bold text-slate-100">{title}</h4>
        <p className="mt-1 text-base">{children}</p>
      </div>
    </div>
  );

  return (
    <Section id="guarantees" title="Guarantees & Investment Protection">
        <p>Depending on the total amount of the provided investment, we will be able to offer the investor various types of guarantees:</p>
        <div className="space-y-8 mt-8">
            <GuaranteeItem icon="vehicle" title="Vehicle Registration">
                Procured vehicles can be registered in the investor’s name, with title directly issued. We also offer a notarial custody option against the title of the car registered under the company's name.
            </GuaranteeItem>
            <GuaranteeItem icon="land" title="Real Estate Guarantee">
                A real guarantee in the form of land located in a very lucrative location of Las Terrenas of equal value of the provided investment. The total value of the land allocated for this purpose is over USD 1,000,000.
            </GuaranteeItem>
            <GuaranteeItem icon="shares" title="Company Shares & Bonds">
                Company shares and bonds guarantee in the total amount of USD 1,000,000.
            </GuaranteeItem>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700">
          <p className="font-semibold">Upon conclusion of the investment period, the principal investment amount will be paid back in full. Interest is scheduled to be paid quarterly throughout the whole investment period.</p>
          <p className="mt-4">In case of continuous collaboration after a 24-month investment period, we are open to negotiating the purchase of the company's shares or the purchase of bonds issued by the company.</p>
        </div>
    </Section>
  );
};

export default Guarantees;