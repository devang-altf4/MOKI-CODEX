import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, BrainCircuit, BriefcaseBusiness, Building2, CalendarDays, Check, CheckCircle2, ChevronRight, Copy, Factory, Globe2, Layers3, Mail, MapPin, Menu, MessageSquare, Search, ShieldCheck, Sparkles, UsersRound, Workflow, Wrench, X, ChartNoAxesCombined, PanelTop, Megaphone, Rocket } from 'lucide-react';
import gsap from 'gsap';
import { challenges, EMAIL, faqs, framework, industries, services } from './content';
import Logo from './components/Logo';
import { ThemeToggle } from './components/Theme';
import { Accordion, ArrowLink, Button, Eyebrow, Reveal } from './components/Primitives';
import Framework from './components/Framework';
import { AssistantProvider, AssistantWidget, ConversationSection } from './components/Assistant';
import SolutionExplorer from './components/SolutionExplorer';
import TypeStudy from './components/TypeStudy';
import { KineticStatement, MotionPage, useHeroScroll, useContactMotion } from './components/ScrollMotion';
import { CinematicIntro, MotionBlock, type PageScene } from './components/CinematicPages';

const serviceIcons = [BrainCircuit, Workflow, MessageSquare, ChartNoAxesCombined, UsersRound, Megaphone, Layers3, PanelTop, Search];
const industryIcons = [Building2, BriefcaseBusiness, Factory, Megaphone, Wrench, Rocket];
const links = [['/solutions', 'Solutions'], ['/how-it-works', 'Our method'], ['/industries', 'Industries'], ['/about', 'About']] as const;

function RouteEffects() {
  const { pathname, hash, search } = useLocation();
  useEffect(() => {
    const titles: Record<string, string> = { '/': 'Less busywork. More business.', '/solutions': 'AI, automation & digital solutions', '/how-it-works': 'The MOKI method', '/industries': 'Built around your industry', '/about': 'Business first. Technology second.', '/contact': 'Let’s make work flow', '/privacy': 'Privacy', '/type-study': 'Typography directions' };
    const type = new URLSearchParams(search).get('type');
    if (type && ['a', 'b', 'c'].includes(type)) document.documentElement.dataset.type = type;
    document.title = `Moki Systems — ${titles[pathname] || 'Page not found'}`;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (hash) {
      const timer = setTimeout(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' }), 100);
      return () => clearTimeout(timer);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash, search]);
  return null;
}

function Navigation() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); }, [location.pathname, location.hash]);
  useEffect(() => { if (!open) return; const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = previous; }; }, [open]);
  useEffect(() => { const update = () => setScrolled(window.scrollY > 20); update(); window.addEventListener('scroll', update, { passive: true }); return () => window.removeEventListener('scroll', update); }, []);
  useEffect(() => { if (!open) return; const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); menuButton.current?.focus(); } }; document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key); }, [open]);
  return <header className={`site-header ${scrolled ? 'header-scrolled' : ''} ${open ? 'menu-open' : ''}`}>
    <div className="nav-inner container">
      <Link to="/" aria-label="Moki Systems home" className="home-link" onClick={() => { if (location.pathname === '/' && !location.hash) window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}); }}><Logo /></Link>
      <nav className="desktop-nav" aria-label="Main navigation">{links.map(([to, name]) => <NavLink to={to} key={to}>{name}</NavLink>)}</nav>
      <div className="nav-actions"><ThemeToggle /><Button className="nav-cta" to="/contact">Let’s talk</Button><button ref={menuButton} className="menu-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div>
    </div>
    <nav className="mobile-nav" id="mobile-nav" hidden={!open} aria-label="Mobile navigation">{links.map(([to, name], i) => <NavLink to={to} key={to}><span className="mono">0{i + 1}</span>{name}<ArrowUpRight /></NavLink>)}<Link to="/contact"><span className="mono">05</span>Start a conversation<ArrowUpRight /></Link><p>Smarter Systems. Simpler Business.</p></nav>
  </header>;
}

