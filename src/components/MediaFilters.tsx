// Both supplied hero assets use this composition. A small margin includes the
// film's gentle movement; blue chroma keeps the surrounding neutral pixels out.
const markArea = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080"><path d="M670 275 954 469 1240 278 1256 298 1256 743 1119 655 1120 509 972 634 953 622 784 500 784 656 664 741Z" fill="white" stroke="white" stroke-width="24" stroke-linejoin="round"/></svg>');

/** Preserve the original blue mark while adapting its dark surroundings. */
export default function MediaFilters() {
  return <svg className="media-filter-definitions" width="0" height="0" aria-hidden="true" focusable="false">
    <defs>{(['meet', 'slice'] as const).map(fit =>
      <filter key={fit} id={`moki-light-artwork${fit === 'slice' ? '-cover' : ''}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feComponentTransfer in="SourceGraphic" result="inverted">
          <feFuncR type="linear" slope="-1" intercept="1" />
          <feFuncG type="linear" slope="-1" intercept="1" />
          <feFuncB type="linear" slope="-1" intercept="1" />
        </feComponentTransfer>
        <feColorMatrix in="inverted" type="hueRotate" values="180" result="lightSurroundings" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="
          0 0 0 0 1
          0 0 0 0 1
          0 0 0 0 1
          -10 0 10 0 -.35" result="blueChroma" />
        <feImage href={markArea} preserveAspectRatio={`xMidYMid ${fit}`} result="markArea" />
        <feComposite in="blueChroma" in2="markArea" operator="in" result="blueMask" />
        <feComposite in="SourceGraphic" in2="blueMask" operator="in" result="originalBlue" />
        <feComposite in="lightSurroundings" in2="blueMask" operator="out" result="neutralSurroundings" />
        <feComposite in="originalBlue" in2="neutralSurroundings" operator="arithmetic" k2="1" k3="1" />
      </filter>)}</defs>
  </svg>;
}
