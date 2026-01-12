
export enum TransactionType {
  IOU = 'IOU', // Purchase Note (I owe them)
  UOM = 'UOM'  // Invoice (They owe me)
}

export enum TransactionStatus {
  PENDING = 'PENDING',     // Sent but not yet accepted/rejected
  CONFIRMED = 'CONFIRMED', // Accepted by both parties
  REJECTED = 'REJECTED'    // Refused by recipient
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  counterpartyEmail: string;
  counterpartyWalletUid?: string;
  status: TransactionStatus;
  createdAt: number;
  updatedAt: number;
  originDate: string; // ISO Date string from picker
  reference: string;  // Max 24 characters
  isOriginator: boolean;
  relatedTransactionId?: string;
  // Optional note for additional context provided by users
  note?: string;
}

export interface Payload {
  type: 'REQUEST' | 'RESPONSE';
  data: Partial<Transaction>;
  senderEmail: string;
  senderWalletUid?: string;
  timestamp: number;
}

export interface UserSettings {
  email: string;
  walletUid: string;
  bccEmail: string;
}

export interface CurrencyBalance {
  confirmedNet: number;
  proposedInbound: number;  // Pending UOMEs
  proposedOutbound: number; // Pending IOUs
}

export interface LedgerStats {
  balances: Record<string, CurrencyBalance>;
}
