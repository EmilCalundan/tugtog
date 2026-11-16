import { useState } from "react";
import { pianoVoicing } from "../music/piano";
import { songChords } from "../music/guitar";
import { PianoKeyboard } from "./PianoKeyboard";

// Ang Piano tab: ang voicing ng bawat chord, kaliwa at kanang kamay
export function PianoPanel({ text }: { text: string }) {
  const chords = songChords(text);
  const [selected, setSelected] = useState(0);
  const index = Math.min(selected, chords.length - 1);

  if (chords.length === 0) return <p className="text-stone-500">Walang chords ang kantang ito.</p>;

  const chord = chords[index];
  const voicing = pianoVoicing(chord);
  const names = (notes: { name: string }[]) => notes.map((n) => n.name).join(" ");

  return (
    <div className="flex flex-col gap-3">
      <section aria-label="Keyboard" className="rounded-2xl bg-stone-900 p-3 text-stone-50 shadow-lg shadow-stone-900/20 dark:bg-stone-950">
        <div className="flex items-baseline justify-between px-1.5">
          <span className="font-mono text-2xl font-bold text-amber-400">{chord}</span>
          <span className="text-xs text-stone-400">{index + 1} / {chords.length}</span>
        </div>
        <div className="mt-2 overflow-hidden rounded-lg">
          <PianoKeyboard left={voicing.left} right={voicing.right} label={chord} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-1.5 text-xs text-stone-300">
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-stone-500" />Kaliwang kamay <strong className="font-mono text-stone-50">{names(voicing.left)}</strong></span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-amber-500" />Kanang kamay <strong className="font-mono text-stone-50">{names(voicing.right)}</strong></span>
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
                className={`grid w-full grid-cols-[64px_minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-left dark:bg-stone-900 ${i === index ? "border-2 border-amber-500" : "border border-stone-200 dark:border-stone-700"}`}
              >
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{name}</span>
                <span className="text-sm text-stone-500">LH <strong className="font-mono text-stone-900 dark:text-stone-100">{names(v.left)}</strong></span>
                <span className="text-sm text-stone-500">RH <strong className="font-mono text-stone-900 dark:text-stone-100">{names(v.right)}</strong></span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
