
import React from 'react';
import InvestmentTerms from './InvestmentTerms';
import Guarantees from './Guarantees';

const InvestmentPage: React.FC = () => {
    return (
        <div className="space-y-20">
            <InvestmentTerms />
            <Guarantees />
        </div>
    );
};

export default InvestmentPage;
