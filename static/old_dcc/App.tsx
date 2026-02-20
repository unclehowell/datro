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

import { 
  Transaction, 
  TransactionType, 
  TransactionStatus, 
  UserSettings, 
  Payload, 
  LedgerStats 
} from './types';

import { 
  getTransactions, 
  saveTransactions, 
  getSettings, 
  saveSettings, 
  generateWalletUid 
} from './utils/storage';

import { 
  getPayloadFromUrl, 
  clearUrlHash, 
  generateDccUrl 
} from './utils/crypto';

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

    // Clean email template using array + join
    const emailBody = [
      "DCC Acceptance Confirmation",
      "",
      "Hi,",
      "",
      `I have accepted your ${newTx.type} request for ${newTx.amount} ${newTx.currency}`,
      `Reference: ${newTx.reference || '(none)'}`,
      `Original date: ${newTx.originDate}`,
      "",
      "My confirmation link (please open in browser to record the mutual agreement):",
      confirmUrl,
      "",
      "Best regards,",
      settings.email || 'DCC User'
    ].join('\n');

    const subject = `DCC Accepted: ${newTx.type} - Ref: ${newTx.reference || 'No ref'}`;

    const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(payload.senderEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}&bcc=dcc@datro.xyz`;

    window.open(gmailUrl, '_blank');

    setIncomingPayload(null);
    clearUrlHash();
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Landing Page */}
      {view === 'landing' && (
        <LandingPage onLaunch={() => setView('app')} />
      )}

      {/* Main App View */}
      {view === 'app' && (
        <>
          {/* Header / Navigation */}
          <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
            <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-slate-800">DCC Ledger</h1>
              <nav className="flex gap-6">
                <button
                  onClick={() => setActiveTab('balances')}
                  className={`font-medium ${activeTab === 'balances' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}
                >
                  Balances
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`font-medium ${activeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}
                >
                  History
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`font-medium ${activeTab === 'settings' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}
                >
                  Settings
                </button>
                <button
                  onClick={() => setActiveTab('import')}
                  className={`font-medium ${activeTab === 'import' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}
                >
                  Import
                </button>
              </nav>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-5xl mx-auto px-4 py-8">
            {activeTab === 'balances' && (
              <Dashboard 
                stats={stats} 
                rates={rates} 
                transactions={transactions} 
                onAddRequest={() => setShowForm(true)} 
              />
            )}

            {activeTab === 'history' && (
              <TransactionList 
                transactions={transactions}
                onDelete={handleDeleteTransaction}
                onUpdateStatus={handleUpdateStatus}
              />
            )}

            {activeTab === 'settings' && (
              <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow">
                <h2 className="text-xl font-bold mb-6">Settings</h2>
                {/* Add your settings form here */}
              </div>
            )}

            {activeTab === 'import' && <ImportTool />}
          </main>

          {/* Footer */}
          <footer className="bg-slate-100 py-6 text-center text-slate-500 text-sm">
            © 2025 Debt Cancellation Circle • Local-first • Peer-to-peer
          </footer>

          {/* Transaction Form Modal */}
          {showForm && (
            <TransactionForm
              onClose={() => setShowForm(false)}
              onSubmit={handleAddTransaction}
              userSettings={settings}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;
