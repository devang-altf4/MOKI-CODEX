type Options = {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  mobile: boolean;
  onChapter: (chapter: number) => void;
};
type FrameRange = { offset: number; length: number };

export function createFrameSequence({ root, canvas, mobile, onChapter }: Options) {
  delete root.dataset.paintedFrame;
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })!;
  const count = mobile ? 121 : 193;
  const folder = mobile ? 'mobile' : 'desktop';
  const cache = new Map<number, ImageBitmap>();
  const pending = new Set<number>();
  const failed = new Set<number>();
  const controller = new AbortController();
  const progressLabel = root.querySelector('.method-progress-label');
  const bars = [...root.querySelectorAll<HTMLElement>('.chapter-track i')];
  let pack: Blob | null = null, ranges: FrameRange[] = [];
  let disposed = false, loading: Promise<void> | null = null, lastChapter = -1;
  let target = 0, current = 0, previousTime = 0, raf = 0, lastPainted = -1;
  let running = false, visible = false, smooth = true, previousPercent = -1;
  let lastDrawPosition = -100;
  let revision = 0, lastDrawRevision = -1;
  const limit = mobile ? 14 : 20;

  const queue = () => { if (!disposed && !raf && document.visibilityState === 'visible') raf = requestAnimationFrame(render); };
  const trim = () => {
    const center = Math.round(current * (count - 1));
    const evict = [...cache.keys()].sort((a, b) => Math.abs(b - center) - Math.abs(a - center));
    while (cache.size > limit) {
      const key = evict.shift()!;
      if (key === lastPainted) continue;
      cache.get(key)?.close(); cache.delete(key);
    }
    root.dataset.cachedFrames = String(cache.size);
  };
  const decode = async (index: number) => {
    if (!pack || !ranges[index] || cache.has(index) || pending.has(index) || failed.has(index) || pending.size >= 6) return;
    pending.add(index);
    try {
      const { offset, length } = ranges[index];
      const bitmap = await createImageBitmap(pack.slice(offset, offset + length, 'image/webp'));
      if (disposed) bitmap.close();
      else { cache.set(index, bitmap); revision++; trim(); queue(); }
    } catch { failed.add(index); }
    finally { pending.delete(index); }
  };
  const warm = (position: number) => {
    const center = Math.floor(position);
    const direction = target >= current ? 1 : -1;
    const lead = Math.max(-8, Math.min(8, Math.round((target - current) * (count - 1))));
    const ahead = center + lead;
    const wanted = [center, center + 1, ahead, ahead + direction, ahead + 2 * direction, center + 2 * direction];
    for (let step = 1; step <= 6; step++) wanted.push(center + direction * step, center - direction * step);
    for (const index of wanted) if (index >= 0 && index < count) void decode(index);
  };
  const drawImage = (bitmap: ImageBitmap, alpha = 1) => {
    const scale = Math.max(canvas.width / bitmap.width, canvas.height / bitmap.height) * 1.02;
    ctx.globalAlpha = alpha;
    ctx.drawImage(bitmap, (canvas.width - bitmap.width * scale) / 2, (canvas.height - bitmap.height * scale) / 2, bitmap.width * scale, bitmap.height * scale);
  };
  const paint = (position: number) => {
    const requested = Math.floor(position);
    let lower = requested, first = cache.get(requested);
    // Decoding can trail a fast scroll. Keep the scene moving with the nearest
    // prepared frame instead of waiting for an exact frame that is already past.
    if (!first) {
      let distance = Infinity;
      for (const [index, bitmap] of cache) {
        const nextDistance = Math.abs(index - position);
        if (nextDistance < distance) { lower = index; first = bitmap; distance = nextDistance; }
      }
    }
    const upper = Math.min(count - 1, requested + 1), second = lower === requested ? cache.get(upper) : undefined;
    if (!first) return;
    if (Math.abs(position - lastDrawPosition) < .015 && revision === lastDrawRevision) return;
    ctx.globalAlpha = 1; ctx.fillStyle = '#080a0f'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawImage(first);
    if (second && upper !== lower) drawImage(second, position - lower);
    ctx.globalAlpha = 1;
    lastPainted = lower; lastDrawPosition = position; lastDrawRevision = revision;
    root.dataset.paintedFrame = String(lower);
  };
  const updateLabels = () => {
    const chapter = Math.min(3, Math.floor(current * 4));
    if (chapter !== lastChapter) { lastChapter = chapter; onChapter(chapter); }
    const percent = Math.round(current * 100);
    if (percent !== previousPercent) {
      previousPercent = percent;
      if (progressLabel) progressLabel.textContent = `${String(percent).padStart(2, '0')}%`;
      bars.forEach((bar, i) => { bar.style.transform = `scaleX(${Math.max(0, Math.min(1, current * 4 - i))})`; });
    }
    root.style.setProperty('--story-pan', `${(current - .5) * 90}px`);
    root.style.setProperty('--story-scale', `${1.06 + Math.sin(current * Math.PI) * .09}`);
    root.dataset.frame = String(Math.round(current * (count - 1)));
  };
  function render(time: number) {
    raf = 0;
    if (disposed) return;
    const dt = previousTime ? Math.min(40, time - previousTime) : 16.7; previousTime = time;
    const difference = target - current;
    current = smooth && Math.abs(difference) < .32 ? current + difference * (1 - Math.exp(-dt / 95)) : target;
    if (Math.abs(target - current) < .00015) current = target;
    const position = current * (count - 1);
    warm(position); paint(position); updateLabels();
    running = current !== target;
    if (running && visible) queue();
  }
  const preload = () => {
    if (loading) return loading;
    loading = Promise.all([
      fetch(`/film/${folder}.frames.json`, { signal: controller.signal }).then(r => { if (!r.ok) throw Error('Scene index unavailable'); return r.json(); }),
      fetch(`/film/${folder}.frames`, { signal: controller.signal }).then(r => { if (!r.ok) throw Error('Scene unavailable'); return r.blob(); }),
    ]).then(([index, blob]) => { if (!disposed) { ranges = index.frames; pack = blob; root.dataset.sequenceReady = 'true'; warm(current * (count - 1)); } }).catch(() => {
      if (!disposed) root.dataset.sequenceReady = 'fallback';
    });
    return loading;
  };
  const resize = () => {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.25, Math.sqrt(1_400_000 / Math.max(1, width * height)));
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    lastDrawPosition = -100; queue();
  };
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(canvas);
  const near = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) void preload(); }, { rootMargin: '1200px' }); near.observe(root);
  const screen = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) { previousTime = 0; queue(); } }); screen.observe(root);
  const visibility = () => { if (document.visibilityState === 'hidden') { cancelAnimationFrame(raf); raf = 0; } else { previousTime = 0; if (visible) queue(); } };
  document.addEventListener('visibilitychange', visibility);
  resize();
  return {
    setProgress(progress: number, interpolate = true) {
      const next = Math.min(1, Math.max(0, progress));
      if (next === target && !running) return;
      target = next; smooth = interpolate; queue();
    },
    preload,
    dispose() {
      disposed = true; controller.abort(); cancelAnimationFrame(raf); near.disconnect(); screen.disconnect(); resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      cache.forEach(bitmap => bitmap.close()); cache.clear(); pack = null;
    },
  };
}
