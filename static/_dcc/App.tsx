
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusIcon, 
  ArrowPathIcon, 
  WalletIcon, 
  Cog6ToothIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  XMarkIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { Transaction, TransactionType, TransactionStatus, UserSettings, Payload, LedgerStats } from './types';
import { getTransactions, saveTransactions, getSettings, saveSettings, generateWalletUid } from './utils/storage';
import { getPayloadFromUrl, clearUrlHash, generateDccUrl } from './utils/crypto';
import { generateEmailDraft } from './services/geminiService';
import { fetchExchangeRates, ExchangeRates } from './services/exchangeRateService';

// Components
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import LinkProcessor from './components/LinkProcessor';
import ImportTool from './components/ImportTool';
import LandingPage from './components/LandingPage';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const [activeTab, setActiveTab] = useState<'balances' | 'history' | 'settings' | 'import'>('balances');
  const [incomingPayload, setIncomingPayload] = useState<Payload | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rates, setRates] = useState<ExchangeRates>({ USD: 1 });
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(true);

  useEffect(() => {
    setTransactions(getTransactions());
    const payload = getPayloadFromUrl();
    if (payload) {
      setIncomingPayload(payload);
      setView('app'); // Auto-switch to app if link detected
    }

    // Migration/Ensure UID exists
    if (!settings.walletUid) {
      const newSettings = { ...settings, walletUid: generateWalletUid() };
      setSettings(newSettings);
      saveSettings(newSettings);
    }

    // Initial rates fetch
    fetchExchangeRates().then(setRates);
  }, []);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const stats: LedgerStats = useMemo(() => {
    const balances: Record<string, { confirmedNet: number; proposedInbound: number; proposedOutbound: number }> = {};

    transactions.forEach(t => {
      const cur = t.currency || 'USD';
      if (!balances[cur]) {
        balances[cur] = { confirmedNet: 0, proposedInbound: 0, proposedOutbound: 0 };
      }
      
      if (t.status === TransactionStatus.CONFIRMED) {
        if (t.type === TransactionType.UOM) {
          balances[cur].confirmedNet += t.amount;
        } else {
          balances[cur].confirmedNet -= t.amount;
        }
      } else if (t.status === TransactionStatus.PENDING) {
        if (t.type === TransactionType.UOM) {
          balances[cur].proposedInbound += t.amount;
        } else {
          balances[cur].proposedOutbound += t.amount;
        }
      }
    });

    return { balances };
  }, [transactions]);

  const handleAddTransaction = (newTx: Transaction) => {
    setTransactions(prev => [newTx, ...prev]);
    setShowForm(false);
  };

  const handleUpdateStatus = (id: string, status: TransactionStatus, counterpartyUid?: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { 
        ...t, 
        status, 
        updatedAt: Date.now(), 
        counterpartyWalletUid: counterpartyUid || t.counterpartyWalletUid 
      } : t
    ));
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm("Delete this record permanently?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleAcceptIncoming = async (payload: Payload) => {
    setIsProcessing(true);
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      type: payload.data.type === TransactionType.IOU ? TransactionType.UOM : TransactionType.IOU,
      amount: payload.data.amount || 0,
      currency: payload.data.currency || 'USD',
      counterpartyEmail: payload.senderEmail,
      counterpartyWalletUid: payload.senderWalletUid,
      status: TransactionStatus.CONFIRMED,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      originDate: payload.data.originDate || new Date().toISOString().split('T')[0],
      reference: payload.data.reference || '',
      isOriginator: false,
      relatedTransactionId: payload.data.id
    };

    setTransactions(prev => [newTx, ...prev]);
    
    const responsePayload: Payload = {
      type: 'RESPONSE',
      data: { ...newTx, status: TransactionStatus.CONFIRMED },
      senderEmail: settings.email,
      senderWalletUid: settings.walletUid,
      timestamp: Date.now()
    };

    const confirmUrl = generateDccUrl(responsePayload);
    const draft = await generateEmailDraft(newTx, confirmUrl, settings.email);
    
    const subject = `DCC Accepted: ${newTx.type} - Ref: ${newTx.reference}`;
    const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(payload.senderEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(draft)}&bcc=dcc@datro.xyz`;
    
    window.open(gmailUrl, '_blank');

    setIncomingPayload(null);
    clearUrlHash();
    setIsProcessing(false);
  };

  const handleRejectIncoming = (payload: Payload) => {
    setIncomingPayload(null);
    clearUrlHash();
    alert("Record rejected.");
  };

  const handleProcessResponse = (payload: Payload) => {
    const originalId = payload.data.relatedTransactionId || payload.data.id;
    if (originalId) {
      handleUpdateStatus(originalId, payload.data.status || TransactionStatus.CONFIRMED, payload.senderWalletUid);
    }
    setIncomingPayload(null);
    clearUrlHash();
    alert("Ledger updated from response!");
  };

  const handleImportData = (importedTxs: Transaction[]) => {
    setTransactions(prev => {
      const existingIds = new Set(prev.map(t => t.id));
      const filteredNew = importedTxs.filter(t => !existingIds.has(t.id));
      return [...filteredNew, ...prev];
    });
    alert(`Imported ${importedTxs.length} records.`);
    setActiveTab('history');
  };

  if (view === 'landing') {
    return <LandingPage onLaunch={() => setView('app')} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {showPrivacyNotice && (
        <div className="bg-indigo-600 text-white px-4 py-2 flex items-center justify-between animate-in slide-in-from-top-full duration-500 shadow-lg relative z-[60]">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <LockClosedIcon className="w-4 h-4 shrink-0 text-indigo-300" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em] leading-none">
              Offline Wallet Active &bull; No Server Storage &bull; Pure Client-Side Cache
            </p>
          </div>
          <button onClick={() => setShowPrivacyNotice(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => setView('landing')} className="flex items-center gap-2 hover:opacity-80 transition-opacity group">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-inner group-hover:bg-indigo-500 transition-colors">
              <WalletIcon className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">DCC <span className="text-indigo-400 font-light">| Ledger</span></h1>
          </button>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setActiveTab('import')}
              className={`p-2 rounded-md hover:bg-slate-800 transition-colors ${activeTab === 'import' ? 'bg-slate-800 text-indigo-400' : ''}`}
              title="Import from Emails"
            >
              <ArrowPathIcon className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`p-2 rounded-md hover:bg-slate-800 transition-colors ${activeTab === 'settings' ? 'bg-slate-800 text-indigo-400' : ''}`}
              title="Profile & Wallet UID"
            >
              <Cog6ToothIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {incomingPayload && (
          <div className="mb-8">
            <LinkProcessor 
              payload={incomingPayload} 
              onAccept={handleAcceptIncoming}
              onReject={handleRejectIncoming}
              onResponse={handleProcessResponse}
              isProcessing={isProcessing}
            />
          </div>
        )}

        <nav className="flex gap-2 mb-8 bg-white p-1 rounded-2xl shadow-sm border border-slate-200 w-fit">
          <button 
            onClick={() => setActiveTab('balances')}
            className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'balances' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Wallet Balances
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Ledger History
          </button>
        </nav>

        {activeTab === 'balances' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <Dashboard stats={stats} rates={rates} transactions={transactions} onAddRequest={() => setShowForm(true)} />
            
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
              <InformationCircleIcon className="w-6 h-6 text-indigo-500 shrink-0" />
              <div className="text-sm text-slate-600">
                <h3 className="font-bold text-slate-800 mb-1">DCC Ledger Methodology</h3>
                <p>
                  Balances adjust in real-time based on public exchange rates. 
                  Confirmed reflects settled records. Proposed reflects pending requests.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6 px-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ledger History</h2>
              <button 
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md font-bold active:scale-95"
              >
                <PlusIcon className="w-5 h-5" />
                Generate IOU/UOME
              </button>
            </div>
            <TransactionList 
              transactions={transactions} 
              onDelete={handleDeleteTransaction}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-md mx-auto bg-white p-10 rounded-3xl shadow-xl border border-slate-100 animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black mb-8 text-slate-800 flex items-center gap-2">
              <Cog6ToothIcon className="w-7 h-7 text-indigo-500" />
              Settings
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Your Email</label>
                <input 
                  type="email" 
                  value={settings.email}
                  onChange={e => setSettings({ ...settings, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Your Wallet UID</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={settings.walletUid}
                    onChange={e => setSettings({ ...settings, walletUid: e.target.value })}
                    placeholder="e.g. dcc_xxxx"
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all mono text-xs font-medium bg-slate-50/50"
                  />
                  <button 
                    onClick={() => {
                        const uid = generateWalletUid();
                        setSettings({ ...settings, walletUid: uid });
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-50">
                <button 
                  onClick={() => {
                    saveSettings(settings);
                    alert("Profile updated.");
                  }}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-black transition-all shadow-lg active:scale-[0.98]"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <ImportTool onImport={handleImportData} />
        )}

      </main>

      <footer className="bg-slate-100 border-t border-slate-200 py-10 mt-12">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
          <p className="font-medium uppercase tracking-widest text-[10px] font-black">© 2024 DCC - Debt Cancellation Circle</p>
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-[10px]">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Local Cache Verified
            </span>
            <span className="flex items-center gap-1.5 text-indigo-400 font-bold uppercase tracking-widest text-[10px]">
              BCC: dcc@datro.xyz
            </span>
          </div>
        </div>
      </footer>

      {showForm && (
        <TransactionForm 
          onClose={() => setShowForm(false)} 
          onSubmit={handleAddTransaction}
          userSettings={settings}
        />
      )}
    </div>
  );
};

export default App;
