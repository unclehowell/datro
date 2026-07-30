import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Plus, Trash2, ChevronLeft, ChevronRight, Send, Maximize2, Minimize2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  source?: string;
  breadcrumb?: string;
  videoUrl?: string;
  audioUrl?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'fcuk_conversations';

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveConversations(convs: Conversation[]) {
  try {
    const toSave = convs.map(c => ({
      ...c,
      messages: c.messages.slice(-100),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {}
}

function genId(): string {
  return 'chat_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatModal({ isOpen, onClose }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeId, setActiveId] = useState<string>(() => genId());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pipeline, setPipeline] = useState('');
  const [fullscreen, setFullscreen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const activeConv = conversations.find(c => c.id === activeId);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const persist = useCallback((convs: Conversation[]) => {
    saveConversations(convs);
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setConversations(prev => {
        const existing = prev.find(c => c.id === activeId);
        if (!existing && messages.length === 0) return prev;
        const updated = existing
          ? prev.map(c => c.id === activeId ? { ...c, messages, updatedAt: Date.now(), title: c.title || messages.find(m => m.role === 'user')?.content?.slice(0, 50) || 'New Conversation' } : c)
          : [...prev, { id: activeId, title: messages.find(m => m.role === 'user')?.content?.slice(0, 50) || 'New Conversation', messages, createdAt: Date.now(), updatedAt: Date.now() }];
        persist(updated);
        return updated;
      });
    }, 1000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [messages, activeId, persist]);

  const switchConversation = (id: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setConversations(prev => {
      const existing = prev.find(c => c.id === activeId);
      const updated = existing
        ? prev.map(c => c.id === activeId ? { ...c, messages, updatedAt: Date.now() } : c)
        : [...prev, { id: activeId, title: messages.find(m => m.role === 'user')?.content?.slice(0, 50) || 'New Conversation', messages, createdAt: Date.now(), updatedAt: Date.now() }];
      persist(updated);
      return updated;
    });
    const next = conversations.find(c => c.id === id);
    setActiveId(id);
    setMessages(next?.messages || []);
    setPipeline('');
  };

  const newConversation = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setConversations(prev => {
      const existing = prev.find(c => c.id === activeId);
      const updated = existing
        ? prev.map(c => c.id === activeId ? { ...c, messages, updatedAt: Date.now() } : c)
        : [...prev, { id: activeId, title: messages.find(m => m.role === 'user')?.content?.slice(0, 50) || 'New Conversation', messages, createdAt: Date.now(), updatedAt: Date.now() }];
      persist(updated);
      return updated;
    });
    setActiveId(genId());
    setMessages([]);
    setPipeline('');
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      persist(updated);
      return updated;
    });
    if (id === activeId) {
      const remaining = conversations.filter(c => c.id !== id);
      if (remaining.length > 0) {
        const next = remaining[remaining.length - 1];
        setActiveId(next.id);
        setMessages(next.messages);
      } else {
        setActiveId(genId());
        setMessages([]);
      }
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);

    setConversations(prev => {
      const existing = prev.find(c => c.id === activeId);
      const title = existing?.title || text.slice(0, 50);
      const updated = existing
        ? prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, userMsg], title, updatedAt: Date.now() } : c)
        : [...prev, { id: activeId, title, messages: [userMsg], createdAt: Date.now(), updatedAt: Date.now() }];
      persist(updated);
      return updated;
    });

    try {
      const chatPromise = fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, chat_only: true, action: 'chat' }),
      }).then(r => r.json());

      const chatData = await chatPromise;
      const reply = chatData.reply || chatData.error || 'No response';
      const source = chatData._proxy?.routing || '';
      const breadcrumb = chatData._breadcrumb || chatData._proxy?.child_breadcrumb || '';
      const videoUrl = chatData.videoUrl || undefined;

      let audioUrl: string | undefined;
      if (reply && !chatData.error) {
        try {
          const ttsResp = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: reply, voice: 'am_michael' }),
          });
          const ttsData = await ttsResp.json();
          audioUrl = ttsData.audio;
        } catch {}
      }

      const assistantMsg: Message = { role: 'assistant', content: reply, source, breadcrumb, videoUrl, audioUrl };
      setMessages(prev => [...prev, assistantMsg]);
      if (breadcrumb) setPipeline(breadcrumb);
      else if (chatData._proxy?.routing_decision) setPipeline(chatData._proxy.routing_decision);

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play().catch(() => {});
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Unable to reach parent proxy.' }]);
    } finally {
      setSending(false);
    }
  };

  const sidebarConversations = conversations.filter(c => c.messages.length > 0).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={fullscreen ? "fixed inset-0 z-[1000] flex" : "fixed bottom-6 right-6 z-[1000] flex shadow-2xl overflow-hidden"}
          style={{ background: '#09090b', color: '#d0c8b8', fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: '14px', ...(fullscreen ? {} : { width: '900px', height: '600px', borderRadius: '12px', border: '1px solid #27272a' }) }}
        >
          {/* Sidebar */}
          <div
            style={{
              width: sidebarOpen ? '280px' : '0px',
              minWidth: sidebarOpen ? '280px' : '0px',
              overflow: 'hidden',
              borderRight: sidebarOpen ? '1px solid #27272a' : 'none',
              background: '#18181b',
              display: 'flex',
              flexDirection: 'column',
              transition: 'width 0.2s, min-width 0.2s, border 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #27272a' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>History</span>
              <button onClick={newConversation} style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 600 }}>
                <Plus size={14} /> New
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
              {sidebarConversations.length === 0 && (
                <div style={{ textAlign: 'center', color: '#52525b', padding: '24px 16px', fontSize: '12px' }}>
                  No past conversations
                </div>
              )}
              {sidebarConversations.map(c => (
                <div
                  key={c.id}
                  onClick={() => switchConversation(c.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    background: c.id === activeId ? '#27272a' : 'transparent',
                    borderLeft: c.id === activeId ? '3px solid #f59e0b' : '3px solid transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (c.id !== activeId) e.currentTarget.style.background = '#1f1f22'; }}
                  onMouseLeave={e => { if (c.id !== activeId) e.currentTarget.style.background = 'transparent'; }}
                >
                  <MessageSquare size={14} style={{ color: '#52525b', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: '#d0c8b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: c.id === activeId ? 600 : 400 }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: '10px', color: '#52525b' }}>
                      {c.messages.length} msgs
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(c.id, e)}
                    style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: '2px', opacity: 0, transition: 'opacity 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Main chat area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderBottom: '1px solid #27272a', background: '#18181b', flexShrink: 0 }}>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
              <h1 style={{ fontSize: '14px', fontWeight: 600, color: '#f59e0b', letterSpacing: '0.5px', margin: 0 }}>AgentOS</h1>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: '#09090b', border: '1px solid #27272a' }}>parent-proxy</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', fontSize: '11px', color: '#71717a' }}>
                <span>{messages.length > 0 ? 'online' : 'ready'}</span>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
              </div>
              <button onClick={() => setFullscreen(!fullscreen)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' }}>
                {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Pipeline breadcrumb */}
            {pipeline && (
              <div style={{ display: 'flex', gap: '4px', padding: '6px 14px', borderBottom: '1px solid #27272a', background: '#18181b', flexShrink: 0, flexWrap: 'wrap' }}>
                {pipeline.split(' → ').map((step, i, arr) => (
                  <span key={i} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#09090b', border: '1px solid ' + (i === arr.length - 1 ? '#f59e0b' : '#27272a'), color: i === arr.length - 1 ? '#f59e0b' : '#71717a' }}>
                    {step.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* Messages */}
            <div ref={messagesRef} style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#71717a', padding: '40px 20px', fontSize: '13px', lineHeight: 1.8 }}>
                  <div style={{ color: '#f59e0b', fontSize: '16px', marginBottom: '8px' }}>Finance Cheque UK</div>
                  <div>Parent proxy chat<br />Routes to child nodes via polling<br /><br />Type a message to begin.</div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} style={{
                  maxWidth: '85%', padding: '10px 14px', borderRadius: '12px', fontSize: '14px', lineHeight: 1.5, wordWrap: 'break-word' as const,
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user' ? '#f59e0b' : '#18181b',
                  color: msg.role === 'user' ? '#000' : '#d0c8b8',
                  border: msg.role === 'assistant' ? '1px solid #27272a' : 'none',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
                  borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '12px',
                }}>
                  {msg.videoUrl ? (
                    <video src={msg.videoUrl} controls autoPlay loop style={{ maxWidth: '100%', borderRadius: '8px' }} />
                  ) : msg.content}
                  {msg.breadcrumb && <div style={{ fontSize: '10px', color: '#71717a', marginTop: '4px', fontFamily: 'monospace' }}>{msg.breadcrumb}</div>}
                  {msg.source && !msg.breadcrumb && <div style={{ fontSize: '10px', color: '#71717a', marginTop: '4px' }}>{msg.source}</div>}
                </div>
              ))}
              {sending && (
                <div style={{ maxWidth: '85%', padding: '10px 14px', borderRadius: '12px', background: '#18181b', border: '1px solid #27272a', alignSelf: 'flex-start', borderBottomLeftRadius: '4px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#71717a', animation: `blink 1.4s infinite ${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input bar */}
            <div style={{ display: 'flex', gap: '8px', padding: '10px 14px', borderTop: '1px solid #27272a', background: '#18181b', flexShrink: 0 }}>
              <textarea
                rows={1}
                value={input}
                onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask anything..."
                style={{ flex: 1, background: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '10px 14px', color: '#d0c8b8', fontFamily: 'inherit', fontSize: '14px', resize: 'none', outline: 'none', maxHeight: '120px' }}
              />
              <button
                disabled={sending || !input.trim()}
                onClick={sendMessage}
                style={{ background: '#f59e0b', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: sending || !input.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Send <Send size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
