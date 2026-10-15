import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Check } from 'lucide-react';
import { framework } from '../content';
import { Eyebrow } from './Primitives';
import { createFrameSequence } from './frameSequence';

export default function Framework({ standalone = false }: { standalone?: boolean }) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(0);
  const requested = useRef(0);
  const paintRef = useRef<((index: number) => void) | null>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  const cinematic = !standalone;

  useEffect(() => {
    const root = section.current, surface = canvas.current;
    if (!root || !surface) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    let disposeRenderer = () => {};
    const initialize = () => {
      disposeRenderer();
      const minimal = query.matches;
      setReduced(minimal);
      const mobile = window.matchMedia('(max-width: 700px)').matches;
      const count = mobile ? 121 : 193;
      if (!minimal && !standalone) {
        const sequence = createFrameSequence({ root, canvas: surface, mobile, onChapter: chapter => {
          activeRef.current = chapter; setActive(chapter);
        } });
        const update = () => {
          const rect = root.getBoundingClientRect();
          sequence.setProgress(-rect.top / Math.max(1, root.offsetHeight - innerHeight));
        };
        paintRef.current = index => sequence.setProgress(index / (count - 1), false);
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
        disposeRenderer = () => { sequence.dispose(); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
      } else {
        let disposed = false;
        const images = new Map<number, HTMLImageElement>();
        const ctx = surface.getContext('2d');
        const paint = (index: number) => {
          requested.current = index;
          const image = images.get(index);
          if (!image || !ctx) return;
          const ratio = Math.max(surface.width / image.width, surface.height / image.height);
          ctx.clearRect(0, 0, surface.width, surface.height);
          ctx.drawImage(image, (surface.width - image.width * ratio) / 2, (surface.height - image.height * ratio) / 2, image.width * ratio, image.height * ratio);
        };
        const load = (index: number) => {
          const image = new Image();
          image.onload = () => { if (!disposed) { images.set(index, image); if (requested.current === index) paint(index); } };
          image.src = `/film/${mobile ? 'mobile' : 'desktop'}/${String(index).padStart(4, '0')}.webp`;
        };
        paintRef.current = index => { if (!images.has(index)) load(index); paint(index); };
        const resize = () => { surface.width = surface.clientWidth; surface.height = surface.clientHeight; paint(requested.current); };
        const observer = new ResizeObserver(resize); observer.observe(surface);
        requested.current = Math.round(((activeRef.current + 1) / 4) * (count - 1));
        load(requested.current); resize();
        disposeRenderer = () => { disposed = true; observer.disconnect(); images.clear(); };
      }
    };
    initialize();
    query.addEventListener('change', initialize);
    return () => { disposeRenderer(); query.removeEventListener('change', initialize); paintRef.current = null; };
  }, [standalone]);
  const selectChapter = (index: number) => {
    activeRef.current = index; setActive(index);
    const count = window.matchMedia('(max-width: 700px)').matches ? 121 : 193;
    if (standalone || reduced) { const p = Math.min(1, (index + 1) / 4); paintRef.current?.(Math.round(p * (count - 1))); setProgress((index + 1) * 25); return; }
    const root = section.current!;
    const top = root.getBoundingClientRect().top + window.scrollY;
    const duration = root.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + duration * ((index + .45) / 4), behavior: 'smooth' });
  };
  const item = framework[active];
  const headlines = [['MAP', 'the mess.'], ['LOSE', 'the friction.'], ['BUILD', 'the system.'], ['FIND', 'your flow.']];
  if (cinematic) return <section id="method" ref={section} className={`framework-section scroll-method ${reduced ? 'framework-reduced' : ''}`} aria-label="The MOKI framework">
    <div className="method-scene">
      <div className="method-grain" aria-hidden="true" />
      <picture className="method-poster" aria-hidden="true"><source media="(max-width: 700px)" srcSet="/film/mobile/0000.webp" /><img src="/film/desktop/0000.webp" alt="" /></picture>
      <canvas className="method-canvas" ref={canvas} role="img" aria-label={`3D illustration of the ${item.name} stage: scattered business tasks become one connected Moki system.`} />
      <div className="method-vignette" aria-hidden="true" />
      <div className="method-scene-top container"><Eyebrow>FROM DISCONNECTED TO IN SYNC</Eyebrow><span className="mono">THE MOKI METHOD / 0{active + 1}</span></div>
      <div className="method-scene-title container" key={`title-${active}`}><h2><span>{headlines[active][0]}</span><em>{headlines[active][1]}</em></h2></div>
      <div className="method-big-number" aria-hidden="true">0{active + 1}</div>
      <div className="method-scene-bottom container">
        <div className="method-scene-copy" key={`body-${active}`}><span className="mono">0{active + 1} — {item.name.toUpperCase()}</span><h3>{item.headline}</h3><p>{item.body}</p></div>
        <div className="method-scroll-cue"><span className="scroll-cue-line" /><ArrowDown size={18} /><span>YOU SCROLL.<br />IT COMES TOGETHER.</span></div>
      </div>
      <div className="method-chapter-nav container"><div className="method-tabs" role="group" aria-label="Explore framework stages">{framework.map((stage, i) => <button key={stage.letter} aria-label={stage.name} className={active === i ? 'active' : ''} aria-pressed={active === i} onClick={() => selectChapter(i)}><span>0{i + 1}</span><small>{stage.name}</small><span className="chapter-track"><i style={{ transform: `scaleX(${Math.max(0, Math.min(1, progress / 25 - i))})` }} /></span></button>)}</div><span className="method-progress-label mono">{String(progress).padStart(2, '0')}%</span></div>
    </div>
  </section>;
  return <section id="method" ref={section} className={`framework-section ${standalone ? 'framework-standalone' : ''} ${reduced ? 'framework-reduced' : ''}`} aria-label="The MOKI framework">
    <div className="framework-sticky">
      <div className="container framework-layout">
        <div className="framework-copy">
          <Eyebrow>THE MOKI METHOD</Eyebrow>
          <h2>From all over<br />the place.<br /><span className="text-muted">To all connected.</span></h2>
          <p className="framework-intro">Four thoughtful steps.<br />A business that works better together.</p>
          <div className="method-tabs" role="group" aria-label="Explore framework stages">
            {framework.map((stage, i) => <button key={stage.letter} aria-label={stage.name} className={active === i ? 'active' : ''} aria-pressed={active === i} onClick={() => selectChapter(i)}><span>{stage.letter}</span><small>{stage.name}</small></button>)}
          </div>
          <div className="method-description" key={active} aria-live="polite">
            <p className="mono method-number">0{active + 1} / {item.name.toUpperCase()}</p>
            <h3>{item.headline}</h3><p>{item.body}</p>
          </div>
          {!standalone && !reduced && <span className="scroll-note"><ArrowDown size={13} /> KEEP SCROLLING. WATCH IT CONNECT.</span>}
        </div>
        <div className="framework-art">
          <div className="art-corner art-corner-tl" /><div className="art-corner art-corner-br" />
          <div className="film-topline"><span><span className="status-dot" />THE TRANSFORMATION</span><span>0{active + 1} — 04</span></div>
          <canvas ref={canvas} role="img" aria-label={`3D illustration of the ${item.name} stage: scattered business tasks become one connected Moki system.`} />
          <div className="film-caption"><Check size={14} /><span>{item.detail}</span><ArrowUpRight size={14} /></div>
          <div className="film-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
        </div>
      </div>
    </div>
  </section>;
}
