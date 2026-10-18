import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarDays, Check, X } from 'lucide-react';
import { useAssistant } from './Assistant';
import { LeadForm } from './LeadForm';

const seenKey = 'moki-demo-seen';
const savedKey = 'moki-demo-requested';
const DemoContext = createContext({ openDemo: () => {}, markRequested: () => {} });
export const useDemoRequest = () => useContext(DemoContext);

export function DemoRequestProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { open: assistantOpen, setOpen: setAssistantOpen } = useAssistant();
  const location = useLocation();
  const dialog = useRef<HTMLDialogElement>(null);
  const seen = useRef(false), requested = useRef(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const state = useRef({ path: location.pathname, assistantOpen });
  state.current = { path: location.pathname, assistantOpen };
  const markSeen = useCallback(() => { seen.current = true; try { sessionStorage.setItem(seenKey, '1'); } catch { /* In-memory fallback still prevents repeats. */ } }, []);
  const openDemo = useCallback(() => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setAssistantOpen(false); markSeen(); setOpen(true);
  }, [setAssistantOpen, markSeen]);
  useEffect(() => {
    try { seen.current = sessionStorage.getItem(seenKey) === '1'; requested.current = sessionStorage.getItem(savedKey) === '1'; } catch { /* Storage may be disabled. */ }
    let timer: ReturnType<typeof setTimeout>;
    const attempt = () => {
      try { requested.current ||= sessionStorage.getItem(savedKey) === '1'; } catch { /* Use in-memory state if storage is unavailable. */ }
      if (seen.current || requested.current) return;
      const active = document.activeElement;
      const busy = state.current.assistantOpen || ['/contact', '/privacy', '/type-study'].includes(state.current.path) || document.visibilityState !== 'visible' || document.querySelector('dialog[open], .site-header.menu-open') || active?.matches('input, textarea, select, [contenteditable="true"]');
      if (busy) { timer = setTimeout(attempt, 1000); return; }
      openDemo();
    };
    timer = setTimeout(attempt, 8000);
    return () => clearTimeout(timer);
  }, [openDemo]);
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    const el = dialog.current;
    if (!open) { if (el?.open) el.close(); return; }
    if (!el?.open) el?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  const markRequested = useCallback(() => { requested.current = true; try { sessionStorage.setItem(savedKey, '1'); } catch { /* No personal data is persisted in browser storage. */ } }, []);
  return <DemoContext.Provider value={{ openDemo, markRequested }}>{children}
    <dialog ref={dialog} className="demo-dialog" aria-labelledby="demo-title" aria-describedby="demo-description" onCancel={() => setOpen(false)} onClose={() => { setOpen(false); if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true }); }} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setOpen(false); } }}>
      {open && <><button className="demo-close" aria-label="Close demo request" autoFocus onClick={() => setOpen(false)}><X size={21} /></button><div className="demo-shell"><div className="demo-heading"><span className="demo-kicker"><CalendarDays size={16} />A FREE FIRST CONVERSATION</span><h2 id="demo-title">Your business.<br /><span>Its next possibility.</span></h2><p id="demo-description">See what AI and automation could do for your business. Request a demo with the MOKI team.</p><div className="demo-benefits"><span><Check size={14} />Built around your goals</span><span><Check size={14} />No obligation</span></div></div><LeadForm source="demo-popup" onSaved={markRequested} /></div></>}
    </dialog>
  </DemoContext.Provider>;
}