function CinematicFilm() {
  const video = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const el = video.current; if (!el) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true;
    const update = () => { if (visible && !query.matches && document.visibilityState === 'visible') void el.play().catch(() => {}); else el.pause(); };
    const observer = new IntersectionObserver(([e]) => { visible = e.isIntersecting; update(); }); observer.observe(el);
    query.addEventListener('change', update); document.addEventListener('visibilitychange', update); update();
    return () => { observer.disconnect(); query.removeEventListener('change', update); document.removeEventListener('visibilitychange', update); el.pause(); };
  }, []);
  return <div className={`cinematic-scene ${loaded ? 'film-loaded' : ''}`}><img src="/images/moki-system.webp" alt="A sculptural blue Moki mark surrounded by connected business tools" fetchPriority="high" /><video ref={video} src="/videos/moki-system-loop.mp4" poster="/images/moki-system.webp" muted playsInline loop preload="metadata" onLoadedData={() => setLoaded(true)} onError={() => setLoaded(false)} aria-hidden="true" /></div>;
}

function Hero() {
  const hero = useRef<HTMLElement>(null);
  useHeroScroll(hero);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const context = gsap.context(() => {
      gsap.fromTo('.hero-title > span', { y: 24, opacity: .78 }, { y: 0, opacity: 1, stagger: .08, duration: .7, ease: 'power3.out' });
      gsap.fromTo('.hero-after', { y: 10, opacity: .85 }, { y: 0, opacity: 1, duration: .55, stagger: .04, delay: .08, ease: 'power2.out' });
    }, hero);
    return () => context.revert();
  }, []);
  return <section className="hero-scroll-track" ref={hero}><div className="hero hero-pin">
    <div className="hero-grid" aria-hidden="true" />
    <div className="hero-halo" aria-hidden="true" /><div className="hero-orbit-word" aria-hidden="true">CONNECTED</div>
    <div className="container hero-layout">
      <div className="hero-copy">
        <div className="hero-eyebrow hero-after"><span className="status-dot" />AI & AUTOMATION. BUILT AROUND YOU.</div>
        <h1 className="hero-title"><span>Less busywork.</span><span>More <em>business.</em></span></h1>
        <p className="hero-description hero-after">We put AI to work, automate the repetitive,<br className="desktop-break" /> and connect your tools. So your business<br className="desktop-break" /> moves forward, together.</p>
        <div className="hero-actions hero-after"><Button to="/contact">Book a free discovery call</Button></div>
      </div>
      <div className="hero-art">
        <CinematicFilm />
      </div>
    </div>
    <div className="hero-next container"><span className="mono">YOUR TOOLS. YOUR TEAM. YOUR NEXT CHAPTER.</span><h2>One connected<br /><em>business.</em></h2><p>From scattered tasks to a system that moves with you.</p></div>
    <div className="container hero-bottom hero-interface"><span>AI · AUTOMATION · WEBSITES & SEO</span><span><Globe2 size={12} />SOUTH FLORIDA → EVERYWHERE</span></div>
    <div className="hero-scroll-progress" aria-hidden="true"><span className="hero-scroll-fill" /></div>
  </div></section>;
}

function IndustryOverview() {
  return <section className="industry-overview section-space"><div className="container"><Reveal className="section-heading"><div><Eyebrow>Your world is our starting point</Eyebrow><h2>Different businesses.<br />Same <span className="serif-word">possibility.</span></h2></div><div className="section-heading-aside"><p>Your industry has its own rhythm.<br />Your systems should move with it.</p><ArrowLink to="/industries">Find your industry</ArrowLink></div></Reveal><div className="industry-index">{industries.map((industry, i) => { const Icon = industryIcons[i]; return <Reveal key={industry.name} delay={(i % 3) * 75}><Link to={`/industries#industry-${i}`} className="industry-index-item"><span className="mono">0{i + 1}</span><Icon size={28} strokeWidth={1.25} /><h3>{industry.name}</h3><ArrowUpRight size={20} /></Link></Reveal>; })}</div><div className="industry-note"><span>BUILT AROUND HOW YOU WORK.</span><span>Never a one-size-fits-all approach.</span></div></div></section>;
}

function FaqSection() {
  return <section className="faq-section section-space"><div className="container faq-layout"><Reveal><Eyebrow>A LITTLE CLARITY</Eyebrow><h2>Good questions.<br /><span className="text-muted">Straight answers.</span></h2><p className="faq-intro">Curious is a good place to start.</p><ArrowLink to="/contact">Let’s talk it through</ArrowLink></Reveal><Reveal delay={100}><Accordion items={faqs} /></Reveal></div></section>;
}

