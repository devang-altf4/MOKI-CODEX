import { useEffect, useRef, useState } from 'react';
import { ArrowDown, BrainCircuit, Check, Layers3, Mail } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { challenges } from '../content';
import { ArrowLink, Eyebrow } from './Primitives';
import '../solutions-motion.css';

gsap.registerPlugin(ScrollTrigger);
const icons = [Mail, BrainCircuit, Layers3, Check];

export default function SolutionExplorer() {
  const root = useRef<HTMLElement>(null);
  const [selected, setSelected] = useState(0);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [compact, setCompact] = useState(() => matchMedia('(max-width: 700px), (max-width: 960px) and (max-height: 500px)').matches);
  const challenge = challenges[selected];
  const selectedRef = useRef(0);
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add({ motion: '(prefers-reduced-motion: no-preference)', reduced: '(prefers-reduced-motion: reduce)', compact: '(max-width: 700px), (max-width: 960px) and (max-height: 500px)' }, context => {
      const small = Boolean(context.conditions?.compact);
      setCompact(small);
      setReduced(Boolean(context.conditions?.reduced));
      if (context.conditions?.reduced) return;
      const q = gsap.utils.selector(root);
      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root.current, start: small ? 'top 85%' : 'top top', end: small ? 'bottom 20%' : 'bottom bottom', scrub: .5,
          onUpdate: self => {
            const index = Math.min(3, Math.floor(self.progress * 4));
            if (!small && index !== selectedRef.current) { selectedRef.current = index; setSelected(index); }
            root.current?.style.setProperty('--solution-progress', String(self.progress));
          },
        },
      });
      const travel = small ? .15 : 1;
      timeline.fromTo(q('.solution-node'), { y: i => [80, -80, 100, -65][i] * travel, x: i => [-65, -30, 40, 75][i] * travel, rotateZ: i => [-18, 13, -12, 18][i] * (small ? .4 : 1), scale: small ? .94 : .78 }, {
        y: i => [-32, 32, -35, 24][i] * travel, x: 0, rotateZ: i => [8, -7, 5, -8][i], scale: 1, duration: .5,
      }, 0).to(q('.solution-node'), { y: i => [30, -20, 32, -24][i] * travel, x: i => [15, -10, 12, -15][i] * travel, rotateZ: i => [-7, 6, -6, 7][i], duration: .5 }, .5)
        .fromTo(q('.solution-constellation'), { rotateY: small ? -5 : -20, rotateX: small ? 3 : 12 }, { rotateY: small ? 4 : 12, rotateX: small ? -2 : -5, duration: 1 }, 0)
        .fromTo(q('.solution-giant-index'), { y: 80, x: 40 }, { y: -70, x: -50, duration: 1 }, 0)
        .fromTo(q('.solution-packet'), { offsetDistance: '0%' }, { offsetDistance: '100%', duration: 1 }, 0);
    }, root);
    return () => mm.revert();
  }, []);
  const select = (index: number) => {
    selectedRef.current = index; setSelected(index);
    if (!reduced && !compact && root.current) {
      const section = root.current;
      scrollTo({ top: section.getBoundingClientRect().top + scrollY + (section.offsetHeight - innerHeight) * ((index + .5) / 4), behavior: 'smooth' });
    }
  };
  return <section id="solutions" ref={root} className={`solution-section solution-showcase ${reduced ? 'solutions-reduced' : ''}`}>
    <div className="solution-stage"><div className="solution-atmosphere" aria-hidden="true" /><div className="container solution-stage-inner">
      <div className="solution-headline"><div><Eyebrow>BUILT TO SOLVE THE EVERYDAY</Eyebrow><h2>WHAT’S GETTING<br />IN YOUR <em>way?</em></h2></div><ArrowLink to="/solutions">Explore all 9 solutions</ArrowLink></div>
      <div className="challenge-tabs" role="tablist" aria-label="Business challenges">{challenges.map((item, index) => <button role="tab" id={`challenge-tab-${index}`} aria-selected={selected === index} aria-controls="challenge-panel" tabIndex={selected === index ? 0 : -1} key={item.id} onClick={() => select(index)} onKeyDown={event => {
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % 4;
        else if (event.key === 'ArrowLeft') next = (index + 3) % 4;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = 3;
        else return;
        event.preventDefault(); select(next); document.getElementById(`challenge-tab-${next}`)?.focus({ preventScroll: true });
      }}><span className="mono">0{index + 1}</span>{item.label}</button>)}</div>
      <div id="challenge-panel" className="solution-story" role="tabpanel" aria-labelledby={`challenge-tab-${selected}`}>
        <div className="solution-story-copy" key={selected}><span className="tag">{challenge.tag}</span><h3>{challenge.title}</h3><p>{challenge.description}</p><ArrowLink to={`/solutions#${challenge.service}`}>See the solution</ArrowLink></div>
        <div className="solution-space"><span className="solution-giant-index" aria-hidden="true">0{selected + 1}</span><div className="solution-constellation"><svg className="solution-connections" viewBox="0 0 700 340" fill="none" aria-hidden="true"><path d="M90 210 C190 210 130 85 265 85 S360 265 440 265 S530 100 610 100" /><path className="solution-connection-live" d="M90 210 C190 210 130 85 265 85 S360 265 440 265 S530 100 610 100" style={{ strokeDashoffset: 1200 - selected * 270 }} /></svg><span className="solution-packet" aria-hidden="true" />{challenge.nodes.map((label, index) => { const Icon = icons[index]; return <div className={`solution-node solution-node-${index}`} key={index}><div className="solution-node-tile"><Icon size={36} strokeWidth={1.2} /><span className="node-edge" /><span className="node-dot" /></div><span className="solution-node-label">{label}</span></div>; })}</div><span className="solution-scene-caption"><span className="status-dot" />ILLUSTRATIVE WORKFLOW / 0{selected + 1}</span></div>
      </div>
      <div className="solution-bottom"><span>GOOD TOOLS. BETTER CONNECTIONS.</span><span><ArrowDown size={13} />SCROLL THROUGH THE POSSIBILITIES</span><span>0{selected + 1} / 04</span></div>
    </div></div>
  </section>;
}
