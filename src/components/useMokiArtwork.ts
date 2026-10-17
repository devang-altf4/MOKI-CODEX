import { useTheme } from './Theme';

/** Select a native video, rather than recolouring moving frames in the browser. */
export function useMokiArtwork() {
  const { theme } = useTheme();
  const variant = theme === 'light' ? '-light-hd' : '';
  return {
    poster: `/images/moki-system${variant}.webp`,
    film: `/videos/moki-system-loop${variant}.mp4`,
  };
}
