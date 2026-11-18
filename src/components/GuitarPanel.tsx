import { useState } from "react";
import { guitarShape, songChords } from "../music/guitar";
import { GuitarNeck } from "./GuitarNeck";
import { ui } from "./ui";

// Ang Gitara tab: lahat ng chord sa kanta, at ang hugis ng napiling chord sa leeg ng gitara
// `current`: ang chord na tumutunog ngayon (habang naka-play), para sumunod ang leeg
export function GuitarPanel({ text, shapeText, capo, current }: { text: string; shapeText: string; capo: { capo: number; shape: string }; current?: string }) {
  const [useCapo, setUseCapo] = useState(capo.capo > 0);
  const [selected, setSelected] = useState(0);

  const withCapo = useCapo && capo.capo > 0;
  const sounding = songChords(text);
  const shapes = withCapo ? songChords(shapeText) : sounding;
  const playingIndex = current ? sounding.indexOf(current) : -1;
  const index = playingIndex >= 0 ? playingIndex : Math.min(selected, shapes.length - 1);

  if (shapes.length === 0) {
    return <p className="text-stone-400">This song has no chords.</p>;
  }

  const chord = shapes[index];
  const shape = guitarShape(chord);

  return (
    <div className="flex flex-col gap-3">
      {capo.capo > 0 && (
        <div role="radiogroup" aria-label="How to play" className="glass flex rounded-full p-1">
          {[true, false].map((on) => (
            <button
              key={String(on)}
              type="button"
              role="radio"
              aria-checked={useCapo === on}
              onClick={() => setUseCapo(on)}
              className={`h-10 flex-1 rounded-full text-sm font-medium ${useCapo === on ? "knob" : "text-stone-400"}`}
            >
              {on ? `Capo ${capo.capo} · easy` : "No capo"}
            </button>
          ))}
        </div>
      )}

      <section aria-label="Guitar neck" className="glass rounded-[28px] p-4 text-stone-50">
        <div className="flex items-baseline justify-between px-1.5">
          <div>
            <span className="font-digit text-2xl text-stone-50">{sounding[index] ?? chord}</span>
            {withCapo && (
              <span className="ml-2 text-sm text-stone-400">
                played as <strong className="font-mono text-stone-50">{chord}</strong>
              </span>
            )}
          </div>
          <span className="text-xs text-stone-400">{index + 1} / {shapes.length}</span>
        </div>
        <div className="mt-2">
          {shape ? (
            <GuitarNeck shape={shape} capo={withCapo ? capo.capo : 0} label={chord} />
          ) : (
            <p className="p-6 text-center text-stone-400">No shape yet for {chord}.</p>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 px-1.5 text-xs text-stone-300">
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-white" />Finger (1 = index)</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full border-2 border-stone-300" />Open</span>
          <span className="flex items-center gap-1.5"><span className="font-mono font-bold text-stone-400">×</span>Don't play</span>
        </div>
      </section>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {shapes.map((name, i) => (
          <button
            key={name + i}
            type="button"
            onClick={() => setSelected(i)}
            aria-pressed={i === index}
            className={`rounded-2xl border px-1 py-2.5 text-center ${i === index ? "knob border-white" : "border-white/12 bg-white/[0.05] hover:bg-white/10"}`}
          >
            <span className="block font-mono text-base font-bold">{sounding[i] ?? name}</span>
            {withCapo && <span className={`block text-[11px] ${i === index ? "text-stone-600" : "text-stone-400"}`}>shape {name}</span>}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setSelected(Math.max(0, index - 1))} disabled={index === 0} aria-label="Previous chord" className={`${ui.iconButton} text-lg`}>‹</button>
        <button type="button" onClick={() => setSelected(Math.min(shapes.length - 1, index + 1))} disabled={index === shapes.length - 1} aria-label="Next chord" className={`${ui.iconButton} text-lg`}>›</button>
        <p className="text-sm text-stone-400">Tap a chord to see its shape.</p>
      </div>
    </div>
  );
}
