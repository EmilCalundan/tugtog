import { useState } from "react";
import { guitarShape, songChords } from "../music/guitar";
import { GuitarNeck } from "./GuitarNeck";

// Ang Gitara tab: lahat ng chord sa kanta, at ang hugis ng napiling chord sa leeg ng gitara
export function GuitarPanel({ text, shapeText, capo }: { text: string; shapeText: string; capo: { capo: number; shape: string } }) {
  const [useCapo, setUseCapo] = useState(capo.capo > 0);
  const [selected, setSelected] = useState(0);

  const withCapo = useCapo && capo.capo > 0;
  const sounding = songChords(text);
  const shapes = withCapo ? songChords(shapeText) : sounding;
  const index = Math.min(selected, shapes.length - 1);

  if (shapes.length === 0) {
    return <p className="text-stone-500">Walang chords ang kantang ito.</p>;
  }

  const chord = shapes[index];
  const shape = guitarShape(chord);

  return (
    <div className="flex flex-col gap-3">
      {capo.capo > 0 && (
        <div role="radiogroup" aria-label="Paraan ng pagtugtog" className="flex rounded-xl bg-stone-100 p-1 dark:bg-stone-800">
          {[true, false].map((on) => (
            <button
              key={String(on)}
              type="button"
              role="radio"
              aria-checked={useCapo === on}
              onClick={() => setUseCapo(on)}
              className={`h-10 flex-1 rounded-lg text-sm font-semibold ${useCapo === on ? "bg-white shadow-sm dark:bg-stone-900" : "text-stone-500"}`}
            >
              {on ? `Capo ${capo.capo} · madali` : "Walang capo"}
            </button>
          ))}
        </div>
      )}

      <section aria-label="Leeg ng gitara" className="rounded-2xl bg-stone-900 p-3 text-stone-50 shadow-lg shadow-stone-900/20 dark:bg-stone-950">
        <div className="flex items-baseline justify-between px-1.5">
          <div>
            <span className="font-mono text-2xl font-bold text-amber-400">{sounding[index] ?? chord}</span>
            {withCapo && (
              <span className="ml-2 text-sm text-stone-400">
                tinutugtog bilang <strong className="font-mono text-stone-50">{chord}</strong>
              </span>
            )}
          </div>
          <span className="text-xs text-stone-400">{index + 1} / {shapes.length}</span>
        </div>
        <div className="mt-2">
          {shape ? (
            <GuitarNeck shape={shape} capo={withCapo ? capo.capo : 0} label={chord} />
          ) : (
            <p className="p-6 text-center text-stone-400">Wala pang hugis para sa {chord}.</p>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 px-1.5 text-xs text-stone-300">
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-amber-500" />Daliri (1 = hintuturo)</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full border-2 border-amber-400" />Bukas</span>
          <span className="flex items-center gap-1.5"><span className="font-mono font-bold text-red-400">×</span>Huwag patunugin</span>
        </div>
      </section>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {shapes.map((name, i) => (
          <button
            key={name + i}
            type="button"
            onClick={() => setSelected(i)}
            aria-pressed={i === index}
            className={`rounded-xl border bg-white px-1 py-2.5 text-center dark:bg-stone-900 ${i === index ? "border-2 border-amber-500" : "border-stone-200 dark:border-stone-700"}`}
          >
            <span className={`block font-mono text-base font-bold ${i === index ? "text-amber-700 dark:text-amber-400" : ""}`}>{sounding[i] ?? name}</span>
            {withCapo && <span className="block text-[11px] text-stone-500">hugis {name}</span>}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setSelected(Math.max(0, index - 1))} disabled={index === 0} aria-label="Nakaraang chord" className="h-11 w-11 rounded-xl border border-stone-200 bg-white text-lg disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900">‹</button>
        <button type="button" onClick={() => setSelected(Math.min(shapes.length - 1, index + 1))} disabled={index === shapes.length - 1} aria-label="Susunod na chord" className="h-11 w-11 rounded-xl border border-stone-200 bg-white text-lg disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900">›</button>
        <p className="text-sm text-stone-500">Pindutin ang chord para makita ang hugis.</p>
      </div>
    </div>
  );
}
