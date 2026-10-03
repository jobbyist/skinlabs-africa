/**
 * Decorative intro artwork for the Advanced AI Dermatology Analysis: an
 * abstract face in profile, skin layers being read by a scan line, and the
 * Monk Skin Tone swatch row. Brand gradient + currentColor only, so it works in
 * light and dark mode with no image request.
 */
const MST_HEX = ["#f6ede4", "#f3e7db", "#f7ead0", "#eadaba", "#d7bd96", "#a07e56", "#825c43", "#604134", "#3a312a", "#292420"];

const AdvancedIntroIllustration = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 320 220" className={className} role="presentation" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="adv-intro-brand" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="35%" stopColor="#3b82f6" />
        <stop offset="70%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
      <linearGradient id="adv-intro-scan" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
        <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="adv-intro-glow" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
      </radialGradient>
    </defs>

    <ellipse cx="160" cy="100" rx="150" ry="100" fill="url(#adv-intro-glow)" />

    {/* Face in profile */}
    <path
      d="M118 40c30-14 66-4 78 26 6 15 4 26 12 38 5 7-2 11-8 12 2 6 1 11-5 13 3 6-1 12-10 12-6 0-10 4-10 12v27H95v-30c-18-12-27-32-22-56 4-22 23-44 45-54z"
      fill="currentColor"
      className="text-muted"
    />
    <path
      d="M118 40c30-14 66-4 78 26 6 15 4 26 12 38 5 7-2 11-8 12 2 6 1 11-5 13 3 6-1 12-10 12-6 0-10 4-10 12v27H95v-30c-18-12-27-32-22-56 4-22 23-44 45-54z"
      fill="none"
      stroke="url(#adv-intro-brand)"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />

    {/* Scan band */}
    <rect x="70" y="78" width="150" height="34" fill="url(#adv-intro-scan)" />
    <line x1="64" y1="95" x2="226" y2="95" stroke="url(#adv-intro-brand)" strokeWidth="2" strokeLinecap="round" />

    {/* Skin-layer card */}
    <g transform="translate(222 46)">
      <rect width="84" height="84" rx="16" fill="currentColor" className="text-background" />
      <rect width="84" height="84" rx="16" fill="none" stroke="currentColor" strokeOpacity="0.15" className="text-foreground" />
      <rect x="12" y="16" width="60" height="10" rx="5" fill="#f9a8d4" opacity="0.8" />
      <rect x="12" y="33" width="60" height="10" rx="5" fill="#c4b5fd" opacity="0.8" />
      <rect x="12" y="50" width="60" height="10" rx="5" fill="#93c5fd" opacity="0.8" />
      <circle cx="62" cy="21" r="3" fill="currentColor" className="text-background" />
      <circle cx="40" cy="38" r="3" fill="currentColor" className="text-background" />
      <circle cx="24" cy="55" r="3" fill="currentColor" className="text-background" />
      <rect x="12" y="67" width="34" height="5" rx="2.5" fill="currentColor" opacity="0.2" className="text-foreground" />
    </g>

    {/* Sun / UV marker */}
    <g transform="translate(36 40)" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
      <circle r="9" fill="#fde68a" />
      <line x1="0" y1="-16" x2="0" y2="-13" />
      <line x1="0" y1="13" x2="0" y2="16" />
      <line x1="-16" y1="0" x2="-13" y2="0" />
      <line x1="13" y1="0" x2="16" y2="0" />
    </g>

    {/* Monk Skin Tone row */}
    <g transform="translate(60 192)">
      {MST_HEX.map((hex, i) => (
        <circle key={hex} cx={i * 22} cy="0" r="8" fill={hex} stroke="currentColor" strokeOpacity="0.15" className="text-foreground" />
      ))}
    </g>
  </svg>
);

export default AdvancedIntroIllustration;
