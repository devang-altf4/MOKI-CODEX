import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';

export const methodClips = ['c1-map', 'c2-optimize', 'c3-kit', 'c4-integrate'];

/** Native video owns the clock: scrolling selects a chapter, never seeks frames. */
export default function MethodFilm({ active, reduced }: { active: number; reduced: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const [near, setNear] = useState(false), [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState<boolean[]>([false, false, false, false]);
  const [displayed, setDisplayed] = useState(-1), [paused, setPaused] = useState(false), [ended, setEnded] = useState(false);
  const [mobile, setMobile] = useState(() => matchMedia('(max-width: 700px)').matches);
  const [foreground, setForeground] = useState(() => document.visibilityState === 'visible');
  useEffect(() => {
    if (!root.current) return;
    const scene = root.current.closest('.method-scene')!;
    const preload = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setNear(true); preload.disconnect(); } }, { rootMargin: '1200px' });
    const screen = new IntersectionObserver(([entry]) => setVisible(entry.intersectionRatio >= .4), { threshold: [0, .4] });
    preload.observe(scene); screen.observe(scene);
    const query = matchMedia('(max-width: 700px)');
    const resize = () => setMobile(query.matches);
    const visibility = () => setForeground(document.visibilityState === 'visible');
    query.addEventListener('change', resize); document.addEventListener('visibilitychange', visibility);
    return () => { preload.disconnect(); screen.disconnect(); query.removeEventListener('change', resize); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (!near || reduced) return;
    setLoaded(previous => previous.map((value, index) => value || index === active || index === active + 1));
  }, [near, active, reduced]);
  useEffect(() => {
    setEnded(false);
    const video = videos.current[active];
    if (video) { video.pause(); try { video.currentTime = 0; } catch { /* Metadata can arrive after a chapter is selected. */ } }
  }, [active, mobile]);
  useEffect(() => {
    videos.current.forEach((video, index) => {
      if (!video) return;
      if (index === active && loaded[index] && visible && foreground && !reduced && !paused && !ended) {
        video.playbackRate = 1;
        void video.play().catch(() => {});
      } else video.pause();
    });
  }, [active, loaded, visible, foreground, reduced, paused, ended]);
  useEffect(() => {
    const video = videos.current[active], element = root.current;
    if (!video || !element || reduced) return;
    const section = element.closest('.framework-section');
    const bars = [...(section?.querySelectorAll<HTMLElement>('.chapter-track i') || [])];
    const label = section?.querySelector('.method-progress-label');
    const time = element.querySelector('.method-time');
    let callback = 0, disposed = false;
    const update = () => {
      if (disposed) return;
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 10;
      const p = Math.min(1, video.currentTime / duration);
      bars.forEach((bar, index) => { bar.style.transform = `scaleX(${index < active ? 1 : index === active ? p : 0})`; });
      if (label) label.textContent = `${Math.round((active + p) * 25)}%`;
      if (time) time.textContent = `${Math.round(video.currentTime)} / ${Math.round(duration)}s`;
      element.dataset.videoTime = video.currentTime.toFixed(3);
      if ('requestVideoFrameCallback' in video) callback = video.requestVideoFrameCallback(update);
    };
    update();
    const updateFallback = () => { if (!('requestVideoFrameCallback' in video)) update(); };
    video.addEventListener('timeupdate', updateFallback);
    return () => { disposed = true; if (callback) video.cancelVideoFrameCallback(callback); video.removeEventListener('timeupdate', updateFallback); };
  }, [active, reduced, mobile]);
  useEffect(() => () => videos.current.forEach(video => video?.pause()), []);
  const replay = () => { const video = videos.current[active]; if (video) video.currentTime = 0; setEnded(false); setPaused(false); };
  return <div className="method-film" ref={root} data-chapter={active} data-playback-state={reduced ? 'still' : ended ? 'ended' : paused ? 'paused' : visible && foreground ? 'playing' : 'waiting'}>
    <picture className="method-film-poster"><source media="(max-width: 700px)" srcSet={`/images/method/${methodClips[active]}-mobile.webp`} /><img src={`/images/method/${methodClips[active]}${reduced ? '-end' : ''}.webp`} alt={`3D illustration of the ${['Map', 'Optimize', 'Kit', 'Integrate'][active]} stage: business tools coming together as one system.`} /></picture>
    {!reduced && methodClips.map((clip, index) => <video key={clip} ref={element => { videos.current[index] = element; }} className={`method-native-video ${displayed === index ? 'film-visible' : ''}`} src={loaded[index] ? `/videos/method/${clip}${mobile ? '-mobile' : ''}.mp4` : undefined} poster={`/images/method/${clip}${mobile ? '-mobile' : ''}.webp`} muted playsInline preload={index === active || index === active + 1 ? 'auto' : 'metadata'} aria-hidden="true" onLoadedData={() => { if (index === active) setDisplayed(index); }} onPlaying={() => { if (index === active) setDisplayed(index); }} onEnded={() => { if (index === active) setEnded(true); }} onError={() => { if (index === active) setDisplayed(-1); }} />)}
    {!reduced && <div className="method-playback"><span className="method-time">0 / 10s</span><button onClick={ended ? replay : () => setPaused(!paused)} aria-label={ended ? 'Replay method animation' : paused ? 'Resume method animation' : 'Pause method animation'}>{ended ? <RotateCcw size={14} /> : paused ? <Play size={14} /> : <Pause size={14} />}</button>{!ended && <button onClick={replay} aria-label="Replay method animation"><RotateCcw size={14} /></button>}</div>}
  </div>;
}
