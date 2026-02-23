
import React from 'react';
import { Transaction, TransactionType, TransactionStatus } from '../types';
import { 
  TrashIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  CreditCardIcon,
  InboxArrowDownIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: TransactionStatus) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onUpdateStatus }) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] p-20 text-center border-2 border-dashed border-slate-100 shadow-sm">
        <InboxArrowDownIcon className="w-16 h-16 text-slate-100 mx-auto mb-4" />
        <h3 className="text-xl font-black text-slate-300">No History</h3>
        <p className="text-slate-400 mt-1 font-medium">Your circle records will appear here.</p>
      </div>
    );
  }

  const getStatusConfig = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.CONFIRMED: return { label: 'Actual / Reconciled', style: 'bg-green-50 text-green-700 border-green-100', icon: <CheckCircleIcon className="w-3.5 h-3.5" /> };
      case TransactionStatus.PENDING: return { label: 'Draft / Pending Reply', style: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: <ClockIcon className="w-3.5 h-3.5" /> };
      case TransactionStatus.REJECTED: return { label: 'Rejected / Disputed', style: 'bg-rose-50 text-rose-700 border-rose-100', icon: <XCircleIcon className="w-3.5 h-3.5" /> };
      default: return { label: status, style: 'bg-slate-50 text-slate-600 border-slate-100', icon: null };
    }
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Note Type</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Peer</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ledger Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {[...transactions].sort((a,b) => b.createdAt - a.createdAt).map(tx => {
              const status = getStatusConfig(tx.status);
              return (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border shadow-sm ${tx.type === TransactionType.IOU ? 'text-rose-600 bg-white border-rose-100' : 'text-indigo-600 bg-white border-indigo-100'}`}>
                      {tx.type === TransactionType.IOU ? 'I Owe Them' : 'They Owe Me'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-slate-800">{tx.counterpartyEmail}</div>
                    <div className="text-[9px] text-slate-400 truncate max-w-[120px] mono mt-0.5">{tx.reference || 'No Reference'}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`text-base font-black ${tx.type === TransactionType.IOU ? 'text-rose-600' : 'text-indigo-600'}`}>
                      {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      <span className="text-[10px] opacity-40 ml-1.5 font-bold uppercase">{tx.currency}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black border shadow-sm ${status.style}`}>
                      {status.icon}
                      {status.label}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {format(tx.createdAt, 'MMM d, yyyy')}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => onDelete(tx.id)}
                      className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;
