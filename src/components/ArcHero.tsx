import type { KeyboardEvent, ReactNode } from "react";

export type ArcItem = {
  label: string; // maliit na label, hal. "BAR 2" o "SONG 1"
  value: string; // ang malaki, hal. "E/G#" o "A"
  active?: boolean;
  ariaLabel: string;
  onSelect?: () => void;
};

const CX = 195;

function point(cx: number, cy: number, r: number, deg: number) {
  const t = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(t), cy + r * Math.sin(t)].map((n) => n.toFixed(1));
}

// Isang segment ng arko (annular sector), mula sa anggulong a1 pababa sa a2
function segmentPath(cy: number, r1: number, r2: number, a1: number, a2: number) {
  const [x1, y1] = point(CX, cy, r2, a1);
  const [x2, y2] = point(CX, cy, r2, a2);
  const [x3, y3] = point(CX, cy, r1, a2);
  const [x4, y4] = point(CX, cy, r1, a1);
  return `M${x1} ${y1} A${r2} ${r2} 0 0 0 ${x2} ${y2} L${x3} ${y3} A${r1} ${r1} 0 0 1 ${x4} ${y4} Z`;
}

// Madilim na acoustic guitar na may ilaw sa gilid: ang "bida" ng eksena
function Guitar({ x, y, scale, rotate }: { x: number; y: number; scale: number; rotate: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} aria-hidden="true">
      <ellipse cx="0" cy="250" rx="150" ry="22" fill="#000" opacity=".55" filter="url(#arc-blur)" />
      <rect x="-15" y="-250" width="30" height="230" rx="6" fill="url(#arc-neck)" />
      <g stroke="#7D8695" strokeWidth="2" opacity=".7">
        {[-220, -186, -154, -124, -96, -70, -46].map((fy) => <path key={fy} d={`M-15 ${fy}h30`} />)}
      </g>
      <rect x="-24" y="-300" width="48" height="58" rx="12" fill="#1A1E25" stroke="rgba(220,230,245,.35)" />
      <g fill="#8A93A2">
        {[-288, -270, -252].map((py) => <circle key={`l${py}`} cx="-31" cy={py} r="5" />)}
        {[-288, -270, -252].map((py) => <circle key={`r${py}`} cx="31" cy={py} r="5" />)}
      </g>
      <g fill="url(#arc-body)">
        <circle cx="0" cy="40" r="92" />
        <circle cx="0" cy="160" r="118" />
        <rect x="-78" y="40" width="156" height="120" />
      </g>
      <g fill="none" stroke="url(#arc-rim)" strokeWidth="3">
        <circle cx="0" cy="40" r="92" />
        <circle cx="0" cy="160" r="118" />
      </g>
      <circle cx="0" cy="78" r="34" fill="#050608" />
      <circle cx="0" cy="78" r="42" fill="none" stroke="#5C6573" strokeWidth="3" strokeDasharray="2 3" />
      <rect x="-44" y="196" width="88" height="16" rx="6" fill="#0A0C10" stroke="rgba(220,230,245,.25)" />
      <g stroke="#C9D2DF" strokeWidth="1.1" opacity=".75">
        {[-10, -6, -2, 2, 6, 10].map((sx) => <path key={sx} d={`M${sx} -246V204`} />)}
      </g>
    </g>
  );
}

type Props = {
  items: ArcItem[];
  title: string; // para sa screen reader
  height?: number;
  centerY?: number;
  guitar?: { y: number; scale: number; rotate: number; opacity: number } | null;
  children?: ReactNode; // nasa gitna ng arko, hal. ang NOW chord
};

// Ang eksena ng v4: instrumento sa dilim, at isang arko ng glass na segment sa paligid nito.
// Puti ang segment na "ngayon"; puwedeng pindutin ang bawat segment.
export function ArcHero({ items, title, height = 430, centerY = 220, guitar, children }: Props) {
  const r1 = 120;
  const r2 = 172;
  const from = 170;
  const to = 10;
  const gap = 2.6;
  const span = (from - to) / Math.max(items.length, 1);

  function onKey(event: KeyboardEvent, item: ArcItem) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      item.onSelect?.();
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      <svg viewBox={`0 0 390 ${height}`} className="block h-auto w-full" role="group" aria-label={title}>
        <defs>
          <linearGradient id="arc-seg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3B424E" stopOpacity=".85" />
            <stop offset="1" stopColor="#1C2028" stopOpacity=".9" />
          </linearGradient>
          <linearGradient id="arc-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3A3F48" />
            <stop offset=".5" stopColor="#1B1F26" />
            <stop offset="1" stopColor="#0C0E12" />
          </linearGradient>
          <linearGradient id="arc-rim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset=".7" stopColor="#FFFFFF" stopOpacity=".05" />
            <stop offset="1" stopColor="#DCE6F5" stopOpacity=".75" />
          </linearGradient>
          <linearGradient id="arc-neck" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#16191F" />
            <stop offset="1" stopColor="#3C424C" />
          </linearGradient>
          <filter id="arc-blur"><feGaussianBlur stdDeviation="8" /></filter>
        </defs>

        {guitar && (
          <g opacity={guitar.opacity}>
            <Guitar x={CX + 5} y={guitar.y} scale={guitar.scale} rotate={guitar.rotate} />
          </g>
        )}

        {items.map((item, i) => {
          const a1 = from - i * span - gap / 2;
          const a2 = from - (i + 1) * span + gap / 2;
          const mid = (a1 + a2) / 2;
          const [x, y] = point(CX, centerY, (r1 + r2) / 2, mid);
          const small = item.value.length > 5;
          return (
            <g
              key={i}
              className="arc-seg"
              role={item.onSelect ? "button" : undefined}
              tabIndex={item.onSelect ? 0 : undefined}
              aria-label={item.ariaLabel}
              aria-current={item.active ? "true" : undefined}
              onClick={item.onSelect}
              onKeyDown={(e) => onKey(e, item)}
              style={{ cursor: item.onSelect ? "pointer" : undefined }}
            >
              <path
                d={segmentPath(centerY, r1, r2, a1, a2)}
                fill={item.active ? "#E9ECF1" : "url(#arc-seg)"}
                stroke={item.active ? "#FFFFFF" : "rgba(255,255,255,.16)"}
                strokeWidth="1"
                strokeLinejoin="round"
                style={item.active ? { filter: "drop-shadow(0 0 10px rgba(255,255,255,.35))" } : undefined}
              />
              <g transform={`translate(${x} ${y}) rotate(${(mid - 90).toFixed(1)})`} textAnchor="middle" fontFamily="Inter, sans-serif" pointerEvents="none">
                <text y="-6" fontSize="9" fontWeight="500" letterSpacing=".5" fill={item.active ? "#3A404B" : "#9AA3B2"}>{item.label}</text>
                <text y="12" fontSize={small ? 12 : 15} fontWeight="600" fill={item.active ? "#0B0E13" : "#F2F4F7"}>{item.value}</text>
              </g>
            </g>
          );
        })}
      </svg>
      {children && (
        <div className="pointer-events-none absolute inset-x-0 flex flex-col items-center text-center" style={{ top: `${((centerY - 92) / height) * 100}%` }}>
          {children}
        </div>
      )}
    </div>
  );
}