function ClosingCta() {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = video.current; if (!el) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const update = () => { if (visible && !query.matches && document.visibilityState === 'visible') void el.play().catch(() => {}); else el.pause(); };
    const observer = new IntersectionObserver(([e]) => { visible = e.isIntersecting; update(); }); observer.observe(el);
    query.addEventListener('change', update); document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); query.removeEventListener('change', update); document.removeEventListener('visibilitychange', update); el.pause(); };
  }, []);
  return <section className="closing-cta"><div className="cta-grid" aria-hidden="true" /><video ref={video} className="cta-video" src="/videos/moki-loop.mp4" poster="/images/moki-core.webp" muted loop playsInline preload="none" aria-hidden="true" /><div className="container closing-layout"><Reveal><Eyebrow light>YOUR NEXT CHAPTER</Eyebrow><h2>Less holding it together.<br />More moving <span className="serif-word">forward.</span></h2><p>Let’s find what a smarter system could do for your business.</p><Button to="/contact" variant="light">Book a free discovery call</Button><span className="cta-note">A real conversation. A practical first step.</span></Reveal></div></section>;
}

function Footer() {
  return <footer className="site-footer"><div className="container"><div className="footer-main"><div className="footer-brand"><Link to="/" aria-label="Moki Systems home"><Logo /></Link><p>Smarter Systems.<br />Simpler Business.</p></div><div className="footer-links"><p className="mono">EXPLORE</p>{links.map(([to, name]) => <Link to={to} key={to}>{name}</Link>)}</div><div className="footer-contact"><p className="mono">A GOOD PLACE TO START</p><a href={`mailto:${EMAIL}`}>{EMAIL}<ArrowUpRight size={15} /></a><span>South Florida, USA<br />Connected worldwide.</span><Link to="/contact" className="button button-primary footer-call">Let’s make work flow<ArrowRight size={16} /></Link></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Moki Systems LLC</span><span>BUSINESS FIRST. TECHNOLOGY WITH PURPOSE.</span><Link to="/privacy">Privacy</Link><button aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}><ArrowUp size={15} /></button></div><div className="footer-word" aria-hidden="true">moki<span>®</span></div></div></footer>;
}

function Home() {
  return <MotionPage><Hero /><Framework /><KineticStatement /><SolutionExplorer /><ConversationSection /><IndustryOverview /><FaqSection /><ClosingCta /></MotionPage>;
}

function PageIntro({ scene, eyebrow, title, accent, description }: { scene?: PageScene; eyebrow: string; title: string; accent: string; description: string }) {
  if (scene) return <CinematicIntro scene={scene} eyebrow={eyebrow} title={title} accent={accent} description={description} />;
  return <section className="page-intro"><div className="container"><Eyebrow>{eyebrow}</Eyebrow><h1>{title}<br /><span className="text-blue">{accent}</span></h1><div className="page-intro-bottom"><p>{description}</p><span className="page-symbol" aria-hidden="true">✳</span></div></div></section>;
}

function SolutionsPage() {
  const [filter, setFilter] = useState('All solutions');
  const [searchParams] = useSearchParams();
  useEffect(() => { if (searchParams.has('all')) setFilter('All solutions'); }, [searchParams]);
  return <><PageIntro scene="solutions" eyebrow="PRACTICAL TECHNOLOGY. PURPOSEFUL RESULTS." title="The right solution." accent="For your kind of business." description="Nine ways to make your business work better. We help you choose where to start, then build the connections that make it count." />
    <section id="solutions-content" className="service-directory section-space"><div className="container"><div className="service-filter" role="group" aria-label="Filter solutions">{['All solutions', 'Intelligence', 'Automation', 'Growth'].map(f => <button key={f} aria-pressed={filter === f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}{f === 'All solutions' && <span>09</span>}</button>)}</div><div className="service-list">{services.filter(s => filter === 'All solutions' || s.group === filter).map(service => { const i = services.findIndex(s => s.id === service.id); const Icon = serviceIcons[i]; return <MotionBlock key={service.id}><article className="service-row" id={service.id}><div className="service-index mono">{String(i + 1).padStart(2, '0')}</div><div className="service-name"><div className="service-icon"><Icon size={25} strokeWidth={1.4} /></div><span className="mono">{service.group.toUpperCase()}</span><h2>{service.name}</h2><p>{service.short}</p></div><div className="service-details"><p>{service.description}</p><ul>{service.examples.map(e => <li key={e}><Check size={13} />{e}</li>)}</ul><ArrowLink to={`/contact?service=${service.id}`}>Let’s explore this</ArrowLink></div></article></MotionBlock>; })}</div><div className="custom-note"><Sparkles size={24} /><div><h3>Not sure where to start?</h3><p>That’s what the discovery call is for. Tell us what’s slowing you down.</p></div><Button to="/contact" variant="outline">Find your starting point</Button></div></div></section><ClosingCta /></>;
}

