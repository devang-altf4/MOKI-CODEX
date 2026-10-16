import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { CalendarDays, ChartNoAxesCombined, FileText, Folder, Mail, MessageSquare } from 'lucide-react';
import Logo from './Logo';
import { connections, toolKinds } from './methodMotion';
import type { MethodRenderer } from './MethodScene';

const icons = { document: FileText, mail: Mail, calendar: CalendarDays, chat: MessageSquare, chart: ChartNoAxesCombined, folder: Folder };
export default function MethodStage({ reduced, active, onRenderer }: { reduced: boolean; active: number; onRenderer: (renderer: MethodRenderer) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false), [ready, setReady] = useState(false);
  const [Scene, setScene] = useState<ComponentType<{ onRenderer: (renderer: MethodRenderer) => void }> | null>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setNear(true); observer.disconnect(); } }, { rootMargin: '1000px' });
    observer.observe(root.current!);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!near || reduced) return;
    let disposed = false;
    void import('./MethodScene').then(module => { if (!disposed) setScene(() => module.default); }).catch(() => { /* Keep the CSS 3D scene if the GPU module cannot load. */ });
    return () => { disposed = true; };
  }, [near, reduced]);
  const register = useCallback((renderer: MethodRenderer) => { setReady(!!renderer); onRenderer(renderer); }, [onRenderer]);
  return <div className={`method-live-stage ${ready && !reduced ? 'webgl-ready' : ''}`} ref={root} data-renderer={ready && !reduced ? 'webgl' : 'css'} role="img" aria-label={`Live 3D ${['Map', 'Optimize', 'Kit', 'Integrate'][active]} transformation: business tools organize and connect as you scroll.`}>
    <div className="method-fallback" aria-hidden="true">{connections.map((_, i) => <span key={i} className="method-fallback-link" />)}{toolKinds.map((kind, i) => { const Icon = icons[kind]; return <div className={`method-fallback-tool tool-${kind}`} key={i}><Icon strokeWidth={1.15} /></div>; })}<div className="method-fallback-mark"><Logo wordmark={false} /></div></div>
    {Scene && !reduced && <Scene onRenderer={register} />}
  </div>;
}
