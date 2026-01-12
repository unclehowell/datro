
import React, { useState } from 'react';
import { Transaction, TransactionType, TransactionStatus, UserSettings, Payload } from '../types';
import { generateDccUrl } from '../utils/crypto';
import { generateEmailDraft } from '../services/geminiService';
import { 
  XMarkIcon, 
  ChevronRightIcon,
  EnvelopeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface TransactionFormProps {
  onClose: () => void;
  onSubmit: (tx: Transaction) => void;
  userSettings: UserSettings;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'BTC', 'ETH', 'SOL', 'USDC', 'ARS'];

const PROVIDERS = [
  { id: 'gmail', name: 'Gmail', icon: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg', active: true },
  { id: 'outlook', name: 'Outlook', icon: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg', active: false },
  { id: 'proton', name: 'Proton', icon: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Proton_Mail_logo.svg', active: false },
  { id: 'zoho', name: 'Zoho', icon: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Zoho_Corporation_logo.svg', active: false },
  { id: 'yahoo', name: 'Yahoo', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Yahoo%21_icon.svg', active: false },
];

const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, onSubmit, userSettings }) => {
  const [step, setStep] = useState<'form' | 'provider'>('form');
  const [type, setType] = useState<TransactionType>(TransactionType.UOM);
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [email, setEmail] = useState<string>('');
  const [originDate, setOriginDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userSettings.email) {
      alert("Please set your email in Settings before generating a record.");
      return;
    }
    setStep('provider');
  };

  const selectGmail = async () => {
    setIsGenerating(true);
    
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      type,
      amount: parseFloat(amount),
      currency,
      counterpartyEmail: email,
      status: TransactionStatus.PENDING,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      originDate,
      reference: reference.slice(0, 24),
      isOriginator: true
    };

    const payload: Payload = {
      type: 'REQUEST',
      data: newTx,
      senderEmail: userSettings.email,
      senderWalletUid: userSettings.walletUid,
      timestamp: Date.now()
    };

    const dccUrl = generateDccUrl(payload);
    const draft = await generateEmailDraft(newTx, dccUrl, userSettings.email);
    
    const subject = `${type}: ${amount} ${currency} - Ref: ${reference}`;
    const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(draft)}&bcc=dcc@datro.xyz`;
    
    onSubmit(newTx);
    window.open(gmailUrl, '_blank', 'width=800,height=600');
    setIsGenerating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="px-8 py-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {step === 'form' ? 'New Ledger Entry' : 'Select Email Bridge'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {step === 'form' ? (
            <div className="p-8 pt-6 space-y-6">
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button 
                  type="button"
                  onClick={() => setType(TransactionType.UOM)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${type === TransactionType.UOM ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  UOME (Invoice)
                </button>
                <button 
                  type="button"
                  onClick={() => setType(TransactionType.IOU)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${type === TransactionType.IOU ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                >
                  IOU (Note)
                </button>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Recipient Email</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="friend@email.com"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-xs bg-slate-50/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Amount</label>
                    <input 
                      type="number" 
                      step="any"
                      required
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-sm bg-slate-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Currency</label>
                    <select 
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-xs bg-white"
                    >
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1 ml-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Reference</label>
                    <span className={`text-[8px] font-black ${reference.length >= 24 ? 'text-rose-500' : 'text-slate-300'}`}>
                      {24 - reference.length} chars left
                    </span>
                  </div>
                  <input 
                    type="text"
                    maxLength={24}
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    placeholder="Short description"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-xs bg-slate-50/30"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2 group"
                >
                  Generate Bridge Link
                  <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>
          ) : (
            <div className="p-8 space-y-6">
              <p className="text-sm text-slate-500 font-medium text-center">
                Select your preferred email service to send this <strong>{type}</strong> request.
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                {PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => provider.active && selectGmail()}
                    disabled={!provider.active || isGenerating}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      provider.active 
                      ? 'bg-white border-slate-200 hover:border-indigo-500 hover:shadow-md active:scale-[0.98]' 
                      : 'bg-slate-50 border-slate-100 opacity-50 grayscale cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <img src={provider.icon} alt={provider.name} className="w-6 h-6" />
                      <span className="font-bold text-slate-800">{provider.name}</span>
                    </div>
                    {provider.active ? (
                      isGenerating ? (
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <EnvelopeIcon className="w-4 h-4 text-slate-300" />
                      )
                    ) : (
                      <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded">Coming Soon</span>
                    )}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setStep('form')}
                className="w-full py-4 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
              >
                Go Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;
