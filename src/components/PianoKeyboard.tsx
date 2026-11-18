import type { Note } from "../music/piano";

// Semi-realistic na keyboard: dalawang octave, C3 hanggang B4.
// Kaliwang kamay = abo, kanang kamay = amber.

const LOW = 48;
const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];
const BLACK_AFTER: Record<number, number> = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 }; // pitch class → puting key sa kaliwa nito
const KEY_W = 25;
const TOP = 10;
const WHITE_H = 112;
const BLACK_H = 70;

type Hand = "left" | "right";

export function PianoKeyboard({ left, right, label }: { left: Note[]; right: Note[]; label: string }) {
  const pressed = new Map<number, { hand: Hand; name: string }>();
  left.forEach((n) => pressed.set(n.midi, { hand: "left", name: n.name }));
  right.forEach((n) => pressed.set(n.midi, { hand: "right", name: n.name }));

  const whites: { midi: number; x: number }[] = [];
  const blacks: { midi: number; x: number }[] = [];
  for (let midi = LOW; midi < LOW + 24; midi++) {
    const pc = midi % 12;
    const octave = Math.floor((midi - LOW) / 12);
    if (WHITE_PCS.includes(pc)) whites.push({ midi, x: (octave * 7 + WHITE_PCS.indexOf(pc)) * KEY_W });
    else blacks.push({ midi, x: (octave * 7 + BLACK_AFTER[pc] + 1) * KEY_W - 8 });
  }

  const description = `${label}. Left hand: ${left.map((n) => n.name).join(", ")}. Right hand: ${right.map((n) => n.name).join(", ")}.`;

  return (
    <svg viewBox={`0 0 ${KEY_W * 14} ${TOP + WHITE_H + 4}`} role="img" aria-label={description} className="block h-auto w-full">
      <defs>
        <linearGradient id="pk-white" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E7E5E0" />
          <stop offset="0.12" stopColor="#FFFFFF" />
          <stop offset="0.92" stopColor="#F7F6F2" />
          <stop offset="1" stopColor="#D6D3CC" />
        </linearGradient>
        <linearGradient id="pk-black" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0A0A0A" />
          <stop offset="0.5" stopColor="#2E2B29" />
          <stop offset="1" stopColor="#0A0A0A" />
        </linearGradient>
        <linearGradient id="pk-black-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4A4643" />
          <stop offset="1" stopColor="#1C1917" />
        </linearGradient>
        <linearGradient id="pk-right" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9DB4D3" />
          <stop offset="0.7" stopColor="#B9CBE3" />
          <stop offset="1" stopColor="#7F97B8" />
        </linearGradient>
        <linearGradient id="pk-left" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#57534E" />
          <stop offset="0.7" stopColor="#78716C" />
          <stop offset="1" stopColor="#44403C" />
        </linearGradient>
        <linearGradient id="pk-felt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7F1D1D" />
          <stop offset="1" stopColor="#450A0A" />
        </linearGradient>
      </defs>

      {/* puting keys */}
      {whites.map(({ midi, x }) => {
        const p = pressed.get(midi);
        return (
          <g key={midi}>
            <rect x={x + 0.5} y={TOP} width={KEY_W - 1} height={p ? WHITE_H - 2 : WHITE_H} rx="3" fill={p ? `url(#pk-${p.hand})` : "url(#pk-white)"} stroke="#A8A29E" strokeWidth="0.8" />
            {!p && midi % 12 === 0 && (
              <text x={x + KEY_W / 2} y={TOP + WHITE_H - 8} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8" fill="#A8A29E">
                C{Math.floor(midi / 12) - 1}
              </text>
            )}
            {p && (
              <text x={x + KEY_W / 2} y={TOP + WHITE_H - 10} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fontWeight="700" fill={p.hand === "left" ? "#FFFFFF" : "#1C1917"}>
                {p.name}
              </text>
            )}
          </g>
        );
      })}

      {/* itim na keys */}
      {blacks.map(({ midi, x }) => {
        const p = pressed.get(midi);
        return (
          <g key={midi}>
            <rect x={x + 1} y={TOP} width="16" height={BLACK_H + 3} rx="2" fill="#000" fillOpacity="0.35" />
            <rect x={x} y={TOP} width="16" height={p ? BLACK_H - 2 : BLACK_H} rx="2" fill={p ? `url(#pk-${p.hand})` : "url(#pk-black)"} />
            {!p && <rect x={x + 2.5} y={TOP + BLACK_H - 12} width="11" height="9" rx="1.5" fill="url(#pk-black-top)" />}
            {p && (
              <text x={x + 8} y={TOP + BLACK_H - 8} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill={p.hand === "left" ? "#FFFFFF" : "#1C1917"}>
                {p.name}
              </text>
            )}
          </g>
        );
      })}

      {/* pulang felt at anino sa itaas ng keys */}
      <rect x="0" y="0" width={KEY_W * 14} height={TOP} fill="#1C1917" />
      <rect x="0" y={TOP - 3} width={KEY_W * 14} height="3" fill="url(#pk-felt)" />
      <rect x="0" y={TOP} width={KEY_W * 14} height="4" fill="#000" fillOpacity="0.18" />
    </svg>
  );
}
