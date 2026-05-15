export interface WalletInfo {
  walletId: string;
  balance: number;
  currency: string;
  credited: boolean;
  isNew?: boolean;
  tatumId?: string | null;
}

export interface TransferResult {
  senderWalletId: string;
  receiverWalletId: string;
  amount: number;
  senderBalance: number;
  agentBalance: number;
  currency: string;
}

export async function createWallet(sessionId: string): Promise<WalletInfo> {
  const res = await fetch('/api/wallet/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) throw new Error('Failed to create wallet');
  return res.json();
}

export async function creditWallet(sessionId: string, amount = 50): Promise<WalletInfo> {
  const res = await fetch('/api/wallet/credit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, amount }),
  });
  if (!res.ok) throw new Error('Failed to credit wallet');
  return res.json();
}

export async function getWalletBalance(sessionId: string): Promise<WalletInfo> {
  const res = await fetch(`/api/wallet/${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error('Failed to get wallet balance');
  return res.json();
}

export async function transferToAgent(sessionId: string, amount: number): Promise<TransferResult> {
  const res = await fetch('/api/wallet/transfer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, amount }),
  });
  if (!res.ok) {
    const err = await res.json() as any;
    throw new Error(err.error || 'Transfer failed');
  }
  return res.json();
}

export async function getAgentWallet(): Promise<WalletInfo> {
  const res = await fetch('/api/wallet/agent');
  if (!res.ok) throw new Error('Failed to get agent wallet');
  return res.json();
}
