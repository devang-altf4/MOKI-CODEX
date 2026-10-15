export default function Logo({ className = '', wordmark = true }: { className?: string; wordmark?: boolean }) {
  return <span className={`brand ${className}`}>
    <svg viewBox="0 0 438 349" aria-hidden="true" className="brand-mark">
      <polygon points="0,0 219,161 219,264 91,167 91,291 0,349" fill="currentColor" />
      <polygon points="438,0 219,161 219,264 347,167 347,291 438,349" fill="currentColor" opacity=".7" />
    </svg>
    {wordmark && <span className="brand-type">moki<span className="brand-systems">SYSTEMS</span></span>}
  </span>;
}