function MethodPage() {
  return <><PageIntro scene="method" eyebrow="BUSINESS FIRST. ALWAYS." title="A thoughtful method." accent="A connected business." description="We don’t start with a piece of software. We start with you. Map, Optimize, Kit, Integrate — the four steps behind every Moki solution." /><div id="method-content"><Framework /></div><section className="method-promises section-space"><div className="container"><Eyebrow>THROUGH EVERY STEP</Eyebrow><div className="promise-grid">{[{ Icon: MessageSquare, title: 'Plain language.', body: 'Clear conversations about what your business needs and what the technology will do.' }, { Icon: Layers3, title: 'A practical fit.', body: 'Tools and workflows chosen around your existing systems, team, and goals.' }, { Icon: ShieldCheck, title: 'A long-term partner.', body: 'Implementation is a beginning. We can keep supporting and improving your systems.' }].map(({ Icon, title, body }) => <MotionBlock key={title}><Icon size={25} strokeWidth={1.3} /><h2>{title}</h2><p>{body}</p></MotionBlock>)}</div></div></section><ClosingCta /></>;
}

function IndustriesPage() {
  return <><PageIntro scene="industries" eyebrow="YOUR WORLD. UNDERSTOOD." title="Your business is specific." accent="Your technology should be, too." description="Different industries have different pressure points. We take time to understand yours, then build systems around the work you actually do." /><section id="industries-content" className="industry-directory"><div className="container">{industries.map((industry, i) => { const Icon = industryIcons[i]; return <MotionBlock key={industry.name}><article className="industry-detail" id={`industry-${i}`}><div className="industry-detail-copy"><span className="mono industry-detail-number">0{i + 1} / BUILT AROUND YOUR WORK</span><Icon size={35} strokeWidth={1.2} /><h2>{industry.full}</h2><p className="industry-problem">{industry.challenge}</p><p>{industry.outcome}</p><ArrowLink to={`/contact?industry=${i}`}>Let’s talk about your workflow</ArrowLink></div><div className="industry-example"><span className="mono">WHAT THIS COULD LOOK LIKE</span><div>{industry.workflow.map((node, n) => <div className="industry-flow-node" key={node}><span className="industry-flow-count">0{n + 1}</span><p>{node}</p>{n === 2 ? <CheckCircle2 size={17} /> : <ArrowDown size={17} />}</div>)}</div><p>{industry.services}</p><span className="industry-example-note">Illustrative workflow · designed for your actual systems</span></div></article></MotionBlock>; })}</div></section><ClosingCta /></>;
}

function AboutPage() {
  return <><PageIntro scene="about" eyebrow="HELLO. WE’RE MOKI SYSTEMS." title="Business first." accent="Technology with purpose." description="We believe growing businesses should be able to benefit from AI and automation without needing an enormous technology budget or a dedicated engineering department." /><section id="about-content" className="about-story section-space"><div className="container about-story-grid"><MotionBlock className="about-art"><div className="about-art-grid" /><img src="/images/moki-core.webp" alt="The blue Moki M, a symbol of connected systems" loading="lazy" /><span className="mono">SMARTER SYSTEMS. SIMPLER BUSINESS.</span></MotionBlock><MotionBlock className="about-copy"><Eyebrow>WHY WE EXIST</Eyebrow><h2>There’s a better way<br />to make work <span className="serif-word">work.</span></h2><p>Too many good businesses spend their day holding things together. Moving details between tools. Chasing updates. Repeating the same tasks.</p><p>Moki Systems exists to help change that. We bring business understanding, AI, automation, and data together to turn disconnected work into practical, connected systems.</p><p>Based in South Florida and working with businesses internationally, we aim to be the technology partner that understands your business before recommending a solution.</p><ArrowLink to="/how-it-works">Get to know our method</ArrowLink></MotionBlock></div></section><section className="about-beliefs section-space"><div className="container"><Eyebrow>WHAT GUIDES THE WORK</Eyebrow><div className="belief-list">{[['Understand first.', 'Your business is the starting point. We listen, ask questions, and look at how things really work.'], ['Make it useful.', 'Technology earns its place by helping your team do something better. We focus on practical improvements.'], ['Build together.', 'The best system is one your team understands and can use. We make the process clear and collaborative.'], ['Keep improving.', 'Your business keeps moving. We aim to be a partner who can keep moving with it.']].map(([title, body], i) => <MotionBlock key={title}><div className="belief"><span className="mono">0{i + 1}</span><h2>{title}</h2><p>{body}</p></div></MotionBlock>)}</div></div></section><ClosingCta /></>;
}

