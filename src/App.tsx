import { useState, useEffect, useRef } from 'react';

// ─── Types ─────────────────────────────────────────────────
interface ChildNode {
  id: string;
  url: string;
  name: string;
  status: 'online' | 'offline' | 'busy';
  lastSeen: number;
  model: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  childId?: string;
  latency?: number;
}

// ─── Child proxy URL ───────────────────────────────────────
const CHILD_PROXY_URL = 'https://child-proxy.financecheque.uk';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [childNodes, setChildNodes] = useState<ChildNode[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>(() => 
    `parent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Poll child node status ──────────────────────────────
  useEffect(() => {
    const checkChild = async () => {
      try {
        const res = await fetch(`${CHILD_PROXY_URL}/api/proxy/status`);
        if (res.ok) {
          const data = await res.json();
          setChildNodes([{
            id: 'laptop-child',
            url: CHILD_PROXY_URL,
            name: 'Uncle Howell Laptop',
            status: data.locked ? 'busy' : 'online',
            lastSeen: Date.now(),
            model: data.model || 'minicpm5',
          }]);
          if (!selectedChild) setSelectedChild('laptop-child');
        } else {
          setChildNodes(prev => prev.map(n => 
            n.id === 'laptop-child' ? { ...n, status: 'offline' } : n
          ));
        }
      } catch {
        setChildNodes(prev => prev.map(n => 
          n.id === 'laptop-child' ? { ...n, status: 'offline' } : n
        ));
      }
    };
    checkChild();
    const iv = setInterval(checkChild, 10000);
    return () => clearInterval(iv);
  }, [selectedChild]);

  // ─── Send message to child proxy ─────────────────────────
  const send = async () => {
    const msg = input.trim();
    if (!msg || streaming || !selectedChild) return;

    const userMsg: ChatMessage = { role: 'user', content: msg, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStreaming(true);

    const assistantMsg: ChatMessage = { role: 'assistant', content: '', timestamp: Date.now(), childId: selectedChild };
    setMessages(prev => [...prev, assistantMsg]);

    const startTime = Date.now();

    try {
      // Submit to child proxy
      const submitRes = await fetch(`${CHILD_PROXY_URL}/api/proxy/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: msg,
          origin: 'financecheque.uk',
          sessionId,
        }),
      });

      if (!submitRes.ok) {
        const err = await submitRes.json();
        throw new Error(err.error || 'Submit failed');
      }

      const { sessionId: proxySessionId } = await submitRes.json();

      // Poll for response
      let response = null;
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds max

      while (!response && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 1000));
        attempts++;

        const pollRes = await fetch(`${CHILD_PROXY_URL}/api/proxy/poll?sessionId=${proxySessionId}`);
        if (!pollRes.ok) continue;

        const pollData = await pollRes.json();
        
        if (pollData.status === 'completed') {
          response = pollData.response;
        } else if (pollData.status === 'error') {
          throw new Error(pollData.error || 'Processing failed');
        }
      }

      if (!response) {
        throw new Error('Timeout waiting for response');
      }

      const latency = Date.now() - startTime;

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: response,
          latency,
        };
        return updated;
      });
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Finance Cheque UK</h1>
            <p className="text-xs text-white/40 mt-1">Parent Proxy — Agent Network</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] text-white/40 uppercase tracking-widest">Session</div>
              <div className="text-xs font-mono text-white/60">{sessionId.slice(0, 20)}...</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Child Nodes */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/40">Child Proxies</h2>
          
          {childNodes.length === 0 ? (
            <div className="p-4 border border-white/10 rounded-lg text-center text-white/30 text-sm">
              No child proxies connected
            </div>
          ) : (
            <div className="space-y-2">
              {childNodes.map(node => (
                <button
                  key={node.id}
                  onClick={() => setSelectedChild(node.id)}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    selectedChild === node.id
                      ? 'border-accent bg-accent/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">{node.name}</span>
                    <span className={`w-2 h-2 rounded-full ${
                      node.status === 'online' ? 'bg-green-500' :
                      node.status === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                  <div className="text-[10px] text-white/40 font-mono">{node.model}</div>
                  <div className="text-[10px] text-white/30 mt-1">
                    {node.status === 'online' ? 'Ready' :
                     node.status === 'busy' ? 'Locked by another session' : 'Offline'}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="p-4 border border-white/10 rounded-lg space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Flow</h3>
            <div className="text-[10px] text-white/50 space-y-1">
              <div>1. User submits prompt</div>
              <div>2. Parent → Child proxy</div>
              <div>3. Child processes locally</div>
              <div>4. Response → Parent</div>
            </div>
          </div>
        </div>

        {/* Main: Chat */}
        <div className="lg:col-span-3 flex flex-col h-[calc(100vh-140px)]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 border border-white/10 rounded-t-lg bg-white/5">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-white/30 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-2xl">F</div>
                <div className="text-center">
                  <div className="text-sm text-white/60 mb-1">Chat with child proxy</div>
                  <div className="text-xs text-white/30">Prompts route through the parent to the child machine</div>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-accent/20 border border-accent/30'
                    : 'bg-white/10 border border-white/10'
                }`}>
                  {msg.role === 'assistant' && msg.childId && (
                    <div className="text-[10px] text-white/40 mb-2 font-mono">
                      via {msg.childId} {msg.latency ? `(${msg.latency}ms)` : ''}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{msg.content || (streaming && i === messages.length - 1 ? <span className="text-white/30 animate-pulse">thinking...</span> : '')}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border border-white/10 border-t-0 rounded-b-lg p-4 bg-white/5">
            <div className="flex items-center gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={!selectedChild ? 'Select a child proxy first...' : 'Type a message...'}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent/50 transition-colors"
                disabled={streaming || !selectedChild}
              />
              <button
                onClick={send}
                disabled={!input.trim() || streaming || !selectedChild}
                className="w-10 h-10 rounded-lg bg-accent/20 border border-accent/30 text-accent flex items-center justify-center hover:bg-accent/30 transition-colors disabled:opacity-30"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-4 mt-2 text-[10px] text-white/30">
              <span>{selectedChild ? 'Connected to child proxy' : 'No child proxy selected'}</span>
              <span>Session: {sessionId.slice(0, 16)}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
