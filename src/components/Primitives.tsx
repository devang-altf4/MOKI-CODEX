import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Plus, Minus } from 'lucide-react';

export function ArrowLink({ to, children, className = '' }: { to: string; children: ReactNode; className?: string }) {
  return <Link to={to} className={to.startsWith('/contact') ? `button button-primary ${className}` : `arrow-link ${className}`}>{to.startsWith('/contact') ? <span>{children}</span> : children}<ArrowUpRight size={17} /></Link>;
}
export function Button({ to, children, variant = 'primary', className = '' }: { to: string; children: ReactNode; variant?: 'primary' | 'outline' | 'light'; className?: string }) {
  return <Link to={to} className={`button button-${variant} ${className}`}><span>{children}</span><ArrowUpRight size={18} /></Link>;
}
export function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <p className={`eyebrow ${light ? 'eyebrow-light' : ''}`}><span className="eyebrow-dash" />{children}</p>;
}
export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.classList.add('will-reveal');
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { el.classList.add('is-revealed'); observer.unobserve(el); } }, { threshold: 0.08 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}
export function Accordion({ items }: { items: readonly (readonly [string, string])[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return <div className="accordion">{items.map(([q, a], i) => <div className={`accordion-item ${open === i ? 'is-open' : ''}`} key={q}>
    <h3><button aria-expanded={open === i} aria-controls={`answer-${i}`} onClick={() => setOpen(open === i ? null : i)}><span>{q}</span>{open === i ? <Minus size={20} /> : <Plus size={20} />}</button></h3>
    <div className="accordion-answer" id={`answer-${i}`} hidden={open !== i}><p>{a}</p></div>
  </div>)}</div>;
}
