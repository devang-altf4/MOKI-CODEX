import { useEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Eyebrow } from './Primitives';
import { useMokiArtwork } from './useMokiArtwork';

gsap.registerPlugin(ScrollTrigger);
export type PageScene = 'solutions' | 'method' | 'industries' | 'about';
const scenes = {
  solutions: { word: 'POSSIBILITY', clip: 'c2-optimize', labels: ['AI that helps.', 'Tools that talk.', 'Room to grow.'], number: '01', caption: 'NINE WAYS FORWARD' },
  method: { word: 'IN SYNC', clip: 'c3-kit', labels: ['Understand.', 'Build together.', 'Keep improving.'], number: '02', caption: 'FOUR STEPS. ONE SYSTEM.' },
  industries: { word: 'YOUR WORLD', clip: 'c1-map', labels: ['Your people.', 'Your process.', 'Your next move.'], number: '03', caption: 'BUILT AROUND YOUR WORK' },
  about: { word: 'WITH PURPOSE', clip: '', labels: ['Business first.', 'Human by design.', 'Connected by Moki.'], number: '04', caption: 'SMARTER SYSTEMS. SIMPLER BUSINESS.' },
};

export function CinematicIntro({ scene, eyebrow, title, accent, description }: { scene: PageScene; eyebrow: string; title: string; accent: string; description: string }) {
  const root = useRef<HTMLElement>(null), video = useRef<HTMLVideoElement>(null);
  const config = scenes[scene];
  const artwork = useMokiArtwork();
  const poster = config.clip ? `/images/method/${config.clip}-end.webp` : artwork.poster;
  const filmSource = config.clip ? `/videos/method/${config.clip}.mp4` : artwork.film;
  useEffect(() => {
    const element = root.current!, film = video.current!;
    const media = gsap.matchMedia();
    media.add({ motion: '(prefers-reduced-motion: no-preference)', compact: '(max-width: 980px)' }, context => {
      if (!context.conditions?.motion) return;
      const small = Boolean(context.conditions?.compact);
      const q = gsap.utils.selector(element);
      gsap.fromTo(q('.inner-title-line'), { yPercent: 110, rotation: 3 }, { yPercent: 0, rotation: 0, stagger: .12, duration: 1.1, ease: 'power4.out' });
      gsap.fromTo(q('.inner-visual-tilt'), { scale: .8, rotationY: -18, rotationZ: -6 }, { scale: 1, rotationY: 0, rotationZ: 0, duration: 1.6, ease: 'power3.out' });
      const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: element, start: 'top top', end: 'bottom top', scrub: .8 } });
      tl.to(q('.inner-visual'), { y: small ? -25 : -130, scale: small ? 1.05 : 1.26, rotation: small ? 3 : 7 }, 0)
        .to(q('.inner-intro-copy'), { y: small ? -18 : -90 }, 0)
        .to(q('.inner-orbit-word'), { xPercent: -23 }, 0)
        .to(q('.inner-float'), { y: (i: number) => small ? -8 : (i % 2 ? -120 : 85), rotation: (i: number) => small ? 0 : (i % 2 ? -9 : 9), stagger: .03 }, 0);
      let visible = false;
      const update = () => { if (visible && document.visibilityState === 'visible') void film.play().catch(() => {}); else film.pause(); };
      const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
      observer.observe(element); document.addEventListener('visibilitychange', update);
      return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); film.pause(); };
    });
    return () => { media.revert(); film.pause(); };
  }, [scene, filmSource]);
  return <section className={`cinematic-intro intro-${scene}`} ref={root} aria-label={eyebrow}>
    <div className="inner-orbit-word" aria-hidden="true">{config.word}</div>
    <div className="inner-intro-copy container"><Eyebrow>{eyebrow}</Eyebrow><h1><span className="inner-title-mask"><span className="inner-title-line">{title}</span></span><span className="inner-title-mask"><em className="inner-title-line">{accent}</em></span></h1><p>{description}</p></div>
    <div className="inner-visual" aria-hidden="true"><div className="inner-visual-tilt"><img src={poster} alt="" fetchPriority="high" /><video ref={video} src={filmSource} poster={poster} muted playsInline loop={!config.clip} preload="metadata" /></div>{config.labels.map((label, index) => <div className={`inner-float inner-float-${index}`} key={label}><span>0{index + 1}</span>{label}</div>)}</div>
    <div className="inner-intro-meta container"><span>{config.caption}</span><span>EXPLORE MOKI / {config.number}</span></div>
  </section>;
}

/** Each row owns its trigger, including rows mounted by the solutions filters. */
export function MotionBlock({ children, className = '' }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current!;
    const media = gsap.matchMedia();
    media.add({ motion: '(prefers-reduced-motion: no-preference)', compact: '(max-width: 700px)' }, context => {
      if (!context.conditions?.motion) return;
      const small = Boolean(context.conditions?.compact);
      const q = gsap.utils.selector(element);
      gsap.fromTo(element, { y: small ? 25 : 85, rotateX: small ? 2 : 7, scale: small ? .99 : .965, transformPerspective: 1200 }, { y: 0, rotateX: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: element, start: 'top 98%', end: 'top 46%', scrub: .6, invalidateOnRefresh: true } });
      const details = q('.industry-flow-node, .service-icon, .about-art > img');
      if (details.length) gsap.fromTo(details, { x: small ? 12 : 45, y: small ? 8 : 20, rotation: small ? 2 : 5 }, { x: 0, y: 0, rotation: 0, stagger: .12, ease: 'none', scrollTrigger: { trigger: element, start: 'top 90%', end: 'center 45%', scrub: .7 } });
    });
    return () => media.revert();
  }, []);
  return <div ref={root} className={`motion-block ${className}`}>{children}</div>;
}
