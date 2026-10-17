// The supplied poster and film share this orbit. Its region follows both media
// layouts; source luminance retains the moving highlights and metallic shading.
const orbitArea = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080"><ellipse cx="940" cy="474" rx="530" ry="158" transform="rotate(-18 940 474)" fill="none" stroke="white" stroke-width="70"/></svg>');
const markArea = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080"><path d="M670 275 954 469 1240 278 1256 298 1256 743 1119 655 1120 509 972 634 953 622 784 500 784 656 664 741Z" fill="white" stroke="white" stroke-width="12" stroke-linejoin="round"/></svg>');
const betweenTools = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080"><path fill="white" fill-rule="evenodd" d="M0 0H1920V1080H0Z M402 192 558 148 604 273 446 320Z M1252 63 1424 82 1446 143 1400 301 1215 274 1211 157Z M315 681 534 678 555 888 315 890Z M1546 383 1615 390 1687 475 1650 647 1485 610Z M1163 771 1307 745 1375 793 1388 894 1357 939 1200 978 1205 933 1141 935 1128 809Z"/></svg>');

/** Build-time grade for prepare-light-hero.mjs. Keep out of the shipped app. */
export default function LightArtworkGrade() {
  return <svg className="media-filter-definitions" width="0" height="0" aria-hidden="true" focusable="false">
    <defs>{(['meet', 'slice'] as const).map(fit =>
      <filter key={fit} id={`moki-light-artwork${fit === 'slice' ? '-cover' : ''}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        {/* A silver ramp retains detail without turning highlights black. */}
        <feColorMatrix in="SourceGraphic" type="saturate" values="0" result="luminance" />
        <feComponentTransfer in="luminance" result="silver">
          <feFuncR type="table" tableValues="1 .94 .82 .78 .75 .72 .70 .68 .67 .66 .65" />
          <feFuncG type="table" tableValues="1 .95 .85 .81 .79 .77 .75 .74 .73 .72 .71" />
          <feFuncB type="table" tableValues="1 .97 .89 .86 .84 .83 .82 .81 .80 .79 .78" />
        </feComponentTransfer>
        {/* Strong blue light becomes cobalt. The chroma threshold excludes
            the film's faint compression noise around its moving highlights. */}
        <feColorMatrix in="SourceGraphic" type="matrix" values="
          .5 0 0 0 .10
          0 .65 0 0 .24
          0 0 .43 0 .55
          -6 0 6 0 -.9" result="blueConnections" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="
          .5 0 0 0 .10
          0 .65 0 0 .24
          0 0 .43 0 .55
          -20 0 20 0 -1.1" result="cobaltMark" />
        <feImage href={markArea} preserveAspectRatio={`xMidYMid ${fit}`} result="markArea" />
        <feComposite in="cobaltMark" in2="markArea" operator="in" result="blueMark" />
        <feImage href={orbitArea} preserveAspectRatio={`xMidYMid ${fit}`} result="orbitArea" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="
          .04252 .14304 .01444 0 .08
          .08504 .28608 .02888 0 .30
          .05315 .17880 .01805 0 .75
          .85040 2.86080 .28880 0 -.24" result="orbitLight" />
        <feComposite in="orbitLight" in2="orbitArea" operator="in" result="blueOrbit" />
        <feComposite in="blueConnections" in2="blueOrbit" operator="over" result="blueMotion" />
        <feImage href={betweenTools} preserveAspectRatio={`xMidYMid ${fit}`} result="betweenTools" />
        <feComposite in="blueMotion" in2="betweenTools" operator="in" result="clearBlueMotion" />
        <feComposite in="clearBlueMotion" in2="silver" operator="over" result="connectedTools" />
        <feComposite in="blueMark" in2="connectedTools" operator="over" />
      </filter>)}</defs>
  </svg>;
}
