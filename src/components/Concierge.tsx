import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, Home, Mail, MessageCircle, Pause, Play, Sparkles, UsersRound, X } from 'lucide-react';
import { EMAIL } from '../content';
import Logo from './Logo';

const welcomeFilm = '/videos/concierge/moki-welcome-woman.mp4';
const welcomePoster = '/images/concierge/moki-welcome-woman.webp';

function WelcomeMedia({ active, paused = false }: { active: boolean; paused?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      if (active && !paused && !motion.matches && document.visibilityState === 'visible') void el.play().catch(() => {});
      else el.pause();
    };
    update();
    motion.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    return () => { el.pause(); motion.removeEventListener('change', update); document.removeEventListener('visibilitychange', update); };
  }, [active, paused, failed]);
  return <div className={`concierge-media ${ready && !failed ? 'has-film' : ''} ${active && !paused ? 'media-active' : ''}`} aria-hidden="true">
    <div className="concierge-brand-scene"><i /><i /><div className="concierge-sculpture"><Logo wordmark={false} /></div><span className="concierge-scene-dot" /><span className="concierge-scene-dot dot-two" /></div>
    {!failed && <><img className="concierge-poster" src={welcomePoster} alt="" onLoad={() => setReady(true)} /><video ref={video} src={welcomeFilm} poster={welcomePoster} muted playsInline loop preload="metadata" onLoadedData={() => setReady(true)} onError={() => setFailed(true)} /></>}
  </div>;
}

type View = 'welcome' | 'ai' | 'team';

export function ConciergeWidget({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: (active: boolean) => ReactNode }) {
  const [view, setView] = useState<View>('welcome');
  const [minimized, setMinimized] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const openedAt = useRef('');
  const location = useLocation();
  useEffect(() => { if (minimized) launcher.current?.focus({ preventScroll: true }); }, [minimized]);
  useEffect(() => { if (body.current) body.current.scrollTop = 0; }, [view]);
  useEffect(() => { onOpenChange(false); }, [location.pathname, location.hash, onOpenChange]);
  useEffect(() => {
    if (!open) {
      if (dialog.current?.open) dialog.current.close();
      return;
    }
    openedAt.current = location.pathname + location.hash;
    setView('welcome');
    setVideoPaused(false);
    if (!dialog.current?.open) dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  return <>
    <div className={`concierge-dock ${open ? 'dock-hidden' : ''} ${minimized ? 'dock-compact' : ''}`}>
      <button ref={launcher} className="assistant-launcher concierge-launcher" aria-label="Open Moki chat and contact" aria-haspopup="dialog" aria-expanded={open} onClick={() => onOpenChange(true)}>
        <WelcomeMedia active={!open} />
        <span className="concierge-launcher-eyebrow">MOKI</span><span className="concierge-launcher-caption"><MessageCircle size={15} />Let’s talk</span>
      </button>
      {!minimized && <button className="concierge-minimize" aria-label="Minimize video greeting" onClick={() => setMinimized(true)}><X size={12} /></button>}
    </div>
    <dialog className="assistant-dialog concierge-dialog" ref={dialog} aria-label="Moki chat and contact" onCancel={() => onOpenChange(false)} onClose={() => { onOpenChange(false); if (openedAt.current === location.pathname + location.hash) window.requestAnimationFrame(() => launcher.current?.focus({ preventScroll: true })); }} onClick={event => { if (event.target === event.currentTarget) onOpenChange(false); }}>
      {open && <div className={`concierge-shell view-${view}`}>
        <header className="concierge-header"><Logo /><button className="concierge-close" aria-label="Close Moki chat and contact" onClick={() => onOpenChange(false)}><X size={20} /></button></header>
        <nav className="concierge-tabs" aria-label="Moki contact options">{([['welcome', Home, 'Welcome'], ['ai', Sparkles, 'AI chat'], ['team', UsersRound, 'Our team']] as const).map(([key, Icon, label]) => <button key={key} aria-pressed={view === key} aria-controls={`concierge-${key}`} onClick={() => setView(key)}><Icon size={16} />{label}</button>)}</nav>
        <div className="concierge-body" ref={body}>
          <div id="concierge-welcome" className="concierge-view" hidden={view !== 'welcome'}>
            <div className="concierge-welcome-film"><WelcomeMedia active={view === 'welcome'} paused={videoPaused} /><span className="concierge-film-tag">WELCOME VIDEO</span><div className="concierge-film-copy"><h3>Big ideas.<br />Start here.</h3><span>Welcome to MOKI.</span></div><button className="concierge-video-toggle" aria-label={videoPaused ? 'Play greeting' : 'Pause greeting'} onClick={() => setVideoPaused(!videoPaused)}>{videoPaused ? <Play size={15} /> : <Pause size={15} />}</button></div>
            <div className="concierge-welcome-copy"><h3>What’s on your mind?</h3><p>A question, an idea, or a process that could work better. Let’s find your next step.</p></div>
            <div className="concierge-choices"><button className="concierge-choice" onClick={() => setView('ai')}><span className="concierge-choice-icon"><Sparkles size={20} /></span><span><strong>Ask MOKI AI</strong><small>Explore ideas for your business</small></span></button><button className="concierge-choice" onClick={() => setView('team')}><span className="concierge-choice-icon"><UsersRound size={20} /></span><span><strong>Talk to our team</strong><small>Let’s turn an idea into a plan</small></span></button></div>
          </div>
          <div id="concierge-ai" className="concierge-view concierge-ai" hidden={view !== 'ai'}>{children(view === 'ai')}</div>
          <div id="concierge-team" className="concierge-view concierge-team" hidden={view !== 'team'}>
            <span className="concierge-team-symbol"><UsersRound size={30} strokeWidth={1.3} /></span><span className="concierge-kicker">PEOPLE BEHIND THE POSSIBILITIES</span><h3>Your business.<br />Let’s talk about it.</h3><p>Tell us what you’re working on. We’ll explore where AI, automation, or a better website could help.</p>
            <Link className="concierge-primary" to="/contact"><CalendarDays size={18} />Book a discovery call</Link><a className="concierge-email" href={`mailto:${EMAIL}`}><Mail size={17} /><span>{EMAIL}</span></a>
            <div className="concierge-availability"><span className="concierge-availability-dot" /><div><strong>Discovery calls by appointment</strong><p>South Florida · Working worldwide</p></div></div>
          </div>
        </div>
        <footer className="concierge-footer"><span><span className="concierge-footer-dot" />MOKI SYSTEMS</span><span>Smarter systems. Simpler business.</span></footer>
      </div>}
    </dialog>
  </>;
}