type ContactFields = { name: string; email: string; company: string; challenge: string; service: string; website: string };
function ContactPage() {
  const contactRoot = useContactMotion();
  const [params] = useSearchParams();
  const initialService = params.get('service') || challenges.find(c => c.id === params.get('challenge'))?.service || '';
  const industryIndex = params.get('industry');
  const selectedIndustry = industryIndex !== null ? industries[Number(industryIndex)] : undefined;
  const [fields, setFields] = useState<ContactFields>({ name: '', email: '', company: '', challenge: selectedIndustry ? `We work in ${selectedIndustry.full.toLowerCase()} and would like to explore how Moki could help.` : '', service: initialService, website: '' });
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const preview = useRef<HTMLDivElement>(null);
  useEffect(() => { if (draft) { preview.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' }); preview.current?.focus({ preventScroll: true }); } }, [draft]);
  const update = (key: keyof ContactFields, value: string) => { setFields(f => ({ ...f, [key]: value })); setDraft(''); setError(''); };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (fields.website) return;
    if (!fields.name.trim() || !fields.email.trim() || !fields.company.trim() || fields.challenge.trim().length < 15) { setError('Add your name, work email, business name, and a little more about your challenge (at least 15 characters).'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) { setError('Please enter a valid email address.'); return; }
    const serviceName = services.find(s => s.id === fields.service)?.name || 'I’d like help finding the right starting point';
    setDraft(`Hello Moki team,\n\nI’d like to arrange a free discovery call.\n\nName: ${fields.name.trim()}\nWork email: ${fields.email.trim()}\nBusiness: ${fields.company.trim()}\nInterested in: ${serviceName}\n\nOur challenge:\n${fields.challenge.trim()}\n\nPlease let me know a good time to connect.\n\nThank you,\n${fields.name.trim()}`);
  };
  const copy = async () => { try { await navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { setError('Copy isn’t available here. You can select and copy the email text below.'); } };
  return <section className="contact-page" ref={contactRoot}><div className="contact-orbit" aria-hidden="true" /><div className="container contact-layout"><div className="contact-copy"><Eyebrow>LET’S FIND YOUR STARTING POINT</Eyebrow><h1>A better system<br />starts with a<br /><span className="text-blue">conversation.</span></h1><p>Tell us a little about your business and what’s getting in the way. We’ll explore a practical next step together.</p><div className="contact-expect"><span className="mono">YOUR FREE DISCOVERY CALL</span><div><Check size={15} />Talk through how your business works.</div><div><Check size={15} />Explore where AI or automation could help.</div><div><Check size={15} />Find a sensible place to start.</div></div><div className="contact-info"><a href={`mailto:${EMAIL}`}><Mail size={17} /><span>{EMAIL}</span><ArrowUpRight size={15} /></a><p><MapPin size={17} /><span>South Florida, USA<br /><small>Working with businesses worldwide.</small></span></p></div></div><div className="contact-form-wrap"><div className="contact-form-header"><span className="status-dot" /><span>LET’S MAKE WORK FLOW.</span><span className="mono">01 / HELLO</span></div><h2>Tell us what’s on your mind.</h2><p className="form-intro">We’ll arrange your discovery call by email.</p><form onSubmit={submit} className="contact-form"><div className="form-two"><div><label htmlFor="contact-name">Your name <span>*</span></label><input id="contact-name" name="name" autoComplete="name" value={fields.name} onChange={e => update('name', e.target.value)} placeholder="Alex Taylor" required maxLength={120} /></div><div><label htmlFor="contact-email">Work email <span>*</span></label><input id="contact-email" name="email" type="email" autoComplete="email" value={fields.email} onChange={e => update('email', e.target.value)} placeholder="alex@yourbusiness.com" required maxLength={254} /></div></div><div><label htmlFor="contact-company">Business name <span>*</span></label><input id="contact-company" name="organization" autoComplete="organization" value={fields.company} onChange={e => update('company', e.target.value)} placeholder="Your business" required maxLength={160} /></div><div><label htmlFor="contact-service">What are you curious about?</label><select id="contact-service" value={fields.service} onChange={e => update('service', e.target.value)}><option value="">Help me find the right starting point</option>{services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div><label htmlFor="contact-challenge">What could work better? <span>*</span></label><textarea id="contact-challenge" value={fields.challenge} onChange={e => update('challenge', e.target.value)} rows={4} minLength={15} maxLength={4000} placeholder="The repetitive tasks, the disconnected tools, the idea you want to explore…" required /></div><div className="honeypot" aria-hidden="true"><label htmlFor="company-website">Leave this blank</label><input id="company-website" name="company_website" value={fields.website} onChange={e => update('website', e.target.value)} tabIndex={-1} autoComplete="off" /></div>{error && <p className="form-error" role="alert">{error}</p>}<button type="submit" className="button button-primary form-submit"><span>Prepare my consultation email</span><ArrowUpRight size={18} /></button><p className="form-privacy"><ShieldCheck size={13} />Your details stay in this page until you send the email.<br /><Link to="/privacy">Read our privacy information</Link></p></form>{draft && <div className="email-preview" ref={preview} tabIndex={-1} role="region" aria-label="Your consultation email draft"><div className="email-preview-heading"><CheckCircle2 size={20} /><h3>Your email draft is ready.</h3></div><p>Review it below, then open your email app to send it to Moki. Nothing has been sent or booked yet.</p><pre>{draft}</pre><div><a className="button button-primary" href={`mailto:${EMAIL}?subject=${encodeURIComponent(`Discovery call — ${fields.company.trim()}`)}&body=${encodeURIComponent(draft)}`}><span>Open email app</span><ArrowUpRight size={15} /></a><button type="button" className="copy-button" onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied' : 'Copy enquiry'}</button></div><span className="copy-status" role="status">{copied ? 'Enquiry copied to clipboard.' : ''}</span></div>}</div></div></section>;
}

function PrivacyPage() {
  return <><PageIntro eyebrow="CLEAR AND SIMPLE" title="Your information." accent="Your choice." description="How this Moki Systems website preview handles information." /><section className="legal-copy section-space"><div className="container"><p className="mono">WEBSITE PREVIEW · OCTOBER 2026</p><h2>Contacting Moki</h2><p>The consultation form prepares an email draft in your browser. It does not send your details to a server, a CRM, or a booking calendar. When you choose “Open email app,” your device’s email application receives the draft. You decide whether to send it. Your email provider’s own privacy terms apply to that service.</p><h2>Moki AI guide</h2><p>When you send a chat message, your message and the recent conversation are sent through the Moki server to Google Gemini to generate a reply. The website does not save chat transcripts or form entries to a database or browser storage. Please avoid sharing private customer information, passwords, or sensitive records. Google processes messages under the terms and data settings of the configured Gemini account. AI replies may be imperfect; confirm project details with the Moki team.</p><h2>Analytics, cookies, and storage</h2><p>This preview does not include advertising trackers, analytics scripts, marketing cookies, or a customer account system. Your light or dark appearance preference is saved in this browser so the site can remember your choice. Form entries and chat messages are not saved to browser storage. Temporary request counts are kept on the server to limit abuse; these do not include message contents. Your hosting provider may process ordinary connection information to serve the site.</p><h2>Before a public launch</h2><p>Any future booking, email delivery, CRM, analytics, or content integrations will need their own configuration and an updated privacy notice. This page describes the current preview, not a future production service.</p><h2>Questions</h2><p>Contact Moki Systems LLC at <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.</p></div></section></>;
}

function NotFound() {
  return <section className="not-found container"><span className="mono">404 / A LITTLE DISCONNECTED</span><h1>Let’s get you<br /><span className="text-blue">back in flow.</span></h1><p>We couldn’t find that page.</p><Button to="/">Back to Moki</Button></section>;
}

export default function App() {
  return <AssistantProvider><a href="#main-content" className="skip-link">Skip to content</a><RouteEffects /><Navigation /><main id="main-content" tabIndex={-1}><Routes><Route path="/" element={<Home />} /><Route path="/solutions" element={<SolutionsPage />} /><Route path="/how-it-works" element={<MethodPage />} /><Route path="/industries" element={<IndustriesPage />} /><Route path="/about" element={<AboutPage />} /><Route path="/contact" element={<ContactPage />} /><Route path="/privacy" element={<PrivacyPage />} /><Route path="/type-study" element={<TypeStudy />} /><Route path="*" element={<NotFound />} /></Routes></main><Footer /><AssistantWidget /></AssistantProvider>;
}
