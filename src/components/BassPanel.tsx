import { useState } from "react";
import { bassNote, bassPosition, bassTab } from "../music/bass";
import type { Position } from "../music/bass";
import { songChords } from "../music/guitar";
import { BassNeck } from "./BassNeck";
import type { BassDot } from "./BassNeck";

function where(p: Position): string {
  return p.fret === 0 ? `${p.string} open` : `${p.string} · fret ${p.fret}`;
}

// Ang Bass tab: ang root (o slash bass) ng bawat chord, sa E at A string
export function BassPanel({ text, current }: { text: string; current?: string }) {
  const steps = songChords(text)
    .map((chord) => {
      const note = bassNote(chord);
      return note ? { chord, note, pos: bassPosition(note) } : null;
    })
    .filter((s) => s !== null);
  const [selected, setSelected] = useState(0);
  const playingIndex = current ? steps.findIndex((s) => s.chord === current) : -1;
  const index = playingIndex >= 0 ? playingIndex : Math.min(selected, steps.length - 1);

  if (steps.length === 0) return <p className="text-stone-400">This song has no chords.</p>;

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

  const step = steps[index];
  const description = steps.map((s, i) => `${i + 1}: ${s.note}, ${where(s.pos)}`).join("; ");

  return (
    <div className="flex flex-col gap-3">
      <section aria-label="Bass neck" className="glass rounded-[28px] p-4 text-stone-50">
        <div className="flex items-baseline justify-between px-1.5">
          <div>
            <span className="font-digit text-2xl text-stone-50">{step.note}</span>
            <span className="ml-2 text-sm text-stone-400">
              for <strong className="font-mono text-stone-50">{step.chord}</strong> · {where(step.pos)}
            </span>
          </div>
          <span className="text-xs text-stone-400">{index + 1} / {steps.length}</span>
        </div>
        <div className="mt-2">
          <BassNeck dots={dots} label={`Bass line: ${description}`} />
        </div>
        <p className="px-1.5 text-xs text-stone-400">Follow the numbers: that is the order of chords in the song.</p>
      </section>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {steps.map((s, i) => (
          <button
            key={s.chord}
            type="button"
            onClick={() => setSelected(i)}
            aria-pressed={i === index}
            className={`rounded-2xl px-1 py-2 text-center ${i === index ? "knob border border-white" : "border border-white/12 bg-white/[0.05] hover:bg-white/10"}`}
          >
            <span className={`block text-[11px] ${i === index ? "text-stone-600" : "text-stone-400"}`}>{i + 1} · {s.chord}</span>
            <span className="block font-mono text-lg font-bold">{s.note}</span>
            <span className={`block text-[11px] ${i === index ? "text-stone-600" : "text-stone-400"}`}>{where(s.pos)}</span>
          </button>
        ))}
      </div>

      <section aria-label="Tab" className="glass rounded-[28px] p-4 text-stone-50">
        <div className="flex justify-between text-xs">
          <span className="font-medium tracking-widest text-stone-300 uppercase">Tab</span>
          <span className="text-stone-400">2 times per chord</span>
        </div>
        <pre className="mt-2 overflow-x-auto font-mono text-[13px] leading-relaxed text-stone-200">{bassTab(steps.map((s) => s.pos))}</pre>
      </section>
    </div>
  );
}
