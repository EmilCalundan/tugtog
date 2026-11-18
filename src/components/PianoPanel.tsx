import { useState } from "react";
import { pianoVoicing } from "../music/piano";
import { songChords } from "../music/guitar";
import { PianoKeyboard } from "./PianoKeyboard";

// Ang Piano tab: ang voicing ng bawat chord, kaliwa at kanang kamay
export function PianoPanel({ text, current }: { text: string; current?: string }) {
  const chords = songChords(text);
  const [selected, setSelected] = useState(0);
  const playingIndex = current ? chords.indexOf(current) : -1;
  const index = playingIndex >= 0 ? playingIndex : Math.min(selected, chords.length - 1);

  if (chords.length === 0) return <p className="text-stone-400">This song has no chords.</p>;

  const chord = chords[index];
  const voicing = pianoVoicing(chord);
  const names = (notes: { name: string }[]) => notes.map((n) => n.name).join(" ");

  return (
    <div className="flex flex-col gap-3">
      <section aria-label="Keyboard" className="glass rounded-[28px] p-4 text-stone-50">
        <div className="flex items-baseline justify-between px-1.5">
          <span className="font-digit text-2xl text-stone-50">{chord}</span>
          <span className="text-xs text-stone-400">{index + 1} / {chords.length}</span>
        </div>
        <div className="mt-2 overflow-hidden rounded-lg">
          <PianoKeyboard left={voicing.left} right={voicing.right} label={chord} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-1.5 text-xs text-stone-300">
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-stone-500" />Left hand <strong className="font-mono text-stone-50">{names(voicing.left)}</strong></span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-white" />Right hand <strong className="font-mono text-stone-50">{names(voicing.right)}</strong></span>
        </div>
      </section>

      <ul className="flex flex-col gap-1.5">
        {chords.map((name, i) => {
          const v = pianoVoicing(name);
          return (
            <li key={name}>
              <button
                type="button"
                onClick={() => setSelected(i)}
                aria-pressed={i === index}
                className={`grid w-full grid-cols-[64px_minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-2 rounded-2xl px-4 py-2.5 text-left ${i === index ? "border border-white/60 bg-white/15" : "border border-white/10 bg-white/[0.04] hover:bg-white/10"}`}
              >
                <span className="font-mono font-bold text-stone-50">{name}</span>
                <span className="text-sm text-stone-400">LH <strong className="font-mono text-stone-100">{names(v.left)}</strong></span>
                <span className="text-sm text-stone-400">RH <strong className="font-mono text-stone-100">{names(v.right)}</strong></span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
