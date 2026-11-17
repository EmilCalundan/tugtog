import { useState } from "react";
import { KEYS, suggestCapo, transposeChord } from "../music/transpose";
import { guitarShape } from "../music/guitar";
import { pianoVoicing } from "../music/piano";
import { bassPosition } from "../music/bass";
import { BEGINNER_CHORDS, buildChord, explainChord, strumSlots } from "../music/lessons";
import type { ChordKind } from "../music/lessons";
import { SONG_STYLES } from "../music/arrangement";
import type { SongStyle, TimeSignature } from "../music/arrangement";
import { useLessonSounds } from "../lib/useLessonSounds";
import { GuitarNeck } from "./GuitarNeck";
import { PianoKeyboard } from "./PianoKeyboard";
import { BassNeck } from "./BassNeck";
import { DrumsPanel } from "./DrumsPanel";
import { ui } from "./ui";

// Mga aralin sa Matuto tab. Ginagamit ang parehong leeg, keyboard at kit ng mga kanta.

const chipClass = (on: boolean) =>
  `h-10 shrink-0 rounded-full px-4 font-mono text-sm font-bold ${
    on ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900" : "border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
  }`;
const darkCard = "rounded-2xl bg-stone-900 p-3 text-stone-50 shadow-lg shadow-stone-900/20 dark:bg-stone-950";
const sectionTitle = "font-display text-xl font-bold";

function PlayButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-11 items-center gap-2 rounded-full bg-amber-500 px-4 font-bold text-stone-900 hover:bg-amber-400">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z" /></svg>
      {label}
    </button>
  );
}

function Chips<T extends string>({ items, value, onChange, label, render }: { items: readonly T[]; value: string; onChange: (v: T) => void; label: string; render?: (v: T) => string }) {
  return (
    <div role="radiogroup" aria-label={label} className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
      {items.map((item) => (
        <button key={item} type="button" role="radio" aria-checked={value === item} onClick={() => onChange(item)} className={chipClass(value === item)}>
          {render ? render(item) : item}
        </button>
      ))}
    </div>
  );
}

// 1. Basics: paano basahin ang chord, capo, at Nashville numbers
export function BasicsLesson() {
  const sounds = useLessonSounds();
  const examples = ["G", "Gm", "G7", "Gmaj7", "Gsus4", "G/B"] as const;
  const [chord, setChord] = useState<string>("G");
  const [typed, setTyped] = useState("");
  const [key, setKey] = useState("Bb");
  const e = explainChord(chord);
  const v = pianoVoicing(chord);
  const capo = suggestCapo(key);
  // Ang mga chord ng key: kinukuha mula sa key ng C, inilipat sa napiling key
  const numbers = [
    ["1", "C"], ["2m", "Dm"], ["3m", "Em"], ["4", "F"], ["5", "G"], ["6m", "Am"],
  ].map(([n, inC]) => ({ n, chord: transposeChord(inC, KEYS.indexOf(key), key) }));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Paano basahin ang isang chord</h2>
        <p className="text-stone-600 dark:text-stone-300">
          Ang unang letra ang <strong>root</strong>, ang pangunahing nota. Ang kasunod ang <strong>uri</strong> ng chord. Kapag may <code>/</code>, ang nasa likod nito ang pinakamababang nota (bass).
        </p>
        <Chips items={examples} value={chord} onChange={setChord} label="Halimbawang chord" />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (explainChord(typed.trim())) setChord(typed.trim());
          }}
          className="flex gap-2"
        >
          <label className="sr-only" htmlFor="chord-input">Mag-type ng chord</label>
          <input id="chord-input" placeholder="O mag-type, hal. F#m7" value={typed} onChange={(event) => setTyped(event.target.value)} className={`${ui.input} w-full font-mono`} />
          <button type="submit" className={ui.secondary}>Ipaliwanag</button>
        </form>
        {typed.trim() && !explainChord(typed.trim()) && <p className="text-sm text-red-700 dark:text-red-400">Hindi ito kilalang chord. Subukan ang hal. Am, D7 o Cmaj7.</p>}

        {e && (
          <div className={darkCard}>
            <div className="flex flex-wrap items-baseline gap-x-3 px-1.5">
              <span className="font-mono text-3xl font-bold text-amber-400">{chord}</span>
              <span className="text-stone-300">{e.root} {e.name}{e.bass && `, bass sa ${e.bass}`}</span>
            </div>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 px-1.5 text-sm">
              <dt className="text-stone-400">Formula</dt><dd className="font-mono">{e.formula}</dd>
              <dt className="text-stone-400">Mga nota</dt><dd className="font-mono">{e.tones.join(" – ")}</dd>
              <dt className="text-stone-400">Tunog</dt><dd>{e.feel}</dd>
            </dl>
            <div className="mt-3 overflow-hidden rounded-lg">
              <PianoKeyboard left={v.left} right={v.right} label={chord} />
            </div>
            <div className="mt-3 px-1.5"><PlayButton onClick={() => sounds.piano(chord)} label="Pakinggan" /></div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Capo: madadaling hugis sa mahirap na key</h2>
        <p className="text-stone-600 dark:text-stone-300">
          Ang capo ay parang bagong "nut" sa gitara. Itinataas nito ang tono, kaya puwede mong gamitin ang madadaling hugis (C, G, D, A, E) sa ibang key.
        </p>
        <label className="flex items-center gap-3 text-sm font-semibold">
          Key ng kanta
          <select value={key} onChange={(event) => setKey(event.target.value)} className={`${ui.input} w-24 font-mono font-bold`}>
            {KEYS.map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>
        <p className="rounded-2xl bg-amber-50 p-4 font-semibold text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          {capo.capo === 0
            ? `Ang ${key} ay may madali nang hugis. Walang capo na kailangan.`
            : `Key ng ${key}: ilagay ang capo sa fret ${capo.capo}, at tugtugin ang mga hugis ng ${capo.shape}.`}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Nashville numbers</h2>
        <p className="text-stone-600 dark:text-stone-300">
          Imbes na pangalan ng chord, numero ang gamit: 1 ang key mismo, 4 at 5 ang madalas na kasunod, at 6m ang malungkot na kapatid ng 1. Kapag numero ang alam ng banda, kahit anong key ay kaya.
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {numbers.map(({ n, chord: c }) => (
            <div key={n} className={`${ui.card} p-3 text-center`}>
              <div className="font-mono text-xl font-bold text-amber-700 dark:text-amber-400">{n}</div>
              <div className="font-mono font-semibold">{c}</div>
            </div>
          ))}
        </div>
        <p className={ui.muted}>Halimbawa: ang "1 – 5 – 6m – 4" sa key ng {key} ay {numbers[0].chord} – {numbers[4].chord} – {numbers[5].chord} – {numbers[3].chord}.</p>
      </section>
    </div>
  );
}

