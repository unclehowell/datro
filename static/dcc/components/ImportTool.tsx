
import React, { useState } from 'react';
import { Transaction } from '../types';
import { decodePayload } from '../utils/crypto';
import { ArrowDownTrayIcon, MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface ImportToolProps {
  onImport: (txs: Transaction[]) => void;
}

const ImportTool: React.FC<ImportToolProps> = ({ onImport }) => {
  const [rawData, setRawData] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    const regex = /#data=([A-Za-z0-9+/=]+)/g;
    const matches = [...rawData.matchAll(regex)];
    
    if (matches.length === 0) {
      alert("No DCC links found in the text provided. Ensure you've pasted the raw email content containing the confirmation links.");
      setIsScanning(false);
      return;
    }

    const imported: Transaction[] = [];
    matches.forEach(match => {
      const b64 = match[1];
      const payload = decodePayload(b64);
      if (payload && payload.data) {
        const d = payload.data;
        // Reconstruct transaction with reasonable defaults for missing history fields
        const tx: Transaction = {
          id: d.id || crypto.randomUUID(),
          type: d.type || (payload.type === 'RESPONSE' ? 'IOU' : 'UOM') as any,
          amount: d.amount || 0,
          currency: d.currency || 'USD',
          counterpartyEmail: payload.senderEmail || 'Recovered User',
          counterpartyWalletUid: payload.senderWalletUid,
          status: d.status || 'CONFIRMED' as any,
          createdAt: payload.timestamp || Date.now(),
          updatedAt: Date.now(),
          originDate: d.originDate || new Date().toISOString().split('T')[0],
          reference: d.reference || 'Recovered Record',
          isOriginator: false
        };
        imported.push(tx);
      }
    });

    onImport(imported);
    setRawData('');
    setIsScanning(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h2 className="text-2xl font-black mb-3 text-slate-900">Account Recovery</h2>
        <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">
          Paste the body text of your DCC emails here. We will extract the encoded links to rebuild your local ledger cache and wallet history.
        </p>

        <textarea 
          value={rawData}
          onChange={e => setRawData(e.target.value)}
          placeholder="Paste DCC emails or links here..."
          className="w-full h-80 p-6 border border-slate-200 rounded-3xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none mono text-xs shadow-inner bg-slate-50/50"
        />

        <div className="mt-8 flex gap-4">
          <button 
            onClick={handleScan}
            disabled={!rawData || isScanning}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.98]"
          >
            {isScanning ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <MagnifyingGlassIcon className="w-6 h-6" />
                Recover Ledger
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 flex items-start gap-4 shadow-sm">
        <div className="p-3 bg-indigo-50 rounded-2xl">
           <SparklesIcon className="w-6 h-6 text-indigo-500" />
        </div>
        <div className="text-sm text-slate-600 leading-relaxed">
          <h4 className="font-black text-slate-800 mb-1 uppercase tracking-widest text-[10px]">Privacy & Security</h4>
          <p className="font-medium">
            Data is parsed entirely in your browser. No email content is sent to any server. Your ledger exists only in your local cache and your email history.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImportTool;
