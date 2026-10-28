import { useCallback, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { Search, Send, MessageCircle, RefreshCw, CircleUserRound } from 'lucide-react';
import { API_BASE, getConversations, getMessages, sendMessage } from '../lib/whatsappApi';

export default function Inbox() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const refreshConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data.conversations || []);
      setActiveId(current => current || data.conversations?.[0]?.waId || '');
      setError('');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const refreshMessages = useCallback(async (waId) => {
    if (!waId) { setMessages([]); return; }
    try {
      const data = await getMessages(waId);
      setMessages(data.messages || []);
    } catch (err) { setError(err.message); }
  }, []);

  useEffect(() => { refreshConversations(); }, [refreshConversations]);
  useEffect(() => { refreshMessages(activeId); }, [activeId, refreshMessages]);

  useEffect(() => {
    const socket = io(API_BASE, { transports: ['websocket', 'polling'] });
    socket.on('message:new', (message) => {
      refreshConversations();
      if (message.waId === activeId) refreshMessages(activeId);
    });
    socket.on('message:status', () => refreshMessages(activeId));
    return () => socket.disconnect();
  }, [activeId, refreshConversations, refreshMessages]);

  const filtered = useMemo(() => conversations.filter(c => {
    const term = search.toLowerCase();
    return (c.contactName || '').toLowerCase().includes(term) || String(c.waId).includes(term) || (c.lastMessage || '').toLowerCase().includes(term);
  }), [conversations, search]);
  const activeConversation = conversations.find(c => c.waId === activeId);

  async function handleSend(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!activeId || !text || sending) return;
    setSending(true); setError('');
    try {
      await sendMessage(activeId, text);
      setDraft('');
      await Promise.all([refreshMessages(activeId), refreshConversations()]);
    } catch (err) { setError(err.message); }
    finally { setSending(false); }
  }

  const formatTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <section className="h-[calc(100vh-72px)] min-h-[520px] p-3 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold text-slate-800">Inbox</h1><p className="mt-1 text-sm text-slate-500">Manage customer conversations from WhatsApp.</p></div>
        <button onClick={() => { refreshConversations(); refreshMessages(activeId); }} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"><RefreshCw size={15}/> Refresh</button>
      </div>
      {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="grid h-[calc(100%-82px)] min-h-[400px] grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:grid-cols-[290px_minmax(0,1fr)]">
        <aside className={`${activeId ? 'hidden md:flex' : 'flex'} min-h-0 flex-col border-r border-slate-200`}>
          <div className="border-b border-slate-100 p-3"><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations" className="w-full rounded-lg bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none ring-1 ring-transparent focus:ring-emerald-300"/></div></div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? <p className="p-5 text-sm text-slate-500">Loading conversations…</p> : filtered.length === 0 ? <div className="px-5 py-10 text-center"><MessageCircle size={26} className="mx-auto mb-2 text-slate-300"/><p className="text-sm font-medium text-slate-600">No conversations yet</p><p className="mt-1 text-xs leading-5 text-slate-400">Once your Meta webhook is configured, incoming WhatsApp chats will appear here.</p></div> : filtered.map(c => (
              <button key={c.waId} onClick={() => setActiveId(c.waId)} className={`flex w-full gap-3 border-b border-slate-50 p-3 text-left hover:bg-slate-50 ${activeId === c.waId ? 'bg-emerald-50/70' : ''}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CircleUserRound size={20}/></span>
                <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold text-slate-800">{c.contactName || c.waId}</span><span className="shrink-0 text-[10px] text-slate-400">{formatTime(c.lastMessageAt)}</span></span><span className="mt-1 block truncate text-xs text-slate-500">{c.lastMessage || `[${c.lastMessageType || 'message'}]`}</span><span className="mt-1 block truncate text-[10px] text-slate-400">+{c.waId}</span></span>
              </button>
            ))}
          </div>
        </aside>
        <div className={`${activeId ? 'flex' : 'hidden md:flex'} min-h-0 flex-col bg-[#f8fafc]`}>
          {activeId ? <>
            <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3"><button className="text-sm text-emerald-700 md:hidden" onClick={() => setActiveId('')}>← Chats</button><span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CircleUserRound size={19}/></span><div><p className="text-sm font-semibold text-slate-800">{activeConversation?.contactName || activeId}</p><p className="text-xs text-slate-500">+{activeId}</p></div></header>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 sm:p-6">
              {messages.length === 0 ? <div className="m-auto max-w-xs text-center text-sm text-slate-400">No messages in this conversation yet.</div> : messages.map((m, i) => <div key={m._id || m.waMessageId || i} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[82%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[70%] ${m.direction === 'outbound' ? 'rounded-br-sm bg-emerald-100 text-slate-800' : 'rounded-bl-sm border border-slate-100 bg-white text-slate-800'}`}><p className="whitespace-pre-wrap break-words text-sm">{m.text || `[${m.type}]`}</p><div className="mt-1 flex justify-end gap-2 text-[10px] text-slate-400"><span>{formatTime(m.timestamp)}</span>{m.direction === 'outbound' && <span>{m.status || 'sent'}</span>}</div></div></div>)}
            </div>
            <form onSubmit={handleSend} className="border-t border-slate-200 bg-white p-3 sm:p-4"><div className="flex items-end gap-2"><textarea value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }} rows={1} maxLength={4096} placeholder="Type a WhatsApp message…" className="max-h-28 min-h-11 flex-1 resize-y rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-400"/><button disabled={!draft.trim() || sending} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"><Send size={16}/><span className="hidden sm:inline">{sending ? 'Sending…' : 'Send'}</span></button></div><p className="mt-2 text-[11px] text-slate-400">WhatsApp messaging rules apply. Outside the 24-hour customer-service window, use an approved template.</p></form>
          </> : <div className="m-auto px-6 text-center"><MessageCircle size={40} className="mx-auto mb-3 text-slate-300"/><h2 className="font-semibold text-slate-700">Your WhatsApp inbox</h2><p className="mt-1 text-sm text-slate-400">Choose a conversation to view messages and reply.</p></div>}
        </div>
      </div>
    </section>
  );
}
