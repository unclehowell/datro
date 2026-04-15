
import React, { useMemo } from 'react';
import { LedgerStats, Transaction } from '../types';
import { ExchangeRates, convertToUSD } from '../services/exchangeRateService';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  ScaleIcon,
  PlusIcon,
  BanknotesIcon,
  GlobeAltIcon
} from '@heroicons/react/24/solid';

interface DashboardProps {
  stats: LedgerStats;
  rates: ExchangeRates;
  transactions: Transaction[];
  onAddRequest: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, rates, transactions, onAddRequest }) => {
  const currencyList = Object.keys(stats.balances);

  const totalUSD = useMemo(() => {
    let net = 0;
    currencyList.forEach(cur => {
      const b = stats.balances[cur];
      net += convertToUSD(b.confirmedNet, cur, rates);
    });
    return net;
  }, [stats, rates, currencyList]);

  return (
    <div className="space-y-8">
      {/* Total Converted Balance */}
      {currencyList.length > 0 && (
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl overflow-hidden relative border border-slate-800">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <GlobeAltIcon className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">Global Net Worth (Estimated USD)</span>
              <div className={`text-5xl font-black ${totalUSD >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                ${totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live Rates Active</span>
            </div>
          </div>
        </div>
      )}

      {currencyList.length === 0 ? (
        <div className="bg-white p-20 text-center rounded-3xl border-2 border-dashed border-slate-200 shadow-inner">
           <BanknotesIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
           <p className="text-slate-400 font-medium">No activity yet. Generate an IOU or UOME to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {currencyList.map(cur => {
            const b = stats.balances[cur];
            return (
              <div key={cur} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-6 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 group-hover:bg-indigo-600 transition-colors"></div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Currency</span>
                    <h3 className="text-3xl font-black text-slate-900">{cur}</h3>
                  </div>
                  <div className={`p-4 rounded-2xl ${b.confirmedNet >= 0 ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                    <ScaleIcon className="w-8 h-8" />
                  </div>
                </div>
                
                <div className="p-6 bg-slate-50 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Net Settled Balance</span>
                  <div className={`text-4xl font-black ${b.confirmedNet >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                    {b.confirmedNet >= 0 ? '+' : ''}{b.confirmedNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1 text-slate-400">
                      <ArrowTrendingUpIcon className="w-4 h-4 text-indigo-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Proposed UOME</span>
                    </div>
                    <div className="text-xl font-bold text-slate-700">
                      {b.proposedInbound.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1 text-slate-400">
                      <ArrowTrendingDownIcon className="w-4 h-4 text-rose-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Proposed IOU</span>
                    </div>
                    <div className="text-xl font-bold text-slate-700">
                      {b.proposedOutbound.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-200 shadow-sm">
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-black mb-3">Get started</h2>
          <p className="text-slate-500 max-w-md font-medium">
            Issue IOU tickets or request payments with UOMEs. 
            All settled client-side via decentralized Gmail links.
          </p>
        </div>
        <button 
          onClick={onAddRequest}
          className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black hover:bg-indigo-500 transition-all flex items-center gap-3 active:scale-95 shadow-xl"
        >
          <PlusIcon className="w-7 h-7" />
          Generate IOU/UOME
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
