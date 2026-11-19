import type { StrumSlot } from "../music/lessons";

// Ang strum pattern bilang hanay ng palaso, may bilang sa ilalim (1 & 2 & ...)
export function StrumView({ slots, label }: { slots: StrumSlot[]; label: string }) {
  return (
    <div role="img" aria-label={label} className="grid gap-0.5 text-center font-mono" style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}>
      {slots.map((s, i) => (
        <div key={i} aria-hidden="true" className={`text-xl font-bold ${s.stroke === "·" ? "text-stone-600" : "text-stone-50"}`}>{s.stroke}</div>
      ))}
      {slots.map((s, i) => (
        <div key={`c${i}`} aria-hidden="true" className={`text-[11px] ${s.count === "&" ? "text-stone-500" : "text-stone-300"}`}>{s.count}</div>
      ))}
    </div>
  );
}

// Para sa screen reader: "down, rest, down, up..."
export function strumWords(slots: StrumSlot[]): string {
  const word = { "↓": "down", "↑": "up", x: "chuck", "·": "rest" } as const;
  return slots.map((s) => word[s.stroke]).join(", ");
}
