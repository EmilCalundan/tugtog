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
    on ? "knob" : "border border-white/12 bg-white/[0.06] text-stone-200 hover:bg-white/10"
  }`;
const darkCard = "glass rounded-[28px] p-4 text-stone-50";
const sectionTitle = "font-display text-xl font-medium";

function PlayButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="knob inline-flex h-11 items-center gap-2 rounded-full px-5 font-semibold">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z" /></svg>
      {label}
    </button>
  );
}

function Chips<T extends string>({ items, value, onChange, label, render }: { items: readonly T[]; value: string; onChange: (v: T) => void; label: string; render?: (v: T) => string }) {
  return (
    <div role="radiogroup" aria-label={label} className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
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
        <h2 className={sectionTitle}>How to read a chord</h2>
        <p className="text-stone-300">
          The first letter is the <strong>root</strong>, the main note. What follows is the chord <strong>type</strong>. When there is a <code>/</code>, the note after it is the lowest note (the bass).
        </p>
        <Chips items={examples} value={chord} onChange={setChord} label="Example chord" />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (explainChord(typed.trim())) setChord(typed.trim());
          }}
          className="flex gap-2"
        >
          <label className="sr-only" htmlFor="chord-input">Type a chord</label>
          <input id="chord-input" placeholder="Or type one, e.g. F#m7" value={typed} onChange={(event) => setTyped(event.target.value)} className={`${ui.input} w-full font-mono`} />
          <button type="submit" className={ui.secondary}>Explain</button>
        </form>
        {typed.trim() && !explainChord(typed.trim()) && <p className="text-sm text-red-400">That is not a chord we know. Try Am, D7 or Cmaj7.</p>}

        {e && (
          <div className={darkCard}>
            <div className="flex flex-wrap items-baseline gap-x-3 px-1.5">
              <span className="font-digit text-3xl text-stone-50">{chord}</span>
              <span className="text-stone-300">{e.root} {e.name}{e.bass && `, bass on ${e.bass}`}</span>
            </div>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 px-1.5 text-sm">
              <dt className="text-stone-400">Formula</dt><dd className="font-mono">{e.formula}</dd>
              <dt className="text-stone-400">Notes</dt><dd className="font-mono">{e.tones.join(" – ")}</dd>
              <dt className="text-stone-400">Sound</dt><dd>{e.feel}</dd>
            </dl>
            <div className="mt-3 overflow-hidden rounded-lg">
              <PianoKeyboard left={v.left} right={v.right} label={chord} />
            </div>
            <div className="mt-3 px-1.5"><PlayButton onClick={() => sounds.piano(chord)} label="Listen" /></div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Capo: easy shapes in a hard key</h2>
        <p className="text-stone-300">
          A capo is like a new "nut" on the guitar. It raises the pitch, so you can use the easy shapes (C, G, D, A, E) in other keys.
        </p>
        <label className="flex items-center gap-3 text-sm font-medium">
          Song key
          <select value={key} onChange={(event) => setKey(event.target.value)} className={`${ui.input} w-24 font-digit text-sm`}>
            {KEYS.map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>
        <p className="glass rounded-[24px] p-4 font-medium text-stone-50">
          {capo.capo === 0
            ? `${key} already has an easy shape. No capo needed.`
            : `Key of ${key}: put the capo on fret ${capo.capo}, and play the ${capo.shape} shapes.`}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Nashville numbers</h2>
        <p className="text-stone-300">
          Instead of chord names, use numbers: 1 is the key itself, 4 and 5 often come next, and 6m is the sad sibling of 1. When the band knows the numbers, any key works.
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {numbers.map(({ n, chord: c }) => (
            <div key={n} className={`${ui.card} p-3 text-center`}>
              <div className="font-digit text-xl text-stone-50">{n}</div>
              <div className="font-mono font-semibold text-stone-300">{c}</div>
            </div>
          ))}
        </div>
        <p className={ui.muted}>Example: "1 – 5 – 6m – 4" in the key of {key} is {numbers[0].chord} – {numbers[4].chord} – {numbers[5].chord} – {numbers[3].chord}.</p>
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
        <h2 className={sectionTitle}>Your first 8 chords</h2>
        <p className="text-stone-300">
          Start with Em and G, then work your way right. With these eight you can play most worship and OPM songs, especially with a capo.
        </p>
        <Chips items={BEGINNER_CHORDS} value={chord} onChange={setChord} label="Chord" render={(c) => `${BEGINNER_CHORDS.indexOf(c) + 1}. ${c}`} />
        {shape && (
          <div className={darkCard}>
            <div className="px-1.5 font-digit text-3xl text-stone-50">{chord}</div>
            <div className="mt-2"><GuitarNeck shape={shape} label={chord} /></div>
            <p className="mt-1 px-1.5 text-sm text-stone-300">Press with your fingertips, close to the fret (not in the middle). Play each string one by one to hear if any is muted.</p>
            <div className="mt-3 px-1.5"><PlayButton onClick={() => sounds.strum(chord)} label="Listen" /></div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Strum patterns</h2>
        <p className="text-stone-300">
          Your hand keeps moving up and down, even when it doesn't hit (·). An <strong>x</strong> is a short "chuck": rest your palm on the strings right away.
        </p>
        <ul className="flex flex-col gap-2">
          {patterns.map((p) => {
            const slots = strumSlots(p.style, p.time);
            return (
              <li key={p.label + p.time} className={`${ui.card} flex flex-col gap-2 p-3`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{p.label} <span className="font-normal text-stone-400">· {p.time}</span></span>
                  <button type="button" onClick={() => sounds.pattern(chord, p.style, p.time)} className="rounded-full border border-white/15 px-3 py-1.5 text-sm font-medium text-stone-50 hover:bg-white/10">
                    ▶ Listen in {chord}
                  </button>
                </div>
                <div className="grid gap-0.5 text-center font-mono" style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}>
                  {slots.map((s, i) => (
                    <div key={i} className={`text-xl font-bold ${s.stroke === "·" ? "text-stone-600" : i === 0 ? "text-stone-50" : "text-stone-200"}`}>{s.stroke}</div>
                  ))}
                  {slots.map((s, i) => (
                    <div key={`c${i}`} className={`text-[11px] ${s.count === "&" ? "text-stone-500" : "text-stone-300"}`}>{s.count}</div>
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
      <h2 className={sectionTitle}>Build a chord: 1 – 3 – 5</h2>
      <p className="text-stone-300">
        Count the white and black keys up from the root. <strong>Major</strong>: root, 4 steps up, then 3 more. <strong>Minor</strong>: root, 3 steps, then 4. The left hand plays the root down low.
      </p>
      <Chips items={KEYS} value={root} onChange={setRoot} label="Root" />
      <Chips items={kinds} value={kind} onChange={setKind} label="Type" render={(k) => kindLabel[k]} />
      {e && (
        <div className={darkCard}>
          <div className="flex flex-wrap items-baseline gap-x-3 px-1.5">
            <span className="font-digit text-3xl text-stone-50">{chord}</span>
            <span className="font-mono text-stone-300">{e.formula} = {e.tones.join(" ")}</span>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg"><PianoKeyboard left={v.left} right={v.right} label={chord} /></div>
          <div className="mt-3 px-1.5"><PlayButton onClick={() => sounds.piano(chord)} label="Listen" /></div>
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
      <h2 className={sectionTitle}>Find the root on the E and A strings</h2>
      <p className="text-stone-300">
        At first, the <strong>root</strong> of each chord on beat 1 is enough. Almost every note is in the first 5 frets of the E and A strings, so practice there first.
      </p>
      <Chips items={KEYS} value={note} onChange={setNote} label="Note" />
      <div className={darkCard}>
        <div className="px-1.5">
          <span className="font-digit text-3xl text-stone-50">{note}</span>
          <span className="ml-2 text-stone-300">{pos.fret === 0 ? `open ${pos.string} string` : `${pos.string} string, fret ${pos.fret}`}</span>
        </div>
        <div className="mt-2"><BassNeck dots={[{ ...pos, labels: [1], active: true }]} label={`${note}: ${pos.string} string, fret ${pos.fret}`} /></div>
        <div className="mt-3 px-1.5"><PlayButton onClick={() => sounds.bass(note)} label="Listen" /></div>
      </div>
    </div>
  );
}

// 5. Drums: ang groove ng bawat bahagi ng kanta
export function DrumsLesson() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className={sectionTitle}>The groove for each part</h2>
      <p className="text-stone-300">
        The basic beat stays the same: kick on 1 and 3, snare on 2 and 4, hi-hat on every &. What changes is how big each part feels. Pick a part and press ▶; slow the tempo down first.
      </p>
      <DrumsPanel text={"[Intro]\n[Verse]\n[Pre-chorus]\n[Chorus]\n[Bridge]\n[Outro]"} initialBpm={60} />
    </div>
  );
}
