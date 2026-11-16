import { useState } from "react";
import { bassNote, bassPosition, bassTab } from "../music/bass";
import type { Position } from "../music/bass";
import { songChords } from "../music/guitar";
import { BassNeck } from "./BassNeck";
import type { BassDot } from "./BassNeck";

function where(p: Position): string {
  return p.fret === 0 ? `${p.string} bukas` : `${p.string} · fret ${p.fret}`;
}

// Ang Bass tab: ang root (o slash bass) ng bawat chord, sa E at A string
export function BassPanel({ text }: { text: string }) {
  const steps = songChords(text)
    .map((chord) => {
      const note = bassNote(chord);
      return note ? { chord, note, pos: bassPosition(note) } : null;
    })
    .filter((s) => s !== null);
  const [selected, setSelected] = useState(0);
  const index = Math.min(selected, steps.length - 1);

  if (steps.length === 0) return <p className="text-stone-500">Walang chords ang kantang ito.</p>;

  // Pagsamahin ang mga chord na pareho ang posisyon sa leeg
  const dots: BassDot[] = [];
  steps.forEach((s, i) => {
    const existing = dots.find((d) => d.string === s.pos.string && d.fret === s.pos.fret);
    if (existing) {
      existing.labels.push(i + 1);
      existing.active ||= i === index;
    } else {
      dots.push({ ...s.pos, labels: [i + 1], active: i === index });
    }
  });

  const current = steps[index];
  const description = steps.map((s, i) => `${i + 1}: ${s.note}, ${where(s.pos)}`).join("; ");

  return (
    <div className="flex flex-col gap-3">
      <section aria-label="Leeg ng bass" className="rounded-2xl bg-stone-900 p-3 text-stone-50 shadow-lg shadow-stone-900/20 dark:bg-stone-950">
        <div className="flex items-baseline justify-between px-1.5">
          <div>
            <span className="font-mono text-2xl font-bold text-amber-400">{current.note}</span>
            <span className="ml-2 text-sm text-stone-400">
              para sa <strong className="font-mono text-stone-50">{current.chord}</strong> · {where(current.pos)}
            </span>
          </div>
          <span className="text-xs text-stone-400">{index + 1} / {steps.length}</span>
        </div>
        <div className="mt-2">
          <BassNeck dots={dots} label={`Bass line: ${description}`} />
        </div>
        <p className="px-1.5 text-xs text-stone-400">Sundan ang mga numero: iyan ang pagkakasunod ng chords sa kanta.</p>
      </section>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {steps.map((s, i) => (
          <button
            key={s.chord}
            type="button"
            onClick={() => setSelected(i)}
            aria-pressed={i === index}
            className={`rounded-xl bg-white px-1 py-2 text-center dark:bg-stone-900 ${i === index ? "border-2 border-amber-500" : "border border-stone-200 dark:border-stone-700"}`}
          >
            <span className="block text-[11px] text-stone-500">{i + 1} · {s.chord}</span>
            <span className={`block font-mono text-lg font-bold ${i === index ? "text-amber-700 dark:text-amber-400" : ""}`}>{s.note}</span>
            <span className="block text-[11px] text-stone-500">{where(s.pos)}</span>
          </button>
        ))}
      </div>

      <section aria-label="Tab" className="rounded-2xl bg-stone-900 p-4 text-stone-50 dark:bg-stone-950">
        <div className="flex justify-between text-xs">
          <span className="font-bold tracking-widest text-amber-400 uppercase">Tab</span>
          <span className="text-stone-400">2 beses bawat chord</span>
        </div>
        <pre className="mt-2 overflow-x-auto font-mono text-[13px] leading-relaxed text-stone-200">{bassTab(steps.map((s) => s.pos))}</pre>
      </section>
    </div>
  );
}
