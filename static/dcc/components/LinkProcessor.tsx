
import React, { useState } from 'react';
import { Payload, TransactionType, TransactionStatus } from '../types';
import { CheckIcon, XMarkIcon, ExclamationTriangleIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid';

interface LinkProcessorProps {
  payload: Payload;
  onAccept: (payload: Payload) => void;
  onReject: (payload: Payload) => void;
  onResponse: (payload: Payload) => void;
  isProcessing: boolean;
}

const LinkProcessor: React.FC<LinkProcessorProps> = ({ payload, onAccept, onReject, onResponse, isProcessing }) => {
  const [isRejected, setIsRejected] = useState(false);

  if (payload.type === 'RESPONSE') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="bg-green-100 p-4 rounded-2xl text-green-600 shadow-inner">
            <CheckIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-green-900 leading-tight">Confirmation Received!</h3>
            <p className="text-green-700 font-medium mt-1">
              {payload.senderEmail} has reconciled the <strong>{payload.data.type}</strong>.
            </p>
          </div>
        </div>
        <button 
          onClick={() => onResponse(payload)}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-lg flex items-center gap-2 active:scale-95 shrink-0"
        >
          Reconcile My Ledger
          <ArrowTopRightOnSquareIcon className="w-5 h-5" />
        </button>
      </div>
    );
  }

  if (payload.type === 'REQUEST') {
    const isUOM = payload.data.type === TransactionType.UOM;
    const message = isUOM 
      ? `${payload.senderEmail} requests payment for ${payload.data.amount} ${payload.data.currency}.`
      : `${payload.senderEmail} has issued a debt note of ${payload.data.amount} ${payload.data.currency}.`;

    return (
      <div className="bg-white border-2 border-indigo-100 rounded-[2.5rem] p-10 flex flex-col gap-8 animate-in slide-in-from-top-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <ExclamationTriangleIcon className="w-32 h-32 text-indigo-900" />
        </div>
        
        <div className="flex items-start gap-6 relative z-10">
          <div className="bg-indigo-600 p-5 rounded-3xl text-white shadow-lg">
            <ExclamationTriangleIcon className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1 block">Incoming Record Request</span>
            <h3 className="text-2xl font-black text-slate-900 leading-tight">{message}</h3>
            <p className="text-slate-500 font-medium mt-2">Ref: {payload.data.reference || 'Personal Record'}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <button 
            disabled={isProcessing}
            onClick={() => onAccept(payload)}
            className="flex-1 bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.98]"
          >
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckIcon className="w-6 h-6" />
                Accept & Confirm
              </>
            )}
          </button>
          <button 
            disabled={isProcessing}
            onClick={() => onReject(payload)}
            className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-2"
          >
            <XMarkIcon className="w-6 h-6" />
            Reject Offer
          </button>
        </div>
        <div className="text-center">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
             Confirming will reconcile your wallet and draft a return email to {payload.senderEmail}
           </p>
        </div>
      </div>
    );
  }

  return null;
};

export default LinkProcessor;
