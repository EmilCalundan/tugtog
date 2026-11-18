import { neckWindow } from "../music/guitar";
import type { Shape } from "../music/guitar";

// Semi-realistic na leeg ng gitara: kahoy, pilak na frets, bronze na strings.
// Nasa itaas ang high e, gaya ng tab.

const NUT_X = 34;
const FRET_WIDTHS = [70, 66, 63, 60, 57]; // paliit nang paliit, gaya ng totoong gitara
const STRING_Y = [122, 102, 82, 62, 42, 22]; // low E hanggang high e
const STRING_NAMES = ["E", "A", "D", "G", "B", "e"];
const STRING_WIDTH = [3.3, 2.8, 2.3, 1.9, 1.4, 1.1];
const INLAYS = [3, 5, 7, 9, 15, 17];

function fretX(n: number): number {
  return NUT_X + FRET_WIDTHS.slice(0, n).reduce((a, b) => a + b, 0);
}

export function GuitarNeck({ shape, capo = 0, label }: { shape: Shape; capo?: number; label: string }) {
  // Kapag may capo, ang frets ng shape ay bibilangin mula sa capo
  const frets = shape.frets.map((f) => (f === null ? null : f + capo));
  const start = neckWindow(frets, capo);
  const end = start + FRET_WIDTHS.length;
  const fingersText = frets
    .map((f, i) => (f === null ? `${STRING_NAMES[i]} muted` : f === capo ? `${STRING_NAMES[i]} open` : `${STRING_NAMES[i]} fret ${f}`))
    .join(", ");

  return (
    <svg viewBox="0 0 360 170" role="img" aria-label={`${label}: ${fingersText}`} className="block h-auto w-full">
      <defs>
        <linearGradient id="gn-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6B4430" />
          <stop offset="0.45" stopColor="#5B3A29" />
          <stop offset="1" stopColor="#3E2618" />
        </linearGradient>
        <linearGradient id="gn-fret" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8E8E8E" />
          <stop offset="0.45" stopColor="#F4F4F4" />
          <stop offset="1" stopColor="#7A7A7A" />
        </linearGradient>
        <linearGradient id="gn-nut" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E9E1CC" />
          <stop offset="0.5" stopColor="#FFFBF0" />
          <stop offset="1" stopColor="#D8CFB6" />
        </linearGradient>
        <linearGradient id="gn-plain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#9CA3AF" />
        </linearGradient>
        <radialGradient id="gn-pearl" cx="0.35" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor="#E7E2F0" />
          <stop offset="1" stopColor="#B9C8D4" />
        </radialGradient>
        <radialGradient id="gn-dot" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.6" stopColor="#E4E8EE" />
          <stop offset="1" stopColor="#A7B0BE" />
        </radialGradient>
        <linearGradient id="gn-capo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#111111" />
          <stop offset="0.5" stopColor="#3F3F46" />
          <stop offset="1" stopColor="#0A0A0A" />
        </linearGradient>
        <filter id="gn-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.6" floodColor="#000" floodOpacity="0.55" />
        </filter>
      </defs>

      {/* fingerboard */}
      <rect x={NUT_X} y="10" width={fretX(5) - NUT_X} height="124" fill="url(#gn-wood)" />
      <g stroke="#2A1810" strokeOpacity="0.35" fill="none" strokeWidth="0.8">
        <path d="M34 30 C110 27 200 33 354 29" />
        <path d="M34 54 C120 57 220 51 354 55" />
        <path d="M34 92 C140 95 230 89 354 93" />
        <path d="M34 116 C100 113 260 119 354 115" />
      </g>

      {/* inlays */}
      {INLAYS.filter((n) => n > start && n <= end).map((n) => (
        <circle key={n} cx={(fretX(n - start - 1) + fretX(n - start)) / 2} cy="72" r="6" fill="url(#gn-pearl)" />
      ))}
      {start < 12 && 12 <= end && (
        <g fill="url(#gn-pearl)">
          <circle cx={(fretX(11 - start) + fretX(12 - start)) / 2} cy="52" r="5" />
          <circle cx={(fretX(11 - start) + fretX(12 - start)) / 2} cy="92" r="5" />
        </g>
      )}

      {/* frets */}
      {FRET_WIDTHS.map((_, i) => (
        <rect key={i} x={fretX(i + 1) - 1.7} y="10" width="3.4" height="124" fill="url(#gn-fret)" />
      ))}

      {/* nut, kapag nagsisimula sa unang fret */}
      {start === 0 && <rect x={NUT_X - 7} y="8" width="7" height="128" rx="1.5" fill="url(#gn-nut)" />}

      {/* strings */}
      {STRING_Y.map((y, i) => (
        <g key={i}>
          <path d={`M${NUT_X - 6} ${y + 2.5}H354`} stroke="#000" strokeOpacity="0.35" strokeWidth={STRING_WIDTH[i]} />
          <path d={`M${NUT_X - 6} ${y}H354`} stroke={i >= 4 ? "url(#gn-plain)" : "#C9A15A"} strokeWidth={STRING_WIDTH[i]} />
          {i < 4 && <path d={`M${NUT_X - 6} ${y}H354`} stroke="#5A3E14" strokeOpacity="0.55" strokeDasharray="0.8 1.2" strokeWidth={STRING_WIDTH[i]} />}
        </g>
      ))}

      {/* capo, nasa kaliwang gilid ng window */}
      {capo > 0 && (
        <g filter="url(#gn-shadow)">
          <rect x={NUT_X - 10} y="2" width="12" height="140" rx="5" fill="url(#gn-capo)" />
          <rect x={NUT_X - 8} y="6" width="2" height="132" rx="1" fill="#FFF" fillOpacity="0.18" />
        </g>
      )}

      {/* barre */}
      {shape.barre !== undefined && shape.barre > 0 && (() => {
        const fret = shape.barre + capo;
        const strings = frets.map((f, i) => (f === fret && shape.fingers[i] === 1 ? i : -1)).filter((i) => i >= 0);
        if (strings.length < 2) return null;
        const cx = (fretX(fret - start - 1) + fretX(fret - start)) / 2;
        return (
          <rect x={cx - 9} y={STRING_Y[Math.max(...strings)] - 9} width="18" height={STRING_Y[Math.min(...strings)] - STRING_Y[Math.max(...strings)] + 18} rx="9" fill="url(#gn-dot)" filter="url(#gn-shadow)" />
        );
      })()}

      {/* mga daliri, bukas, at hindi patutunugin */}
      {frets.map((f, i) => {
        const y = STRING_Y[i];
        if (f === null) {
          return (
            <text key={i} x="22" y={y + 4} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="12" fontWeight="700" fill="#8A93A2">
              ×
            </text>
          );
        }
        if (f === capo) {
          return <circle key={i} cx="20" cy={y} r="5" fill="none" stroke="#DDE2E8" strokeWidth="1.8" />;
        }
        const cx = (fretX(f - start - 1) + fretX(f - start)) / 2;
        return (
          <g key={i} filter="url(#gn-shadow)">
            <circle cx={cx} cy={y} r="10.5" fill="url(#gn-dot)" />
            {shape.fingers[i] > 0 && (
              <text x={cx} y={y + 4} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="12" fontWeight="700" fill="#1C1917">
                {shape.fingers[i]}
              </text>
            )}
          </g>
        );
      })}

      {/* string names at numero ng fret */}
      <g fontFamily="JetBrains Mono, monospace" fontSize="10" fontWeight="700" fill="#8A93A2" textAnchor="middle">
        {STRING_Y.map((y, i) => (
          <text key={i} x="8" y={y + 3}>{STRING_NAMES[i]}</text>
        ))}
      </g>
      <g fontFamily="Inter, sans-serif" fontSize="10" fill="#8A93A2" textAnchor="middle">
        {FRET_WIDTHS.map((_, i) => (
          <text key={i} x={(fretX(i) + fretX(i + 1)) / 2} y="158">{start + i + 1}</text>
        ))}
      </g>
      {capo > 0 && (
        <text x={NUT_X - 4} y="158" fontFamily="Inter, sans-serif" fontSize="9" fontWeight="700" fill="#FFFFFF" textAnchor="middle">CAPO</text>
      )}
    </svg>
  );
}
