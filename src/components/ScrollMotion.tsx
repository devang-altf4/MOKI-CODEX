import { useEffect, useRef, type RefObject, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** The tall outer section supplies native scroll travel; CSS owns the sticky scene. */
export function useHeroScroll(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const media = gsap.matchMedia();
    media.add({ motion: '(prefers-reduced-motion: no-preference)', compact: '(max-width: 700px), (max-width: 960px) and (max-height: 500px)' }, context => {
      if (!context.conditions?.motion) return;
      const small = Boolean(context.conditions?.compact);
      const q = gsap.utils.selector(element);
      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: element, start: 'top top', end: 'bottom bottom', scrub: .55,
          invalidateOnRefresh: true,
        },
      });
      timeline.to(q('.hero-copy'), { y: small ? -40 : -130, x: () => innerWidth > 900 ? -100 : 0, autoAlpha: 0, duration: .38 }, 0)
        .to(q('.hero-art'), {
          x: () => !small && innerWidth > 900 ? -innerWidth * .23 : 0,
          y: () => {
            const height = q('.hero-pin')[0].clientHeight;
            if (small) return -height * (height <= 650 ? .38 : .23);
            return innerWidth > 900 ? -innerHeight * .035 : -innerHeight * .18;
          },
          scale: () => small ? 1.08 : innerWidth > 900 ? 1.48 : 1.3,
          rotation: () => small ? 0 : innerWidth > 900 ? -8 : -4, force3D: true, duration: small ? .95 : .85,
        }, 0)
        .fromTo(q('.hero-next'), { y: small ? 24 : 100, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: small ? .27 : .32 }, small ? .58 : .55);
      // Phones move one video surface; large blended decoration stays on desktop.
      if (!small) timeline.to(q('.hero-halo'), { scale: 1.8, opacity: .85, duration: 1 }, 0);
    });
    // Fonts can change the height of the opening copy after the first paint.
    let disposed = false;
    void document.fonts.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });
    return () => { disposed = true; media.revert(); };
  }, [root]);
}

export function MotionPage({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add({ motion: '(prefers-reduced-motion: no-preference)', compact: '(max-width: 700px)' }, context => {
      if (!context.conditions?.motion) return;
      const small = Boolean(context.conditions?.compact);
      const q = gsap.utils.selector(root);
      const band = q('.kinetic-section')[0];
      gsap.fromTo(q('.kinetic-line-one'), { xPercent: -18 }, {
        xPercent: 8, ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: .6 },
      });
      gsap.fromTo(q('.kinetic-line-two'), { xPercent: 15 }, {
        xPercent: -15, ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: .6 },
      });
      q('.industry-index-item').forEach((el, i) => {
        gsap.fromTo(el, { x: (i % 2 === 0 ? -70 : 70) * (small ? .3 : 1), y: small ? 25 : 70 }, {
          x: 0, y: 0, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top 98%', end: 'top 65%', scrub: .6 },
        });
      });
      gsap.fromTo(q('.closing-layout h2'), { y: small ? 28 : 90, scale: small ? .96 : .88, transformOrigin: 'left center' }, {
        y: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: q('.closing-cta')[0], start: 'top bottom', end: 'top 30%', scrub: .5 },
      });
    }, root);
    return () => media.revert();
  }, []);
  return <div className="home-experience" ref={root}>{children}</div>;
}

export function KineticStatement() {
  return <section className="kinetic-section" aria-label="Less friction. More forward.">
    <div className="kinetic-meta"><span>THE WAY WORK SHOULD WORK</span><span>↓ KEEP THE MOMENTUM</span></div>
    <div className="kinetic-line kinetic-line-one" aria-hidden="true">LESS FRICTION.<span>↗</span></div>
    <div className="kinetic-line kinetic-line-two" aria-hidden="true"><span>↗</span>MORE FORWARD.</div>
    <div className="kinetic-bottom"><span>AI THAT HELPS.</span><span>SYSTEMS THAT CONNECT.</span><span>ROOM TO GROW.</span></div>
  </section>;
}

export function useContactMotion() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(root);
      gsap.fromTo(q('.contact-copy h1'), { y: 65, rotate: -3 }, { y: 0, rotate: 0, duration: 1.15, ease: 'power3.out' });
      gsap.fromTo(q('.contact-form-wrap'), { y: 95, rotateY: -12, rotateX: 7, scale: .92, transformPerspective: 1400 }, { y: 0, rotateY: 0, rotateX: 0, scale: 1, duration: 1.25, ease: 'power3.out' });
      gsap.to(q('.contact-orbit'), { rotation: 120, y: -100, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: .7 } });
    }, root);
    return () => mm.revert();
  }, []);
  return root;
}
