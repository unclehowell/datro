// Types for Battleship Motion Graph
export interface NominalCode {
  code: string;
  description: string;
  value: number;
}

export interface QuadrantFinancials {
  total: number;
  nominals: NominalCode[];
}

export interface YearlyFinancials {
  year: number;
  label: string;
  income: QuadrantFinancials;
  assets: QuadrantFinancials;
  liabilities: QuadrantFinancials;
  expenses: QuadrantFinancials;
}

// Fix: Add missing type definitions for Financials data, Navbar, and Timeline.
export interface MonthlyCashflow {
  month: string;
  contractsRevenue: number;
  operatingCosts: number;
  loanPayments: number;
  dividendsPaid: number;
  netCashflow: number;
  closingCash: number;
}

export interface ProfitLoss {
  year: number;
  revenue: number;
  operatingCosts: number;
  loanInterest: number;
  netProfit: number;
  dividends: number;
}

export interface BalanceSheet {
  year: number;
  assets: number;
  liabilities: number;
  equity: number;
}

export interface OperationalBreakdownItem {
  category: string;
  detail: string;
  monthlyCost: number;
}

export type Tab = 'Motion Graph' | 'Timeline' | 'Introduction' | 'Business Plan' | 'Financials' | 'Investment' | 'Contact';

export type TimelineCategory = 'Milestone' | 'Finance' | 'Expansion' | 'Operations';

export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  category: TimelineCategory;
}