// 2. Gitara: mga unang chord, at mga strum pattern
export function GuitarLesson() {
  const sounds = useLessonSounds();
  const [chord, setChord] = useState("Em");
  const shape = guitarShape(chord);
  const patterns: { style: SongStyle; time: TimeSignature; label: string }[] = [
    ...SONG_STYLES.map((s) => ({ style: s.id, time: "4/4" as const, label: s.label })),
    { style: "ballad", time: "6/8", label: "Ballad" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Ang unang 8 chord</h2>
        <p className="text-stone-600 dark:text-stone-300">
          Simulan sa Em at G, tapos isa-isahin pakanan. Sa walong ito, kaya mo na ang karamihan ng worship at OPM na kanta, lalo na kapag may capo.
        </p>
        <Chips items={BEGINNER_CHORDS} value={chord} onChange={setChord} label="Chord" render={(c) => `${BEGINNER_CHORDS.indexOf(c) + 1}. ${c}`} />
        {shape && (
          <div className={darkCard}>
            <div className="px-1.5 font-mono text-3xl font-bold text-amber-400">{chord}</div>
            <div className="mt-2"><GuitarNeck shape={shape} label={chord} /></div>
            <p className="mt-1 px-1.5 text-sm text-stone-300">Diinan gamit ang dulo ng daliri, malapit sa fret (hindi sa gitna). Patunugin ang bawat string isa-isa para malaman kung may namamatay.</p>
            <div className="mt-3 px-1.5"><PlayButton onClick={() => sounds.strum(chord)} label="Pakinggan" /></div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Mga strum pattern</h2>
        <p className="text-stone-600 dark:text-stone-300">
          Laging gumagalaw pataas-pababa ang kamay, kahit walang tinatamaan (·). Ang <strong>x</strong> ay maikling "chuck": idikit agad ang palad sa strings.
        </p>
        <ul className="flex flex-col gap-2">
          {patterns.map((p) => {
            const slots = strumSlots(p.style, p.time);
            return (
              <li key={p.label + p.time} className={`${ui.card} flex flex-col gap-2 p-3`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{p.label} <span className="font-normal text-stone-500">· {p.time}</span></span>
                  <button type="button" onClick={() => sounds.pattern(chord, p.style, p.time)} className="text-sm font-bold text-amber-700 hover:underline dark:text-amber-400">
                    ▶ Pakinggan sa {chord}
                  </button>
                </div>
                <div className="grid gap-0.5 text-center font-mono" style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}>
                  {slots.map((s, i) => (
                    <div key={i} className={`text-xl font-bold ${s.stroke === "·" ? "text-stone-300 dark:text-stone-600" : i === 0 ? "text-amber-700 dark:text-amber-400" : ""}`}>{s.stroke}</div>
                  ))}
                  {slots.map((s, i) => (
                    <div key={`c${i}`} className={`text-[11px] ${s.count === "&" ? "text-stone-400" : "text-stone-600 dark:text-stone-300"}`}>{s.count}</div>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

// 3. Piano: buuin ang chord sa kahit anong key
export function PianoLesson() {
  const sounds = useLessonSounds();
  const [root, setRoot] = useState("C");
  const [kind, setKind] = useState<ChordKind>("major");
  const chord = buildChord(root, kind);
  const e = explainChord(chord);
  const v = pianoVoicing(chord);
  const kinds: ChordKind[] = ["major", "minor", "seventh"];
  const kindLabel: Record<ChordKind, string> = { major: "Major", minor: "Minor", seventh: "7" };

  return (
    <div className="flex flex-col gap-4">
      <h2 className={sectionTitle}>Buuin ang chord: 1 – 3 – 5</h2>
      <p className="text-stone-600 dark:text-stone-300">
        Bilangin ang mga puti at itim na key mula sa root. <strong>Major</strong>: root, 4 na hakbang pataas, tapos 3 pa. <strong>Minor</strong>: root, 3 hakbang, tapos 4. Ang kaliwang kamay ang tumutugtog ng root sa ibaba.
      </p>
      <Chips items={KEYS} value={root} onChange={setRoot} label="Root" />
      <Chips items={kinds} value={kind} onChange={setKind} label="Uri" render={(k) => kindLabel[k]} />
      {e && (
        <div className={darkCard}>
          <div className="flex flex-wrap items-baseline gap-x-3 px-1.5">
            <span className="font-mono text-3xl font-bold text-amber-400">{chord}</span>
            <span className="font-mono text-stone-300">{e.formula} = {e.tones.join(" ")}</span>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg"><PianoKeyboard left={v.left} right={v.right} label={chord} /></div>
          <div className="mt-3 px-1.5"><PlayButton onClick={() => sounds.piano(chord)} label="Pakinggan" /></div>
        </div>
      )}
    </div>
  );
}

// 4. Bass: mga nota sa E at A string
export function BassLesson() {
  const sounds = useLessonSounds();
  const [note, setNote] = useState("A");
  const pos = bassPosition(note);
  return (
    <div className="flex flex-col gap-4">
      <h2 className={sectionTitle}>Hanapin ang root sa E at A string</h2>
      <p className="text-stone-600 dark:text-stone-300">
        Sa simula, sapat na ang <strong>root</strong> ng bawat chord sa beat 1. Halos lahat ng nota ay makikita sa unang 5 fret ng E at A string, kaya doon muna magsanay.
      </p>
      <Chips items={KEYS} value={note} onChange={setNote} label="Nota" />
      <div className={darkCard}>
        <div className="px-1.5">
          <span className="font-mono text-3xl font-bold text-amber-400">{note}</span>
          <span className="ml-2 text-stone-300">{pos.fret === 0 ? `bukas na ${pos.string} string` : `${pos.string} string, fret ${pos.fret}`}</span>
        </div>
        <div className="mt-2"><BassNeck dots={[{ ...pos, labels: [1], active: true }]} label={`${note}: ${pos.string} string, fret ${pos.fret}`} /></div>
        <div className="mt-3 px-1.5"><PlayButton onClick={() => sounds.bass(note)} label="Pakinggan" /></div>
      </div>
    </div>
  );
}

// 5. Drums: ang groove ng bawat bahagi ng kanta
export function DrumsLesson() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className={sectionTitle}>Ang groove ng bawat bahagi</h2>
      <p className="text-stone-600 dark:text-stone-300">
        Iisa ang basic na beat: kick sa 1 at 3, snare sa 2 at 4, hi-hat sa bawat &. Ang nagbabago ay kung gaano kalakas ang bawat bahagi. Pumili ng bahagi at pindutin ang ▶; bagalan muna ang tempo.
      </p>
      <DrumsPanel text={"[Intro]\n[Verse]\n[Pre-chorus]\n[Chorus]\n[Bridge]\n[Outro]"} initialBpm={60} />
    </div>
  );
}
