import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowUp, Plus, RotateCcw, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CALENDLY_URL, services } from '../content';
import { Button, Eyebrow } from './Primitives';
import { ConciergeWidget } from './Concierge';
import '../assistant.css';

gsap.registerPlugin(ScrollTrigger);
type Message = { role: 'user' | 'assistant'; text: string; service?: string };
const welcome: Message = { role: 'assistant', text: 'Hey, I’m Moki’s AI guide. Tell me what’s slowing your business down. We can find a useful place to start, together.' };
type AssistantState = { messages: Message[]; busy: boolean; error: string; send: (text: string) => Promise<boolean>; clear: () => void; open: boolean; setOpen: (open: boolean) => void };
const AssistantContext = createContext<AssistantState | null>(null);
export const useAssistant = () => useContext(AssistantContext)!;

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);
  const clear = useCallback(() => { pending.current?.abort(); pending.current = null; setMessages([welcome]); setBusy(false); setError(''); }, []);
  const send = async (text: string) => {
    if (pending.current || !text.trim()) return false;
    const controller = new AbortController(); pending.current = controller;
    const previous = messages;
    const next: Message[] = [...messages, { role: 'user', text: text.trim().slice(0, 1800) }];
    setMessages(next); setBusy(true); setError('');
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next.slice(1).slice(-11).map(({ role, text }) => ({ role, text })) }), signal: controller.signal });
      const result = await response.json();
      if (!response.ok || typeof result.reply !== 'string') throw Error(result.error || 'The guide is unavailable right now. Please try again.');
      if (pending.current !== controller) return false;
      setMessages([...next, { role: 'assistant', text: result.reply, service: result.service }]);
      return true;
    } catch (failure) {
      if (pending.current === controller && !controller.signal.aborted) { setMessages(previous); setError(failure instanceof Error ? failure.message : 'The connection was interrupted. Please try again.'); }
      return false;
    } finally { if (pending.current === controller) { pending.current = null; setBusy(false); } }
  };
  return <AssistantContext.Provider value={{ messages, busy, error, send, clear, open, setOpen }}>{children}</AssistantContext.Provider>;
}

const prompts = [
  ['Less admin', 'We spend too much time on repetitive admin. Where could automation help?'],
  ['Better follow-ups', 'New leads get lost in our inbox. How could Moki help us follow up?'],
  ['A better website', 'We need a better website and more visibility on Google. Can Moki help?'],
];

export function AssistantPanel({ compact = false, active = true }: { compact?: boolean; active?: boolean }) {
  const { messages, busy, error, send, clear } = useAssistant();
  const [draft, setDraft] = useState('');
  const log = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => { if (active && log.current) log.current.scrollTop = log.current.scrollHeight; }, [messages, busy, error, active]);
  const submit = async (event: FormEvent) => { event.preventDefault(); if (await send(draft)) setDraft(''); };
  return <div className={`assistant-panel ${compact ? 'assistant-compact' : ''}`}>
    <div className="assistant-topbar"><span className="assistant-avatar"><Sparkles size={20} strokeWidth={1.5} /></span><div><strong>Moki AI</strong><span>Your business, understood.</span></div><span className="assistant-powered"><span className="status-dot" />GEMINI</span><button className="assistant-reset" onClick={() => { clear(); setDraft(''); }} aria-label="Start a new AI conversation"><RotateCcw size={15} /></button></div>
    <div className="assistant-messages" ref={log} role="log" aria-label="Conversation with Moki AI" aria-live="polite" aria-relevant="additions text" aria-busy={busy}>{messages.map((message, i) => {
      const service = services.find(service => service.id === message.service);
      return <article className={`assistant-message message-${message.role}`} key={i}><span className="message-author">{message.role === 'assistant' ? 'MOKI' : 'YOU'}</span><p>{message.text}</p>{service && <Link className="assistant-service" to={`/solutions#${service.id}`}>{service.name}</Link>}</article>;
    })}{busy && <div className="assistant-thinking" role="status"><span /><span /><span /><p>Thinking about your business…</p></div>}{error && <div className="assistant-error" role="alert"><p>{error}</p><Link to="/contact">Talk to the Moki team </Link></div>}</div>
    {messages.length === 1 && !busy && <div className="assistant-prompts" aria-label="Conversation starters">{prompts.map(([label, prompt]) => <button key={label} onClick={() => { setDraft(prompt); }}><Plus size={12} />{label}</button>)}</div>}
    <form className="assistant-compose" onSubmit={submit}><label className="sr-only" htmlFor={id}>Your message to Moki AI</label><textarea id={id} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Tell us what could work better…" rows={2} maxLength={1800} disabled={busy} required /><button type="submit" disabled={busy || !draft.trim()} aria-label="Send message to Moki AI"><ArrowUp size={21} /></button></form>
    <div className="assistant-note"><span>AI guidance, with your business in mind.</span><p>Messages are sent to Google Gemini. Please leave out private customer details. <Link to="/privacy">Privacy</Link></p></div>
  </div>;
}

export function ConversationSection() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add({ motion: '(prefers-reduced-motion: no-preference)', compact: '(max-width: 700px)' }, context => {
      if (!context.conditions?.motion) return;
      const small = Boolean(context.conditions?.compact);
      const q = gsap.utils.selector(root);
      const timeline = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: root.current, start: 'top 90%', end: 'top 12%', scrub: .65 } });
      timeline.fromTo(q('.conversation-copy h2 > span'), { x: small ? -20 : -100, y: small ? 25 : 80, rotate: small ? -2 : -5 }, { x: 0, y: 0, rotate: 0, stagger: .15, duration: 1 }, 0)
        .fromTo(q('.conversation-console'), { y: small ? 40 : 160, rotateY: small ? -4 : -18, rotateX: small ? 3 : 12, scale: small ? .97 : .84, transformPerspective: 1400 }, { y: 0, rotateY: 0, rotateX: 0, scale: 1, duration: 1.2 }, 0)
        .fromTo(q('.conversation-orbit'), { rotation: -65, scale: .5 }, { rotation: 35, scale: 1, duration: 1.2 }, 0);
      gsap.to(q('.conversation-watermark'), { xPercent: -20, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: .7 } });
    }, root);
    return () => mm.revert();
  }, []);
  return <section className="conversation-section" id="experience" ref={root}><div className="conversation-watermark" aria-hidden="true">LET’S TALK.</div><div className="conversation-orbit" aria-hidden="true"><i /><i /><span>✳</span></div><div className="container conversation-layout"><div className="conversation-copy"><Eyebrow>LESS GUESSING. MORE POSSIBILITIES.</Eyebrow><h2><span>YOUR NEXT</span><span>MOVE STARTS</span><span>with a hello.</span></h2><p>No perfect brief needed. Tell our AI guide what’s slowing you down. Find the possibilities, then talk them through with our team.</p><div className="conversation-human"><span className="status-dot" /><span>AI TO EXPLORE.<br /><strong>REAL PEOPLE TO BUILD IT.</strong></span><Button to={CALENDLY_URL}>Book a discovery call</Button></div></div><div className="conversation-console"><AssistantPanel /></div></div></section>;
}

export function AssistantWidget() {
  const { open, setOpen } = useAssistant();
  return <ConciergeWidget open={open} onOpenChange={setOpen}>{active => open && <AssistantPanel compact active={active} />}</ConciergeWidget>;
}
