import type { Lane } from "../music/drums";

// Semi-realistic na drum kit mula sa itaas: bronze na cymbals, pulang shells, chrome na rims.
// Umiilaw ang tinatamaan. R = kanang kamay, L = kaliwang kamay, P = kanang paa.

const GLOW: Record<Lane, { cx: number; cy: number; r: number }> = {
  crash: { cx: 85, cy: 58, r: 54 },
  ride: { cx: 282, cy: 64, r: 56 },
  hihat: { cx: 48, cy: 150, r: 44 },
  snare: { cx: 122, cy: 168, r: 50 },
  kick: { cx: 189, cy: 170, r: 52 },
};

const RINGS = (cx: number, cy: number, from: number, to: number) =>
  Array.from({ length: Math.floor((from - to) / 5) + 1 }, (_, i) => <circle key={i} cx={cx} cy={cy} r={from - i * 5} />);

function Marker({ x, y, color, letter, on }: { x: number; y: number; color: string; letter: string; on: boolean }) {
  return (
    <g opacity={on ? 1 : 0.55}>
      <circle cx={x} cy={y} r={on ? 16 : 14} fill={color} stroke="#FFFFFF" strokeWidth="3" />
      <text x={x} y={y + 5} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="14" fontWeight="700" fill="#FFFFFF">{letter}</text>
    </g>
  );
}

