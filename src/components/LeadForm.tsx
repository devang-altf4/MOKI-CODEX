import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, CheckCircle2, Copy, LoaderCircle, ShieldCheck } from 'lucide-react';
import { EMAIL, services } from '../content';

type Fields = { name: string; email: string; company: string; challenge: string; service: string; website: string };

export function LeadForm({ source, initialService = '', initialChallenge = '', onSaved }: {
  source: 'demo-popup' | 'contact-page'; initialService?: string; initialChallenge?: string; onSaved?: () => void;
}) {
  const id = useId();
  const { pathname } = useLocation();
  const [fields, setFields] = useState<Fields>({ name: '', email: '', company: '', challenge: initialChallenge, service: services.some(s => s.id === initialService) ? initialService : '', website: '' });
  const [busy, setBusy] = useState(false), [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState(''), [error, setError] = useState(''), [copied, setCopied] = useState(false);
  const requestId = useRef('');
  const pending = useRef<AbortController | null>(null);
  const result = useRef<HTMLDivElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { pending.current?.abort(); clearTimeout(copyTimer.current); }, []);
  useEffect(() => {
    if (draft && !busy) {
      result.current?.scrollIntoView({ behavior: 'instant', block: 'nearest' });
      result.current?.focus({ preventScroll: true });
    }
  }, [draft, busy]);
  const update = (key: keyof Fields, value: string) => {
    setFields(previous => ({ ...previous, [key]: value }));
    requestId.current = ''; setSaved(false); setDraft(''); setError(''); setCopied(false);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending.current || saved) return;
    if (fields.website || !fields.name.trim() || !fields.company.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()) || fields.challenge.trim().length < 15) {
      setError('Add your name, a valid email, business name, and at least 15 characters about your challenge.'); return;
    }
    const service = services.find(s => s.id === fields.service)?.name || 'Help finding the right starting point';
    const emailDraft = `Hello MOKI team,\n\nI’d like to arrange a free discovery call.\n\nName: ${fields.name.trim()}\nWork email: ${fields.email.trim()}\nBusiness: ${fields.company.trim()}\nInterested in: ${service}\n\nOur challenge:\n${fields.challenge.trim()}\n\nPlease let me know a good time to connect.\n\nThank you,\n${fields.name.trim()}`;
    setError(''); setBusy(true); setDraft('');
    const controller = new AbortController(); pending.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 25_000);
    try {
      // Retain the same ID on retry, including a lost response after a successful save.
      requestId.current ||= crypto.randomUUID();
      const response = await fetch('/api/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ ...fields, source, page: pathname, requestId: requestId.current }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.saved !== true) throw Error(typeof data?.error === 'string' ? data.error : 'Your request could not be saved. Please retry, or use the email draft below.');
      setSaved(true);
      onSaved?.();
    } catch (failure) {
      if (pending.current !== controller) return;
      setError(controller.signal.aborted ? 'The save could not be confirmed. Please retry, or use the email draft below.' : failure instanceof Error && failure.name === 'Error' ? failure.message : 'Your request could not be saved. Check your connection and retry, or use the email draft below.');
    } finally {
      window.clearTimeout(timeout);
      if (pending.current === controller) { pending.current = null; setBusy(false); setDraft(emailDraft); }
    }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(draft); setCopied(true); clearTimeout(copyTimer.current); copyTimer.current = setTimeout(() => setCopied(false), 2500); }
    catch { setError('Copy isn’t available here. You can select and copy the email text below.'); }
  };
  return <div className="lead-form-wrap">
    <form onSubmit={submit} className="contact-form lead-form" aria-label={source === 'demo-popup' ? 'Request a demo' : 'Request a discovery call'} aria-busy={busy}>
      <fieldset disabled={busy || saved}>
        <div className="form-two"><div><label htmlFor={`${id}-name`}>Your name <span>*</span></label><input id={`${id}-name`} name="name" autoComplete="name" value={fields.name} onChange={e => update('name', e.target.value)} placeholder="Alex Taylor" required maxLength={120} /></div><div><label htmlFor={`${id}-email`}>Work email <span>*</span></label><input id={`${id}-email`} name="email" type="email" autoComplete="email" value={fields.email} onChange={e => update('email', e.target.value)} placeholder="alex@yourbusiness.com" required maxLength={254} /></div></div>
        <div><label htmlFor={`${id}-company`}>Business name <span>*</span></label><input id={`${id}-company`} name="organization" autoComplete="organization" value={fields.company} onChange={e => update('company', e.target.value)} placeholder="Your business" required maxLength={160} /></div>
        <div><label htmlFor={`${id}-service`}>What are you curious about?</label><select id={`${id}-service`} value={fields.service} onChange={e => update('service', e.target.value)}><option value="">Help me find the right starting point</option>{services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div><label htmlFor={`${id}-challenge`}>What could work better? <span>*</span></label><textarea id={`${id}-challenge`} value={fields.challenge} onChange={e => update('challenge', e.target.value)} rows={3} minLength={15} maxLength={4000} placeholder="Tell us about a process, a challenge, or an idea…" required /></div>
        <div className="honeypot" aria-hidden="true"><label htmlFor={`${id}-website`}>Leave this blank</label><input id={`${id}-website`} name="company_website" value={fields.website} onChange={e => update('website', e.target.value)} tabIndex={-1} autoComplete="off" /></div>
      </fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!saved && <button type="submit" className="button button-primary form-submit" disabled={busy}>{busy ? <><LoaderCircle className="lead-spinner" size={18} /><span>Saving your request…</span></> : <><span>{draft ? 'Retry saving request' : source === 'demo-popup' ? 'Request my free demo' : 'Request my discovery call'}</span></>}</button>}
      {!saved && <p className="form-privacy"><ShieldCheck size={14} /><span>Submitting saves your details so MOKI can contact you about this request. No meeting is booked automatically. <Link to="/privacy">Privacy information</Link></span></p>}
    </form>
    {draft && <div className={`email-preview lead-result ${saved ? 'lead-saved' : ''}`} ref={result} tabIndex={-1} role="region" aria-label="Your demo request and email draft">
      {saved && <><div className="email-preview-heading"><CheckCircle2 size={22} /><h3>Your request is saved.</h3></div><p>MOKI can follow up using your details. Your call hasn’t been booked yet. You can also send the email draft below.</p></>}
      {!saved && <><h3>Your email draft is ready.</h3><p>Your database save hasn’t been confirmed. You can retry above or send this email yourself.</p></>}
      <details><summary>Review your email draft</summary><pre>{draft}</pre></details>
      <div className="lead-email-actions"><a className="button button-primary" href={`mailto:${EMAIL}?subject=${encodeURIComponent(`Discovery call — ${fields.company.trim()}`)}&body=${encodeURIComponent(draft)}`}>Open email app</a><button type="button" className="copy-button" onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy enquiry'}</button></div>
      <p className="lead-email-note">Opening a draft does not send an email. You choose whether to send it.</p><span className="copy-status" role="status">{copied ? 'Enquiry copied to clipboard.' : ''}</span>
    </div>}
  </div>;
}
