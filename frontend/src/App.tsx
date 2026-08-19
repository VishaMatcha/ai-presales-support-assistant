import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Bot, Check, CheckCircle2, Clipboard, Database, ExternalLink, LifeBuoy, LoaderCircle, LockKeyhole, MessageSquareText, Route, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { io, type Socket } from 'socket.io-client';
import type { ChatMessage, ChatResponse } from './types';

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:4000';
const quickPrompts = ['I want to transfer example.com', 'How do I reset my password?', 'What payment methods can I use?'];

function getSessionId() {
  const key = 'northstar-assistant-session';
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
}

export function App() {
  const sessionId = useMemo(getSessionId, []);
  const socketRef = useRef<Socket | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [connected, setConnected] = useState(false);
  const [working, setWorking] = useState(false);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome', role: 'assistant',
    message: 'Hi — I’m Northstar. I can guide a domain transfer one step at a time, or answer support questions from our local knowledge base. What can I help with?',
  }]);

  useEffect(() => {
    const socket = io(backendUrl, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('chat:status', ({ working: value }: { working: boolean }) => setWorking(value));
    socket.on('chat:response', (response: ChatResponse) => {
      setMessages((current) => [...current, { ...response, id: crypto.randomUUID(), role: 'assistant' }]);
    });
    socket.on('chat:error', ({ message }: { message: string }) => {
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', message: `Something went wrong: ${message}` }]);
      setWorking(false);
    });
    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages, working]);

  const send = (text = draft) => {
    const message = text.trim();
    if (!message || working || !socketRef.current) return;
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', message }]);
    socketRef.current.emit('chat:message', { sessionId, message });
    setDraft('');
  };

  const latest = [...messages].reverse().find((message) => message.role === 'assistant' && message.mode);
  const structured = [...messages].reverse().find((message) => message.structuredSummary)?.structuredSummary;
  const copyJson = async (value: Record<string, string | boolean>) => {
    await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Sparkles size={19} /></div><div><strong>Northstar</strong><span>Local AI service desk</span></div></div>
        <div className={`connection ${connected ? 'online' : ''}`}><span />{connected ? 'Local stack online' : 'Connecting…'}</div>
      </header>

      <section className="workspace">
        <aside className="context-panel">
          <div className="eyebrow">One assistant, two jobs</div>
          <h1>From first question<br />to ready handoff.</h1>
          <p className="lede">A local-first demo for guided pre-sales discovery and grounded customer support.</p>
          <div className="capability-list">
            <Capability icon={<Route size={18} />} title="Guided intake" text="Plain-language domain transfer checklist" active={latest?.mode === 'intake'} />
            <Capability icon={<Database size={18} />} title="Support RAG" text="Answers grounded in Bitext matches" active={latest?.mode === 'support'} />
          </div>
          <div className="privacy-note"><ShieldCheck size={18} /><div><strong>Runs on your machine</strong><span>Ollama + Qdrant. No paid API keys.</span></div></div>
          {latest?.intake && <div className="progress-card"><div><span>Transfer readiness</span><strong>{latest.intake.progress}%</strong></div><div className="progress-track"><i style={{ width: `${latest.intake.progress}%` }} /></div><small>{latest.intake.collected.length} of 7 details collected</small></div>}
        </aside>

        <section className="chat-panel">
          <div className="chat-heading"><div><MessageSquareText size={20} /><div><strong>Assistant</strong><span>Session {sessionId.slice(0, 8)}</span></div></div><div className="model-pill"><Bot size={15} /> llama3.1</div></div>
          <div className="messages" aria-live="polite">
            {messages.map((item) => <Message key={item.id} item={item} onCopy={copyJson} copied={copied} />)}
            {working && <div className="message-row assistant"><div className="avatar"><Bot size={16} /></div><div className="bubble typing"><LoaderCircle size={16} className="spinner" /> Thinking locally…</div></div>}
            <div ref={endRef} />
          </div>
          {messages.length === 1 && <div className="quick-prompts">{quickPrompts.map((prompt) => <button key={prompt} onClick={() => send(prompt)}>{prompt}<ArrowUp size={14} /></button>)}</div>}
          <div className="composer-wrap">
            <div className="composer"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="Ask a support question or start a domain transfer…" rows={1} /><button aria-label="Send message" disabled={!draft.trim() || working || !connected} onClick={() => send()}><ArrowUp size={19} /></button></div>
            <p><LockKeyhole size={12} /> Authorization codes stay in this in-memory demo session.</p>
          </div>
        </section>
      </section>
      {structured && <div className="completion-toast"><CheckCircle2 size={18} /><span>Engineering-ready transfer brief created</span></div>}
    </main>
  );
}

function Capability({ icon, title, text, active }: { icon: React.ReactNode; title: string; text: string; active: boolean }) {
  return <div className={`capability ${active ? 'active' : ''}`}><div>{icon}</div><span><strong>{title}</strong><small>{text}</small></span>{active && <i>Active</i>}</div>;
}

function Message({ item, onCopy, copied }: { item: ChatMessage; onCopy: (value: Record<string, string | boolean>) => void; copied: boolean }) {
  return <div className={`message-row ${item.role}`}>
    <div className="avatar">{item.role === 'assistant' ? <Bot size={16} /> : <UserRound size={16} />}</div>
    <div className="message-stack">
      <div className="message-meta"><span>{item.role === 'assistant' ? 'Northstar' : 'You'}</span>{item.mode && <b className={item.mode}><span />{item.mode === 'intake' ? 'Guided intake' : 'Support RAG'}</b>}</div>
      <div className="bubble">{item.message.split('\n').map((line, index) => <span key={`${item.id}-${index}`}>{line || <br />}</span>)}</div>
      {item.matches && item.matches.length > 0 && <details className="sources"><summary><Database size={14} /> {item.matches.length} knowledge-base matches <ExternalLink size={13} /></summary><div>{item.matches.map((match) => <article key={String(match.id)}><div><span>{match.category ?? 'Support'}</span><b>{Math.round(match.score * 100)}% match</b></div><strong>{match.instruction}</strong><p>{match.response}</p></article>)}</div></details>}
      {item.structuredSummary && <div className="json-card"><div><span><CheckCircle2 size={16} /> Provisioning brief</span><button onClick={() => onCopy(item.structuredSummary!)}>{copied ? <Check size={14} /> : <Clipboard size={14} />}{copied ? 'Copied' : 'Copy JSON'}</button></div><pre>{JSON.stringify(item.structuredSummary, null, 2)}</pre></div>}
    </div>
  </div>;
}
