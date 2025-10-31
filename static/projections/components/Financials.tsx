import React from 'react';
import Section from './Section';
import { monthlyCashflowData, profitLossData, balanceSheetData, operationalBreakdownData } from '../data';
import { MonthlyCashflow, ProfitLoss, BalanceSheet, OperationalBreakdownItem } from '../types';
import ProfitLossChart from './charts/ProfitLossChart';
import BalanceSheetChart from './charts/BalanceSheetChart';
import CashflowChart from './charts/CashflowChart';
import OperationalBreakdownChart from './charts/OperationalBreakdownChart';
import ChartCard from './charts/ChartCard';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const handleScrollClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Add a highlight effect
        element.classList.add('transition-all', 'duration-500', 'bg-amber-500/10', 'rounded-lg');
        setTimeout(() => {
            element.classList.remove('bg-amber-500/10');
        }, 1500);
    }
};

const FinancialTable: React.FC<{ headers: string[]; children: React.ReactNode }> = ({ headers, children }) => (
    <div className="overflow-x-auto rounded-lg shadow-md bg-slate-800 ring-1 ring-white/10">
        <table className="w-full text-sm text-left text-slate-300">
            <thead className="bg-slate-700 text-xs text-white uppercase tracking-wider">
                <tr>
                    {headers.map((header) => <th key={header} scope="col" className="px-6 py-3">{header}</th>)}
                </tr>
            </thead>
            <tbody>
                {children}
            </tbody>
        </table>
    </div>
);


const Financials: React.FC = () => {
    return (
        <Section id="financials" title="Financial Projections">
            <div className="space-y-16">
                <div>
                    <div className="p-4 mb-8 bg-sky-900/50 border-l-4 border-sky-500 text-sky-200 rounded-lg">
                        <p className="font-bold">New Financial Strategy</p>
                        <p>These projections reflect an aggressive dividend policy. The company retains only enough cash to cover 25% of the next month's operating costs, distributing all other profits to shareholders.</p>
                    </div>
                    <ChartCard title="Projected Profit & Loss (2025-2027)">
                        <ProfitLossChart data={profitLossData} />
                    </ChartCard>
                    <FinancialTable headers={['Year', 'Revenue', 'Operating Costs', 'Loan & Interest', 'Net Profit', 'Dividends']}>
                        {profitLossData.map((row: ProfitLoss) => (
                            <tr key={row.year} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700">
                                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{row.year}</td>
                                <td className="px-6 py-4">{formatCurrency(row.revenue)}</td>
                                <td className="px-6 py-4">
                                     <a href="#operational-breakdown" onClick={(e) => handleScrollClick(e, 'operational-breakdown')} className="text-amber-400 hover:underline font-semibold cursor-pointer" title="See Operational Breakdown">
                                        {formatCurrency(row.operatingCosts)}
                                    </a>
                                </td>
                                <td className="px-6 py-4">{formatCurrency(row.loanInterest)}</td>
                                <td className="px-6 py-4 font-semibold text-green-400">{formatCurrency(row.netProfit)}</td>
                                <td className="px-6 py-4 font-bold text-sky-400">{formatCurrency(row.dividends)}</td>
                            </tr>
                        ))}
                    </FinancialTable>
                </div>
                
                <div>
                    <ChartCard title="Projected Balance Sheet (2025-2027)">
                        <BalanceSheetChart data={balanceSheetData} />
                    </ChartCard>
                    <FinancialTable headers={['Year', 'Assets', 'Liabilities', 'Equity']}>
                        {balanceSheetData.map((row: BalanceSheet) => (
                            <tr key={row.year} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700">
                                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{row.year}</td>
                                <td className="px-6 py-4">{formatCurrency(row.assets)}</td>
                                <td className="px-6 py-4">{formatCurrency(row.liabilities)}</td>
                                <td className="px-6 py-4 font-semibold">{formatCurrency(row.equity)}</td>
                            </tr>
                        ))}
                    </FinancialTable>
                </div>

                <div>
                     <ChartCard title="Year 1 Monthly Closing Cash Forecast (USD)">
                        <CashflowChart data={monthlyCashflowData} />
                    </ChartCard>
                    <FinancialTable headers={['Month', 'Contracts Revenue', 'Operating Costs', 'Loan Payments', 'Dividends Paid', 'Net Cashflow', 'Closing Cash']}>
                        {monthlyCashflowData.map((row: MonthlyCashflow) => (
                            <tr key={row.month} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700">
                                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{row.month}</td>
                                <td className="px-6 py-4 text-green-400">{formatCurrency(row.contractsRevenue)}</td>
                                <td className="px-6 py-4 text-red-400">({formatCurrency(row.operatingCosts)})</td>
                                <td className="px-6 py-4 text-red-400">({formatCurrency(row.loanPayments)})</td>
                                <td className="px-6 py-4 text-sky-400">({formatCurrency(row.dividendsPaid)})</td>
                                <td className={`px-6 py-4 font-semibold ${row.netCashflow < 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(row.netCashflow)}</td>
                                <td className={`px-6 py-4 font-bold ${row.closingCash < 0 ? 'text-red-500' : 'text-white'}`}>{formatCurrency(row.closingCash)}</td>
                            </tr>
                        ))}
                    </FinancialTable>
                </div>

                <div id="operational-breakdown" className="pt-8">
                    <ChartCard title="Operational Cost Breakdown (Example Month)">
                        <OperationalBreakdownChart data={operationalBreakdownData} />
                    </ChartCard>
                     <FinancialTable headers={['Category', 'Detail', 'Monthly Cost (USD)']}>
                        {operationalBreakdownData.map((row: OperationalBreakdownItem) => (
                            <tr key={row.category} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700">
                                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{row.category}</td>
                                <td className="px-6 py-4">{row.detail}</td>
                                <td className="px-6 py-4 font-semibold">{formatCurrency(row.monthlyCost)}</td>
                            </tr>
                        ))}
                        <tr className="bg-slate-700 font-bold text-white">
                             <td className="px-6 py-4" colSpan={2}>Total Operating Cost</td>
                             <td className="px-6 py-4">{formatCurrency(operationalBreakdownData.reduce((acc, item) => acc + item.monthlyCost, 0))}</td>
                        </tr>
                    </FinancialTable>
                     <p className="text-sm text-gray-400 mt-4">
                        This breakdown shows typical day-to-day operations for peak tourism months. Contracts are expected to yield an average of USD 60,000–65,000 per month with total operational costs around USD 19,000 (note: forecast tables use higher, more conservative estimates), resulting in strong net margins and predictable quarterly dividends for investors.
                    </p>
                </div>
            </div>
        </Section>
    );
};

export default Financials;