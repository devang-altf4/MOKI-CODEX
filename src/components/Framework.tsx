import { useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { framework } from '../content';
import { Eyebrow } from './Primitives';
import MethodFilm from './MethodFilm';

export default function Framework() {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const activeRef = useRef(0);
  useEffect(() => {
    const root = section.current;
    if (!root) return;
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0, settle: ReturnType<typeof setTimeout> | undefined, candidate = -1;
    const update = () => {
      raf = 0;
      if (query.matches) return;
      const progress = Math.min(1, Math.max(0, -root.getBoundingClientRect().top / Math.max(1, root.offsetHeight - innerHeight)));
      root.style.setProperty('--story-pan', `${(progress - .5) * 75}px`);
      const chapter = Math.min(3, Math.floor(progress * 4));
      if (chapter !== candidate) {
        candidate = chapter; clearTimeout(settle);
        settle = setTimeout(() => { if (activeRef.current !== chapter) { activeRef.current = chapter; setActive(chapter); } }, 120);
      }
    };
    const scroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    const motion = () => { setReduced(query.matches); scroll(); };
    window.addEventListener('scroll', scroll, { passive: true }); window.addEventListener('resize', scroll); query.addEventListener('change', motion);
    update();
    return () => { cancelAnimationFrame(raf); clearTimeout(settle); window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll); query.removeEventListener('change', motion); };
  }, []);
  const select = (index: number) => {
    activeRef.current = index; setActive(index);
    const root = section.current;
    if (!root || reduced) return;
    window.scrollTo({ top: root.getBoundingClientRect().top + scrollY + (root.offsetHeight - innerHeight) * ((index + .4) / 4), behavior: 'instant' });
  };
  const item = framework[active];
  const headlines = [['MAP', 'the mess.'], ['LOSE', 'the friction.'], ['BUILD', 'the system.'], ['FIND', 'your flow.']];
  return <section id="method" ref={section} className={`framework-section scroll-method ${reduced ? 'framework-reduced' : ''}`} aria-label="The MOKI framework">
    <div className="method-scene"><div className="method-grain" aria-hidden="true" /><MethodFilm active={active} reduced={reduced} /><div className="method-vignette" aria-hidden="true" />
      <div className="method-scene-top container"><Eyebrow>FROM DISCONNECTED TO IN SYNC</Eyebrow><span className="mono">THE MOKI METHOD / 0{active + 1}</span></div>
      <div className="method-scene-title container" key={`title-${active}`}><h2><span>{headlines[active][0]}</span><em>{headlines[active][1]}</em></h2></div><div className="method-big-number" aria-hidden="true">0{active + 1}</div>
      <div className="method-scene-bottom container"><div className="method-scene-copy" key={`body-${active}`}><span className="mono">0{active + 1} — {item.name.toUpperCase()}</span><h3>{item.headline}</h3><p>{item.body}</p></div>{!reduced && <div className="method-scroll-cue"><span className="scroll-cue-line" /><ArrowDown size={18} /><span>TAKE IT IN.<br />SCROLL FOR THE NEXT CHAPTER.</span></div>}</div>
      <div className="method-chapter-nav container"><div className="method-tabs" role="group" aria-label="Explore framework stages">{framework.map((stage, index) => <button key={stage.letter} aria-label={stage.name} className={active === index ? 'active' : ''} aria-pressed={active === index} onClick={() => select(index)}><span>0{index + 1}</span><small>{stage.name}</small><span className="chapter-track"><i style={{ transform: `scaleX(${index < active ? 1 : 0})` }} /></span></button>)}</div><span className="method-progress-label mono">{active * 25}%</span></div>
    </div>
  </section>;
}
