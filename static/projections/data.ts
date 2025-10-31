import { MonthlyCashflow, ProfitLoss, BalanceSheet, OperationalBreakdownItem } from './types';

export const monthlyCashflowData: MonthlyCashflow[] = [
  // Policy: Hold only 25% of next month's operating costs in cash, pay the rest as dividends.
  { month: 'May', contractsRevenue: 25000, operatingCosts: 18000, loanPayments: 8000, dividendsPaid: 0, netCashflow: -1000, closingCash: -1000 },
  { month: 'Jun', contractsRevenue: 40000, operatingCosts: 20000, loanPayments: 8000, dividendsPaid: 5250, netCashflow: 6750, closingCash: 5750 },
  { month: 'Jul', contractsRevenue: 50000, operatingCosts: 23000, loanPayments: 8000, dividendsPaid: 18500, netCashflow: 500, closingCash: 6250 },
  { month: 'Aug', contractsRevenue: 55000, operatingCosts: 25000, loanPayments: 8000, dividendsPaid: 21500, netCashflow: 500, closingCash: 6750 },
  { month: 'Sep', contractsRevenue: 55000, operatingCosts: 27000, loanPayments: 8000, dividendsPaid: 19750, netCashflow: 250, closingCash: 7000 },
  { month: 'Oct', contractsRevenue: 60000, operatingCosts: 28000, loanPayments: 8000, dividendsPaid: 23500, netCashflow: 500, closingCash: 7500 },
  { month: 'Nov', contractsRevenue: 60000, operatingCosts: 30000, loanPayments: 8000, dividendsPaid: 21750, netCashflow: 250, closingCash: 7750 },
  { month: 'Dec', contractsRevenue: 65000, operatingCosts: 31000, loanPayments: 8000, dividendsPaid: 26000, netCashflow: 0, closingCash: 7750 },
  { month: 'Jan', contractsRevenue: 65000, operatingCosts: 31000, loanPayments: 8000, dividendsPaid: 25750, netCashflow: 250, closingCash: 8000 },
  { month: 'Feb', contractsRevenue: 70000, operatingCosts: 32000, loanPayments: 8000, dividendsPaid: 29750, netCashflow: 250, closingCash: 8250 },
  { month: 'Mar', contractsRevenue: 70000, operatingCosts: 33000, loanPayments: 8000, dividendsPaid: 29000, netCashflow: 0, closingCash: 8250 },
  { month: 'Apr', contractsRevenue: 70000, operatingCosts: 33000, loanPayments: 8000, dividendsPaid: 29000, netCashflow: 0, closingCash: 8250 },
];

export const profitLossData: ProfitLoss[] = [
  // Dividends are now maximized, leaving minimal retained earnings.
  { year: 2025, revenue: 600000, operatingCosts: 300000, loanInterest: 100000, netProfit: 200000, dividends: 189583 },
  { year: 2026, revenue: 1000000, operatingCosts: 500000, loanInterest: 150000, netProfit: 350000, dividends: 334375 },
  { year: 2027, revenue: 1500000, operatingCosts: 750000, loanInterest: 200000, netProfit: 550000, dividends: 529167 },
];

export const balanceSheetData: BalanceSheet[] = [
  // Assets and Equity are lower due to cash being paid out as dividends instead of retained.
  { year: 2025, assets: 890417, liabilities: 650000, equity: 240417 },
  { year: 2026, assets: 1106042, liabilities: 850000, equity: 256042 },
  { year: 2027, assets: 1476875, liabilities: 1200000, equity: 276875 },
];

export const operationalBreakdownData: OperationalBreakdownItem[] = [
  { category: 'Driver wages', detail: '8 drivers @ $1,000 each', monthlyCost: 8000 },
  { category: 'Fuel', detail: 'SUV fleet consumption (~2,500L @ $1.40)', monthlyCost: 3500 },
  { category: 'Maintenance', detail: 'Repairs, cleaning, servicing', monthlyCost: 1500 },
  { category: 'Insurance & taxes', detail: 'Vehicle & business', monthlyCost: 2000 },
  { category: 'Admin & office', detail: 'Rent, utilities, salaries', monthlyCost: 2500 },
  { category: 'Marketing & IT', detail: 'Online ads, booking platform', monthlyCost: 1500 },
];