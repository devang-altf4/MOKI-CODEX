import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { framework } from '../content';
import { Eyebrow } from './Primitives';
import MethodStage from './MethodStage';
import { chapterMotion, connections, easeBetween, toolKinds, toolPose } from './methodMotion';
import type { MethodRenderer } from './MethodScene';

export default function Framework() {
  const section = useRef<HTMLElement>(null), renderer = useRef<MethodRenderer>(null);
  const motion = useRef({ target: 0, value: 0 });
  const jump = useRef<(progress: number) => void>(() => {});
  const [active, setActive] = useState(0), activeRef = useRef(0);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const register = useCallback((draw: MethodRenderer) => { renderer.current = draw; draw?.(motion.current.value); }, []);
  useEffect(() => {
    const root = section.current!, stage = root.querySelector<HTMLElement>('.method-live-stage')!;
    const tiles = [...root.querySelectorAll<HTMLElement>('.method-fallback-tool')], lines = [...root.querySelectorAll<HTMLElement>('.method-fallback-link')];
    const logo = root.querySelector<HTMLElement>('.method-fallback-mark')!, bars = [...root.querySelectorAll<HTMLElement>('.chapter-track i')], percentage = root.querySelector('.method-progress-label')!;
    const heading = root.querySelector<HTMLElement>('.method-scene-title h2')!, copy = root.querySelector<HTMLElement>('.method-scene-copy')!, number = root.querySelector<HTMLElement>('.method-big-number')!;
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0, last = 0, visible = false, unit = 60, centerX = 0, draws = 0, cameraTravel = 0, cameraLift = 0;
    const paint = (p: number) => {
      root.dataset.motionProgress = p.toFixed(5); root.dataset.motionFrames = String(++draws);
      bars.forEach((bar, index) => { bar.style.transform = `scaleX(${Math.min(1, Math.max(0, p * 4 - index))})`; });
      percentage.textContent = `${Math.round(p * 100)}%`;
      root.style.setProperty('--story-pan', `${(p - .5) * 65}px`);
      const beat = chapterMotion(p), still = query.matches;
      const sweep = still ? 0 : beat.sweep;
      stage.style.transform = still ? 'none' : `perspective(1600px) translate3d(${cameraTravel * sweep}px,${cameraLift * sweep}px,0) rotateY(${beat.yaw}deg) rotateZ(${beat.roll}deg) scale(${1 + sweep * .14})`;
      heading.style.opacity = still ? '1' : String(beat.opacity);
      heading.style.transform = still ? 'none' : `perspective(1000px) translate3d(${beat.x}px,${beat.y}px,0) rotateX(${beat.tilt}deg)`;
      copy.style.opacity = still ? '1' : String(beat.bodyOpacity);
      copy.style.transform = still ? 'none' : `translate3d(${beat.x * .45}px,${beat.y * .6}px,0)`;
      number.style.opacity = still ? '1' : String(1 - sweep * .85);
      root.dataset.cameraSweep = sweep.toFixed(4);
      const chapter = Math.min(3, Math.floor(p * 4));
      if (chapter !== activeRef.current) { activeRef.current = chapter; setActive(chapter); }
      if (visible && !query.matches) renderer.current?.(p);
      // The fallback uses the same poses and moves even when WebGL is unavailable.
      if (!renderer.current || query.matches) {
        const poses = toolKinds.map((_, index) => toolPose(p, index));
        tiles.forEach((tile, index) => { const pose = poses[index]; tile.style.transform = `translate3d(${centerX + pose.x * unit}px,${-pose.y * unit}px,${pose.z * unit}px) rotateX(${pose.rx}rad) rotateY(${pose.ry}rad) rotateZ(${pose.rz}rad) scale(${pose.scale})`; });
        const built = easeBetween(.44, .7, p), integrated = easeBetween(.72, 1, p);
        lines.forEach((line, index) => {
          const [a, b] = connections[index], from = poses[a], to = poses[b], spoke = poses[index % 6];
          const x = from.x + (spoke.x - from.x) * integrated, y = from.y + (spoke.y - from.y) * integrated;
          const dx = (to.x * (1 - integrated) - x) * unit, dy = (y - to.y * (1 - integrated)) * unit;
          const growth = Math.min(1, Math.max(0, built * 1.6 - index * .08));
          line.style.width = `${Math.hypot(dx, dy)}px`; line.style.transform = `translate(${centerX + x * unit}px,${-y * unit}px) rotate(${Math.atan2(dy, dx)}rad) scaleX(${growth})`;
        });
        logo.style.transform = `translateX(${centerX}px) rotateY(${-1.2 + integrated}rad) scale(${integrated})`;
      }
    };
    const frame = (now: number) => {
      raf = 0;
      if (document.visibilityState !== 'visible' || !visible) return;
      const dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60; last = now;
      const state = motion.current;
      state.value += (state.target - state.value) * (1 - Math.exp(-dt / .16));
      if (Math.abs(state.target - state.value) < .00008) state.value = state.target;
      paint(state.value);
      if (state.value !== state.target) raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
    const measure = () => {
      const rect = root.getBoundingClientRect(); visible = rect.top < innerHeight && rect.bottom > 0;
      if (!query.matches) motion.current.target = Math.min(1, Math.max(0, -rect.top / Math.max(1, root.offsetHeight - innerHeight)));
      if (query.matches || !visible) { cancelAnimationFrame(raf); raf = 0; motion.current.value = motion.current.target; paint(motion.current.value); }
      else start();
    };
    const resize = () => {
      const narrow = stage.clientWidth <= 700;
      const viewHeight = 2 * Math.tan(17.5 * Math.PI / 180) * (narrow ? 12 : 14);
      unit = stage.clientHeight / viewHeight * (narrow ? .88 : 1.18); centerX = narrow ? 0 : stage.clientWidth * .17;
      const pivot = narrow ? .5 : .67;
      cameraTravel = root.clientWidth / 2 - (stage.offsetLeft + stage.clientWidth * pivot);
      cameraLift = -stage.clientHeight * .035;
      stage.style.transformOrigin = `${pivot * 100}% 50%`;
      stage.style.setProperty('--tool-size', `${unit * 1.4}px`); paint(motion.current.value); measure();
    };
    jump.current = p => { motion.current.target = p; if (query.matches) { motion.current.value = p; paint(p); } else start(); };
    const preference = () => { setReduced(query.matches); measure(); };
    const visibility = () => { if (document.visibilityState === 'hidden') { cancelAnimationFrame(raf); raf = 0; } else measure(); };
    const observer = new ResizeObserver(resize); observer.observe(stage);
    addEventListener('scroll', measure, { passive: true }); addEventListener('resize', resize); document.addEventListener('visibilitychange', visibility); query.addEventListener('change', preference);
    resize();
    return () => { cancelAnimationFrame(raf); observer.disconnect(); removeEventListener('scroll', measure); removeEventListener('resize', resize); document.removeEventListener('visibilitychange', visibility); query.removeEventListener('change', preference); renderer.current = null; };
  }, []);
  const select = (index: number) => {
    const p = [.035, .38, .68, 1][index]; jump.current(p);
    const root = section.current;
    if (root && !reduced) window.scrollTo({ top: root.getBoundingClientRect().top + scrollY + (root.offsetHeight - innerHeight) * p, behavior: 'instant' });
  };
  const item = framework[active], headlines = [['MAP', 'the mess.'], ['LOSE', 'the friction.'], ['BUILD', 'the system.'], ['FIND', 'your flow.']];
  return <section id="method" ref={section} className={`framework-section scroll-method ${reduced ? 'framework-reduced' : ''}`} aria-label="The MOKI framework">
    <div className="method-scene"><div className="method-grain" aria-hidden="true" /><MethodStage reduced={reduced} active={active} onRenderer={register} /><div className="method-vignette" aria-hidden="true" />
      <div className="method-scene-top container"><Eyebrow>FROM DISCONNECTED TO IN SYNC</Eyebrow><span className="mono">THE MOKI METHOD / 0{active + 1}</span></div>
      <div className="method-scene-title container"><h2><span>{headlines[active][0]}</span><em>{headlines[active][1]}</em></h2></div><div className="method-big-number" aria-hidden="true">0{active + 1}</div>
      <div className="method-scene-bottom container"><div className="method-scene-copy"><span className="mono">0{active + 1} — {item.name.toUpperCase()}</span><h3>{item.headline}</h3><p>{item.body}</p></div>{!reduced && <div className="method-scroll-cue"><span className="scroll-cue-line" /><ArrowDown size={18} /><span>YOUR SCROLL.<br />EVERYTHING COMES TOGETHER.</span></div>}</div>
      <div className="method-chapter-nav container"><div className="method-tabs" role="group" aria-label="Explore framework stages">{framework.map((stage, index) => <button key={stage.letter} aria-label={stage.name} className={active === index ? 'active' : ''} aria-pressed={active === index} onClick={() => select(index)}><span>0{index + 1}</span><small>{stage.name}</small><span className="chapter-track"><i /></span></button>)}</div><span className="method-progress-label mono">0%</span></div>
    </div>
  </section>;
}
