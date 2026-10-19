import { useEffect, useState } from 'react';
import { useTheme } from './Theme';

/** Select a native video, rather than recolouring moving frames in the browser. */
export function useMokiArtwork({ responsive = false }: { responsive?: boolean } = {}) {
  const { theme } = useTheme();
  const [compact, setCompact] = useState(() => responsive && matchMedia('(max-width: 700px), (max-width: 960px) and (max-height: 500px)').matches);
  useEffect(() => {
    if (!responsive) return;
    const query = matchMedia('(max-width: 700px), (max-width: 960px) and (max-height: 500px)');
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [responsive]);
  const variant = theme === 'light' ? '-light-flow' : '';
  const size = responsive && compact ? '-mobile' : '';
  return {
    poster: `/images/moki-system${variant}${size}.webp`,
    film: `/videos/moki-system-loop${variant}${size}.mp4`,
  };
}
