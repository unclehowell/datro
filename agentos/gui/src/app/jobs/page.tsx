"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Order {
  id: number;
  target_url: string;
  budget_credits: number;
  quantity: number;
  lead_value: number;
  status: string;
  escrow_balance: number;
  created_at: string;
}

interface Wallet {
  wallet_id: string;
  machine_id: string;
  balance: number;
  total_earned: number;
  status: string;
  currency: string;
}

export default function JobsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [msg, setMsg] = useState<string>("");

  const refresh = useCallback(async () => {
    try {
      const [o, w] = await Promise.all([
        fetch("/api/jobs", { signal: AbortSignal.timeout(8000) }),
        fetch("/api/wallet", { signal: AbortSignal.timeout(8000) }),
      ]);
      const od = await o.json();
      const wd = await w.json();
      setOrders(Array.isArray(od.orders) ? od.orders : []);
      if (wd.wallet_id) setWallet(wd);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 20000);
    return () => clearInterval(t);
  }, [refresh]);

  const claim = async (orderId: number) => {
    setClaiming(orderId);
    setMsg("");
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = await res.json();
      setMsg(data.ok ? `Order #${orderId} claimed — campaign started.` : `Failed: ${data.error || "unknown"}`);
      refresh();
    } catch (e: any) {
      setMsg(`Claim failed: ${e.message}`);
    }
    setClaiming(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-black font-bold text-sm">A</div>
          <h1 className="text-lg font-semibold">Jobs &amp; Wallet</h1>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-text-secondary hover:text-text-primary transition-colors">Dashboard</Link>
          <Link href="/jobs" className="text-accent font-medium">Jobs</Link>
          <Link href="/connect" className="text-text-secondary hover:text-text-primary transition-colors">Connect</Link>
          <Link href="/settings" className="text-text-secondary hover:text-text-primary transition-colors">Apps</Link>
        </nav>
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface border border-border rounded-lg p-4">
            <h3 className="font-medium text-sm mb-2">Node Wallet</h3>
            <div className="text-2xl font-light text-accent">{wallet?.balance ?? "—"} <span className="text-xs text-text-muted">FCUK</span></div>
            <div className="text-xs text-text-muted mt-1">Total earned: {wallet?.total_earned ?? "—"} FCUK</div>
            <div className="text-xs text-text-muted">Wallet: <span className="font-mono">{wallet?.wallet_id || "node-…"}</span></div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4">
            <h3 className="font-medium text-sm mb-2">Escrowed Orders</h3>
            <div className="text-2xl font-light">{orders.length}</div>
            <div className="text-xs text-text-muted mt-1">awaiting a capable node</div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4">
            <h3 className="font-medium text-sm mb-2">Payout</h3>
            <div className="text-xs text-text-muted mt-1">Verified leads credit your node wallet automatically.</div>
            <div className="text-xs text-text-muted mt-1">Withdraw on the website Exchange.</div>
          </div>
        </div>

        {msg && (
          <div className="mb-4 px-4 py-2 rounded-lg border border-accent/30 bg-accent/10 text-sm text-text-primary">
            {msg}
          </div>
        )}

        <h2 className="text-sm font-medium text-text-secondary mb-3">Available Lead Orders</h2>

        {loading ? (
          <div className="text-sm text-text-muted">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="text-sm text-text-muted">No escrowed orders right now. New lead orders will appear here.</div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="bg-surface border border-border rounded-lg p-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="text-sm font-medium text-text-primary break-all">{o.target_url}</div>
                  <div className="text-xs text-text-muted mt-1">
                    {o.quantity} leads × {o.lead_value} FCUK &middot; escrow {o.escrow_balance} FCUK &middot; created {o.created_at}
                  </div>
                </div>
                <button
                  onClick={() => claim(o.id)}
                  disabled={claiming === o.id}
                  className="px-4 py-2 rounded-lg bg-accent text-black text-sm font-medium hover:bg-accent/90 disabled:opacity-50"
                >
                  {claiming === o.id ? "Claiming…" : "Claim order"}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
