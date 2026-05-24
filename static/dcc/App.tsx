import React, { useEffect, useMemo, useState } from 'react';

type ContactDebt = {
  id: string;
  name: string;
  email: string;
  theyOweMeGbp: number;
  iOweThemGbp: number;
};

type Edge = { from: string; to: string; amount: number };

const STORAGE_KEY = 'dcc-circle-cache-v1';

const cleanMoney = (value: number) => {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.round(value * 100) / 100);
};

const App: React.FC = () => {
  const [rows, setRows] = useState<ContactDebt[]>([]);
  const [form, setForm] = useState({ name: '', email: '', theyOweMeGbp: '', iOweThemGbp: '' });
  const [importText, setImportText] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ContactDebt[];
      if (Array.isArray(parsed)) setRows(parsed);
    } catch {
      // ignore invalid cache
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }, [rows]);

  const exportedBase64 = useMemo(() => btoa(unescape(encodeURIComponent(JSON.stringify(rows)))), [rows]);

  const edges = useMemo<Edge[]>(() => {
    const result: Edge[] = [];
    for (const row of rows) {
      if (row.iOweThemGbp > 0) result.push({ from: 'me', to: row.email.toLowerCase(), amount: row.iOweThemGbp });
      if (row.theyOweMeGbp > 0) result.push({ from: row.email.toLowerCase(), to: 'me', amount: row.theyOweMeGbp });
    }
    return result;
  }, [rows]);

  const circleSuggestions = useMemo(() => {
    const suggestions: Array<{ a: string; b: string; c: string; cancellable: number }> = [];
    const byFrom = new Map<string, Edge[]>();
    edges.forEach(e => byFrom.set(e.from, [...(byFrom.get(e.from) || []), e]));

    const meOut = byFrom.get('me') || [];
    for (const e1 of meOut) {
      const b = e1.to;
      const bOut = byFrom.get(b) || [];
      for (const e2 of bOut) {
        const c = e2.to;
        if (c === 'me' || c === b) continue;
        const cOut = byFrom.get(c) || [];
        const e3 = cOut.find(x => x.to === 'me');
        if (!e3) continue;
        const cancellable = cleanMoney(Math.min(e1.amount, e2.amount, e3.amount));
        if (cancellable > 0) {
          suggestions.push({ a: b, b: c, c: 'me', cancellable });
        }
      }
    }

    const unique = new Map<string, { a: string; b: string; c: string; cancellable: number }>();
    suggestions.forEach(s => {
      const key = [s.a, s.b].sort().join('|');
      const prev = unique.get(key);
      if (!prev || s.cancellable > prev.cancellable) unique.set(key, s);
    });
    return [...unique.values()].sort((x, y) => y.cancellable - x.cancellable);
  }, [edges]);

  const addRow = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    const newRow: ContactDebt = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      theyOweMeGbp: cleanMoney(Number(form.theyOweMeGbp || 0)),
      iOweThemGbp: cleanMoney(Number(form.iOweThemGbp || 0))
    };
    setRows(prev => [newRow, ...prev]);
    setForm({ name: '', email: '', theyOweMeGbp: '', iOweThemGbp: '' });
  };

  const importData = () => {
    try {
      const decoded = decodeURIComponent(escape(atob(importText.trim())));
      const parsed = JSON.parse(decoded) as ContactDebt[];
      if (!Array.isArray(parsed)) throw new Error('Invalid format');
      setRows(parsed.map(item => ({ ...item, id: item.id || crypto.randomUUID() })));
      setImportText('');
      alert('Imported successfully');
    } catch {
      alert('Import failed. Please check the base64 string.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">DCC — Debt Cancellation Circle</h1>
        <p className="text-sm text-slate-600">Track debts in GBP, cached in your browser. Export/import as base64 to share by email.</p>

        <section className="bg-white rounded-xl shadow p-4 grid gap-3 md:grid-cols-5">
          <input className="border p-2 rounded" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input className="border p-2 rounded" type="number" min="0" step="0.01" placeholder="They owe me (£)" value={form.theyOweMeGbp} onChange={e => setForm({ ...form, theyOweMeGbp: e.target.value })} />
          <input className="border p-2 rounded" type="number" min="0" step="0.01" placeholder="I owe them (£)" value={form.iOweThemGbp} onChange={e => setForm({ ...form, iOweThemGbp: e.target.value })} />
          <button className="bg-indigo-600 text-white rounded px-3 py-2" onClick={addRow}>Add</button>
        </section>

        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">People & Debts</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b"><th>Name</th><th>Email</th><th>They owe me</th><th>I owe them</th><th></th></tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2">{r.name}</td><td>{r.email}</td><td>£{r.theyOweMeGbp.toFixed(2)}</td><td>£{r.iOweThemGbp.toFixed(2)}</td>
                    <td><button className="text-red-600" onClick={() => setRows(prev => prev.filter(x => x.id !== r.id))}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-2">Debt Cancellation Circles (3-party)</h2>
          {circleSuggestions.length === 0 ? (
            <p className="text-sm text-slate-600">No cancellable circles found yet.</p>
          ) : (
            <ul className="list-disc pl-5 text-sm space-y-1">
              {circleSuggestions.map((c, i) => (
                <li key={i}>
                  You owe <b>{c.a}</b>, <b>{c.a}</b> owes <b>{c.b}</b>, and <b>{c.b}</b> owes you. Maximum cancellable amount: <b>£{c.cancellable.toFixed(2)}</b>.
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-xl shadow p-4 space-y-3">
          <h2 className="font-semibold">Export / Import</h2>
          <textarea className="w-full border rounded p-2 h-28" value={exportedBase64} readOnly />
          <button className="border rounded px-3 py-2" onClick={() => navigator.clipboard.writeText(exportedBase64)}>Copy export string</button>
          <textarea className="w-full border rounded p-2 h-28" placeholder="Paste base64 string to import" value={importText} onChange={e => setImportText(e.target.value)} />
          <button className="bg-emerald-600 text-white rounded px-3 py-2" onClick={importData}>Import data</button>
        </section>
      </div>
    </div>
  );
};

export default App;
