import type { BassString, Position } from "../music/bass";

// Semi-realistic na leeg ng bass: 4 na makapal na nickel strings, frets 1 hanggang 7.
// Bawat dot ay may numero kung pang-ilang chord ito sa kanta.

const NUT_X = 34;
const FRET_WIDTHS = [52, 49, 46, 44, 42, 40, 38];
const STRING_Y: Record<BassString, number> = { G: 22, D: 50, A: 78, E: 106 };
const STRING_WIDTH: Record<BassString, number> = { G: 2.6, D: 3.2, A: 3.8, E: 4.4 };
const INLAYS = [3, 5, 7];

function fretX(n: number): number {
  return NUT_X + FRET_WIDTHS.slice(0, n).reduce((a, b) => a + b, 0);
}

export type BassDot = Position & { labels: number[]; active: boolean };

export function BassNeck({ dots, label }: { dots: BassDot[]; label: string }) {
  const end = fretX(FRET_WIDTHS.length);
  return (
    <svg viewBox="0 0 360 146" role="img" aria-label={label} className="block h-auto w-full">
      <defs>
        <linearGradient id="bn-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6B4430" />
          <stop offset="0.45" stopColor="#5B3A29" />
          <stop offset="1" stopColor="#3E2618" />
        </linearGradient>
        <linearGradient id="bn-fret" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8E8E8E" />
          <stop offset="0.45" stopColor="#F4F4F4" />
          <stop offset="1" stopColor="#7A7A7A" />
        </linearGradient>
        <linearGradient id="bn-nut" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E9E1CC" />
          <stop offset="0.5" stopColor="#FFFBF0" />
          <stop offset="1" stopColor="#D8CFB6" />
        </linearGradient>
        <linearGradient id="bn-string" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F5F5F4" />
          <stop offset="0.5" stopColor="#8A93A2" />
          <stop offset="1" stopColor="#57534E" />
        </linearGradient>
        <radialGradient id="bn-pearl" cx="0.35" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor="#E7E2F0" />
          <stop offset="1" stopColor="#B9C8D4" />
        </radialGradient>
        <radialGradient id="bn-dot" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.6" stopColor="#E4E8EE" />
          <stop offset="1" stopColor="#A7B0BE" />
        </radialGradient>
        <radialGradient id="bn-dim" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#78716C" />
          <stop offset="1" stopColor="#292524" />
        </radialGradient>
        <filter id="bn-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.6" floodColor="#000" floodOpacity="0.55" />
        </filter>
      </defs>

      <rect x={NUT_X} y="8" width={end - NUT_X} height="112" fill="url(#bn-wood)" />
      <g stroke="#2A1810" strokeOpacity="0.35" fill="none" strokeWidth="0.8">
        <path d="M34 34 C110 31 200 37 345 33" />
        <path d="M34 64 C120 67 220 61 345 65" />
        <path d="M34 94 C140 97 230 91 345 95" />
      </g>
      {INLAYS.map((n) => (
        <circle key={n} cx={(fretX(n - 1) + fretX(n)) / 2} cy="64" r="6" fill="url(#bn-pearl)" />
      ))}
      {FRET_WIDTHS.map((_, i) => (
        <rect key={i} x={fretX(i + 1) - 1.8} y="8" width="3.6" height="112" fill="url(#bn-fret)" />
      ))}
      <rect x={NUT_X - 7} y="6" width="7" height="116" rx="1.5" fill="url(#bn-nut)" />

      {(Object.keys(STRING_Y) as BassString[]).map((s) => (
        <g key={s}>
          <path d={`M${NUT_X - 6} ${STRING_Y[s] + 3}H${end}`} stroke="#000" strokeOpacity="0.35" strokeWidth={STRING_WIDTH[s]} />
          <path d={`M${NUT_X - 6} ${STRING_Y[s]}H${end}`} stroke="url(#bn-string)" strokeWidth={STRING_WIDTH[s]} />
          <path d={`M${NUT_X - 6} ${STRING_Y[s]}H${end}`} stroke="#44403C" strokeOpacity="0.5" strokeDasharray="1 1.4" strokeWidth={STRING_WIDTH[s]} />
          <text x="5" y={STRING_Y[s] + 4} fontFamily="JetBrains Mono, monospace" fontSize="11" fontWeight="700" fill="#8A93A2" textAnchor="middle">{s}</text>
        </g>
      ))}

      {/* mga nota ng kanta; ang aktibo ay puti */}
      {[...dots].sort((a, b) => Number(a.active) - Number(b.active)).map((d) => {
        const cx = d.fret === 0 ? 22 : (fretX(d.fret - 1) + fretX(d.fret)) / 2;
        const y = STRING_Y[d.string];
        const text = d.labels.join("·");
        return (
          <g key={`${d.string}${d.fret}`} filter="url(#bn-shadow)">
            <rect x={cx - Math.max(11, text.length * 4 + 4)} y={y - 11} width={Math.max(22, text.length * 8 + 8)} height="22" rx="11" fill={d.active ? "url(#bn-dot)" : "url(#bn-dim)"} stroke={d.active ? "none" : "#8A93A2"} strokeWidth="1" />
            <text x={cx} y={y + 4} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="12" fontWeight="700" fill={d.active ? "#1C1917" : "#F5F5F4"}>
              {text}
            </text>
          </g>
        );
      })}

      <g fontFamily="Inter, sans-serif" fontSize="10" fill="#8A93A2" textAnchor="middle">
        {FRET_WIDTHS.map((_, i) => (
          <text key={i} x={(fretX(i) + fretX(i + 1)) / 2} y="138">{i + 1}</text>
        ))}
      </g>
    </svg>
  );
}
