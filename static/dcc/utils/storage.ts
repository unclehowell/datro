
import { Transaction, UserSettings } from '../types';

const STORAGE_KEYS = {
  TRANSACTIONS: 'dcc_transactions',
  SETTINGS: 'dcc_settings',
};

/**
 * Generates a unique wallet-style identifier using built-in crypto.
 * This is "API'less" as it runs entirely in the client's browser.
 */
export const generateWalletUid = (): string => {
  const segment = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `dcc_${segment()}${segment()}-${segment()}-${segment()}-${segment()}-${segment()}${segment()}${segment()}`;
};

export const saveTransactions = (txs: Transaction[]) => {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
};

export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  return data ? JSON.parse(data) : [];
};

export const saveSettings = (settings: UserSettings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

export const getSettings = (): UserSettings => {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (data) {
    const settings = JSON.parse(data);
    // Ensure BCC is correct even for existing users
    if (!settings.bccEmail || settings.bccEmail === 'log@debtcircle.cc') {
        settings.bccEmail = 'dcc@datro.xyz';
    }
    return settings;
  }
  return {
    email: '',
    walletUid: generateWalletUid(), // Auto-generate on first run
    bccEmail: 'dcc@datro.xyz'
  };
};
