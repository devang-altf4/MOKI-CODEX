import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, ChevronRight, Home, Mail, MessageCircle, Mic, MicOff, Pause, PhoneOff, Play, Sparkles, UsersRound, Video, VideoOff, X } from 'lucide-react';
import { EMAIL } from '../content';
import Logo from './Logo';

const welcomeFilm = '/videos/concierge/moki-welcome.mp4';
const welcomePoster = '/images/concierge/moki-welcome.webp';

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

type View = 'welcome' | 'ai' | 'team' | 'call';
type CallState = 'idle' | 'connecting' | 'preview' | 'ended';

function DemoCall({ active, onBack }: { active: boolean; onBack: () => void }) {
  const [state, setState] = useState<CallState>('idle');
  const [muted, setMuted] = useState(true), [camera, setCamera] = useState(false);
  const start = () => { setMuted(true); setCamera(false); setState('connecting'); };
  useEffect(() => {
    if (state !== 'connecting') return;
    const timer = window.setTimeout(() => setState('preview'), 1800);
    return () => window.clearTimeout(timer);
  }, [state]);
  return <div className="concierge-call">
    <button className="concierge-back" onClick={onBack}><ArrowLeft size={15} />Back to welcome</button>
    <div className="concierge-call-heading"><h3>Meet, right here.</h3><span className="concierge-demo-tag">DEMO</span></div>
    <p className="concierge-call-disclosure">Try the call experience. No one is called, and your camera and microphone stay off.</p>
    <div className={`concierge-call-screen call-${state}`}>
      <WelcomeMedia active={active && state === 'preview'} />
      <span className="concierge-call-label">{state === 'preview' ? 'SAMPLE CALL · PRERECORDED GREETING' : 'CALL EXPERIENCE PREVIEW'}</span>
      {state === 'idle' && <div className="concierge-call-overlay"><span className="concierge-call-symbol"><Video size={27} /></span><h4>A face behind the hello.</h4><button className="concierge-primary" onClick={start}><Play size={15} fill="currentColor" />Start demo call</button></div>}
      {state === 'connecting' && <div className="concierge-call-overlay" role="status"><span className="concierge-connecting" /><h4>Opening your demo…</h4><p>This is a simulated connection.</p></div>}
      {state === 'preview' && <><div className="concierge-sample-guest">{camera ? <UsersRound size={22} /> : <VideoOff size={22} />}<span>{camera ? 'Sample preview' : 'Camera off'}</span></div><div className="concierge-call-name"><strong>MOKI</strong><span>Demo host</span></div></>}
      {state === 'ended' && <div className="concierge-call-overlay" role="status"><span className="concierge-call-symbol"><Check size={26} /></span><h4>That’s the experience.</h4><p>The real conversation starts with your business.</p><button className="concierge-secondary" onClick={() => setState('idle')}>Replay demo</button></div>}
    </div>
    {(state === 'connecting' || state === 'preview') && <div className="concierge-call-controls">
      <button aria-label="Toggle demo microphone" aria-pressed={!muted} disabled={state === 'connecting'} onClick={() => setMuted(!muted)}>{muted ? <MicOff size={19} /> : <Mic size={19} />}<span>{muted ? 'Muted' : 'Demo mic'}</span></button>
      <button className="concierge-end-call" aria-label="End demo call" onClick={() => setState('ended')}><PhoneOff size={20} /><span>End demo</span></button>
      <button aria-label="Toggle demo camera" aria-pressed={camera} disabled={state === 'connecting'} onClick={() => setCamera(!camera)}>{camera ? <Video size={19} /> : <VideoOff size={19} />}<span>{camera ? 'Sample on' : 'Camera off'}</span></button>
    </div>}
    {(state === 'idle' || state === 'ended') && <Link className="concierge-primary" to="/contact"><CalendarDays size={17} />Book a discovery call<ArrowUpRight size={17} /></Link>}
    <p className="concierge-fine-print">Demo controls change this preview only. Live team calls are not connected yet.</p>
  </div>;
}

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
        <span className="concierge-launcher-eyebrow">MOKI</span><span className="concierge-launcher-caption"><MessageCircle size={15} />Let’s talk<ChevronRight size={15} /></span>
      </button>
      {!minimized && <button className="concierge-minimize" aria-label="Minimize video greeting" onClick={() => setMinimized(true)}><X size={12} /></button>}
    </div>
    <dialog className="assistant-dialog concierge-dialog" ref={dialog} aria-label="Moki chat and contact" onCancel={() => onOpenChange(false)} onClose={() => { onOpenChange(false); if (openedAt.current === location.pathname + location.hash) window.requestAnimationFrame(() => launcher.current?.focus({ preventScroll: true })); }} onClick={event => { if (event.target === event.currentTarget) onOpenChange(false); }}>
      {open && <div className={`concierge-shell view-${view}`}>
        <header className="concierge-header"><Logo /><button className="concierge-close" aria-label="Close Moki chat and contact" onClick={() => onOpenChange(false)}><X size={20} /></button></header>
        {view !== 'call' && <nav className="concierge-tabs" aria-label="Moki contact options">{([['welcome', Home, 'Welcome'], ['ai', Sparkles, 'AI chat'], ['team', UsersRound, 'Our team']] as const).map(([key, Icon, label]) => <button key={key} aria-pressed={view === key} aria-controls={`concierge-${key}`} onClick={() => setView(key)}><Icon size={16} />{label}</button>)}</nav>}
        <div className="concierge-body" ref={body}>
          <div id="concierge-welcome" className="concierge-view" hidden={view !== 'welcome'}>
            <div className="concierge-welcome-film"><WelcomeMedia active={view === 'welcome'} paused={videoPaused} /><span className="concierge-film-tag">WELCOME VIDEO</span><div className="concierge-film-copy"><h3>Big ideas.<br />Start here.</h3><span>Welcome to MOKI.</span></div><button className="concierge-video-toggle" aria-label={videoPaused ? 'Play greeting' : 'Pause greeting'} onClick={() => setVideoPaused(!videoPaused)}>{videoPaused ? <Play size={15} /> : <Pause size={15} />}</button></div>
            <div className="concierge-welcome-copy"><h3>What’s on your mind?</h3><p>A question, an idea, or a process that could work better. Let’s find your next step.</p></div>
            <div className="concierge-choices"><button className="concierge-choice" onClick={() => setView('ai')}><span className="concierge-choice-icon"><Sparkles size={20} /></span><span><strong>Ask MOKI AI</strong><small>Explore ideas for your business</small></span><ArrowUpRight size={18} /></button><button className="concierge-choice" onClick={() => setView('team')}><span className="concierge-choice-icon"><UsersRound size={20} /></span><span><strong>Talk to our team</strong><small>Let’s turn an idea into a plan</small></span><ArrowUpRight size={18} /></button></div>
            <button className="concierge-demo-link" onClick={() => setView('call')}><Video size={16} /><span>Try the call experience</span><span className="concierge-demo-tag">DEMO</span><ChevronRight size={15} /></button>
          </div>
          <div id="concierge-ai" className="concierge-view concierge-ai" hidden={view !== 'ai'}>{children(view === 'ai')}</div>
          <div id="concierge-team" className="concierge-view concierge-team" hidden={view !== 'team'}>
            <span className="concierge-team-symbol"><UsersRound size={30} strokeWidth={1.3} /></span><span className="concierge-kicker">PEOPLE BEHIND THE POSSIBILITIES</span><h3>Your business.<br />Let’s talk about it.</h3><p>Tell us what you’re working on. We’ll explore where AI, automation, or a better website could help.</p>
            <Link className="concierge-primary" to="/contact"><CalendarDays size={18} />Book a discovery call<ArrowUpRight size={17} /></Link><a className="concierge-email" href={`mailto:${EMAIL}`}><Mail size={17} /><span>{EMAIL}</span><ArrowUpRight size={15} /></a>
            <div className="concierge-availability"><span className="concierge-availability-dot" /><div><strong>Discovery calls by appointment</strong><p>South Florida · Working worldwide</p></div></div>
            <div className="concierge-team-demo"><div><Video size={19} /><strong>A more personal hello.</strong></div><p>Live calls aren’t connected yet. Take a look at how an on-page conversation could feel.</p><button className="concierge-secondary" onClick={() => setView('call')}>Try demo call<ChevronRight size={15} /></button></div>
          </div>
          {view === 'call' && <DemoCall active={open} onBack={() => setView('welcome')} />}
        </div>
        <footer className="concierge-footer"><span><span className="concierge-footer-dot" />MOKI SYSTEMS</span><span>Smarter systems. Simpler business.</span></footer>
      </div>}
    </dialog>
  </>;
}
