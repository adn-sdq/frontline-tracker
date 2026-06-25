/**
 * LoginArt — a crystalline geometric composition in the FIT brand palette
 * (vivid blue, brand orange, navy, deep maroon). Pure SVG, scales as a
 * cover image via preserveAspectRatio="slice".
 */
export function LoginArt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 600 800"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Abstract geometric artwork"
    >
      <defs>
        <linearGradient id="la-blue" x1="0" y1="0" x2="220" y2="800" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2059e0" />
          <stop offset="0.55" stopColor="#2c3aa6" />
          <stop offset="1" stopColor="#272c78" />
        </linearGradient>
        <linearGradient id="la-orange1" x1="0" y1="700" x2="600" y2="300" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ef7a3e" />
          <stop offset="1" stopColor="#d8492c" />
        </linearGradient>
        <linearGradient id="la-orange2" x1="0" y1="860" x2="560" y2="450" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff9152" />
          <stop offset="1" stopColor="#ef6a39" />
        </linearGradient>
        <linearGradient id="la-purple" x1="0" y1="120" x2="520" y2="560" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5a2c6e" />
          <stop offset="1" stopColor="#7a1f48" />
        </linearGradient>
        <linearGradient id="la-navy" x1="380" y1="80" x2="600" y2="620" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#16314c" />
          <stop offset="1" stopColor="#0c2036" />
        </linearGradient>
        <linearGradient id="la-navy2" x1="120" y1="720" x2="650" y2="470" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#14304a" />
          <stop offset="1" stopColor="#0e2740" />
        </linearGradient>
        <linearGradient id="la-maroon" x1="-60" y1="640" x2="300" y2="850" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5a1730" />
          <stop offset="1" stopColor="#2a0c20" />
        </linearGradient>
      </defs>

      {/* Base sky */}
      <rect x="0" y="0" width="600" height="800" fill="url(#la-blue)" />

      {/* Faint sky sheen */}
      <polygon points="0,0 600,0 600,120 0,260" fill="#ffffff" opacity="0.05" />

      {/* Purple translucent plane (upper-left) */}
      <polygon points="-60,170 380,80 520,470 -60,560" fill="url(#la-purple)" opacity="0.55" />

      {/* Navy facet (right) */}
      <polygon points="380,80 600,130 600,580 360,640" fill="url(#la-navy)" opacity="0.7" />

      {/* Small navy facet (mid) */}
      <polygon points="300,470 470,400 520,520 360,600" fill="url(#la-navy)" opacity="0.45" />

      {/* Dominant orange band */}
      <polygon points="-40,600 430,330 620,470 150,740" fill="url(#la-orange1)" opacity="0.94" />

      {/* Navy shadow band crossing the orange */}
      <polygon points="150,740 560,470 650,560 240,800" fill="url(#la-navy2)" opacity="0.5" />

      {/* Lighter orange band (lower) */}
      <polygon points="-40,810 360,560 470,650 60,910" fill="url(#la-orange2)" opacity="0.85" />

      {/* Deep maroon (lower-left) */}
      <polygon points="-60,650 210,560 300,840 -60,860" fill="url(#la-maroon)" opacity="0.6" />

      {/* Bright orange highlight edges */}
      <polygon points="425,332 437,330 626,468 614,470" fill="#ff8a4d" opacity="0.85" />
      <polygon points="378,82 392,80 522,468 510,470" fill="#ff8a4d" opacity="0.3" />
      <polygon points="-40,600 -40,612 612,470 620,470" fill="#ffffff" opacity="0.06" />
    </svg>
  )
}
