import { useEffect, useState } from 'react';
import { useTheme } from './Theme';

/** Select a native video, rather than recolouring moving frames in the browser. */
export function useMokiArtwork() {
  const { theme } = useTheme();
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 700px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 700px)');
    const update = () => setCompact(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const variant = theme === 'light' ? `-light${compact ? '-mobile' : ''}` : '';
  return {
    poster: `/images/moki-system${variant}.webp`,
    film: `/videos/moki-system-loop${variant}.mp4`,
  };
}