export function DrumKit({ hits, hand }: { hits: Set<Lane>; hand: "hihat" | "ride" }) {
  const rightOn = hits.has(hand) || hits.has("crash");
  const right = hits.has("crash") ? { x: 98, y: 72 } : hand === "ride" ? { x: 268, y: 78 } : { x: 58, y: 140 };

  return (
    <svg viewBox="0 0 340 236" role="img" aria-label={`Drum kit from above. Right hand on the ${hand === "ride" ? "ride" : "hi-hat"}, left hand on the snare, right foot on the kick.`} className="block h-auto w-full">
      <defs>
        <radialGradient id="dk-cym" cx="0.45" cy="0.42" r="0.6">
          <stop offset="0" stopColor="#F6DB9A" />
          <stop offset="0.25" stopColor="#E2B866" />
          <stop offset="0.7" stopColor="#C08A35" />
          <stop offset="1" stopColor="#8A5F1E" />
        </radialGradient>
        <radialGradient id="dk-bell" cx="0.4" cy="0.38" r="0.7">
          <stop offset="0" stopColor="#FFF0C4" />
          <stop offset="1" stopColor="#C99A45" />
        </radialGradient>
        <radialGradient id="dk-head" cx="0.42" cy="0.38" r="0.7">
          <stop offset="0" stopColor="#FFFFFC" />
          <stop offset="0.7" stopColor="#F1EDE2" />
          <stop offset="1" stopColor="#DCD5C4" />
        </radialGradient>
        <linearGradient id="dk-chrome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.35" stopColor="#9CA3AF" />
          <stop offset="0.6" stopColor="#F3F4F6" />
          <stop offset="1" stopColor="#6B7280" />
        </linearGradient>
        <radialGradient id="dk-shell" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.82" stopColor="#7F1D1D" />
          <stop offset="0.92" stopColor="#B91C1C" />
          <stop offset="1" stopColor="#450A0A" />
        </radialGradient>
        <linearGradient id="dk-kick" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#450A0A" />
          <stop offset="0.3" stopColor="#B91C1C" />
          <stop offset="0.55" stopColor="#DC2626" />
          <stop offset="1" stopColor="#5B0F0F" />
        </linearGradient>
        <pattern id="dk-sparkle" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="2" r="0.6" fill="#FECACA" fillOpacity="0.7" />
          <circle cx="5" cy="5.5" r="0.45" fill="#FFFFFF" fillOpacity="0.6" />
        </pattern>
        <radialGradient id="dk-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="1" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
        <filter id="dk-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.55" />
        </filter>
      </defs>

      <ellipse cx="170" cy="130" rx="168" ry="104" fill="#5B2A1C" fillOpacity="0.35" />

      {/* ilaw sa likod ng tinatamaan */}
      {[...hits].map((l) => <circle key={l} {...GLOW[l]} fill="url(#dk-glow)" />)}

      {/* kick */}
      <g filter="url(#dk-shadow)">
        <rect x="158" y="126" width="62" height="86" rx="6" fill="url(#dk-kick)" />
        <rect x="158" y="126" width="62" height="86" rx="6" fill="url(#dk-sparkle)" />
        <rect x="155" y="124" width="68" height="7" rx="3" fill="url(#dk-chrome)" />
        <rect x="155" y="207" width="68" height="7" rx="3" fill="url(#dk-chrome)" />
      </g>

      {/* floor tom at rack toms */}
      <g filter="url(#dk-shadow)">
        <circle cx="272" cy="168" r="41" fill="url(#dk-shell)" />
        <circle cx="272" cy="168" r="36.5" fill="none" stroke="url(#dk-chrome)" strokeWidth="3" />
        <circle cx="272" cy="168" r="35" fill="url(#dk-head)" />
        <circle cx="150" cy="96" r="30" fill="url(#dk-shell)" />
        <circle cx="150" cy="96" r="26.5" fill="none" stroke="url(#dk-chrome)" strokeWidth="2.5" />
        <circle cx="150" cy="96" r="25" fill="url(#dk-head)" />
        <circle cx="218" cy="92" r="32" fill="url(#dk-shell)" />
        <circle cx="218" cy="92" r="28.5" fill="none" stroke="url(#dk-chrome)" strokeWidth="2.5" />
        <circle cx="218" cy="92" r="27" fill="url(#dk-head)" />
      </g>

      {/* snare na chrome */}
      <g filter="url(#dk-shadow)">
        <circle cx="122" cy="168" r="37" fill="url(#dk-chrome)" />
        <circle cx="122" cy="168" r="33.5" fill="url(#dk-head)" />
        {hits.has("snare") && <circle cx="122" cy="168" r="12" fill="#FFFFFF" fillOpacity="0.45" />}
      </g>

      {/* cymbals */}
      <g filter="url(#dk-shadow)">
        <circle cx="85" cy="58" r="43" fill="url(#dk-cym)" />
        <circle cx="282" cy="64" r="46" fill="url(#dk-cym)" />
        <circle cx="48" cy="150" r="34" fill="url(#dk-cym)" />
      </g>
      <g fill="none" stroke="#5B3A12" strokeOpacity="0.18" strokeWidth="0.7">
        {RINGS(85, 58, 38, 18)}
        {RINGS(282, 64, 41, 21)}
        {RINGS(48, 150, 30, 15)}
      </g>
      <g fill="url(#dk-bell)">
        <circle cx="85" cy="58" r="10" />
        <circle cx="282" cy="64" r="11" />
        <circle cx="48" cy="150" r="8" />
      </g>
      <g fill="#1C1917">
        <circle cx="85" cy="58" r="2.2" />
        <circle cx="282" cy="64" r="2.2" />
        <circle cx="48" cy="150" r="2" />
      </g>

      <g fontFamily="Inter, sans-serif" fontSize="11" fill="#D6D3D1" textAnchor="middle">
        <text x="85" y="114">Crash</text>
        <text x="282" y="124">Ride</text>
        <text x="48" y="198">Hi-hat</text>
        <text x="122" y="222">Snare</text>
        <text x="189" y="230">Kick</text>
        <text x="272" y="224">Floor tom</text>
      </g>

      <Marker {...right} color="#C2410C" letter="R" on={rightOn} />
      <Marker x={112} y={166} color="#1D4ED8" letter="L" on={hits.has("snare")} />
      <Marker x={189} y={188} color="#15803D" letter="F" on={hits.has("kick")} />
    </svg>
  );
}
