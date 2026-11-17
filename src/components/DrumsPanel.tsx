import { useEffect, useRef, useState } from "react";
import { STYLES, countLabels, groove, sectionKind, songSections, stepSeconds, tapTempo } from "../music/drums";
import type { Kind, Lane, Style } from "../music/drums";
import { DrumSounds } from "../lib/drumSounds";
import { DrumKit } from "./DrumKit";

const LANE_INFO: Record<Lane, { label: string; letter: string; color: string }> = {
  crash: { label: "Crash", letter: "R", color: "text-orange-700 dark:text-orange-400" },
  ride: { label: "Ride", letter: "R", color: "text-orange-700 dark:text-orange-400" },
  hihat: { label: "Hi-hat", letter: "R", color: "text-orange-700 dark:text-orange-400" },
  snare: { label: "Snare", letter: "L", color: "text-blue-700 dark:text-blue-400" },
  kick: { label: "Kick", letter: "●", color: "text-green-700 dark:text-green-400" },
};
const LANE_ORDER: Lane[] = ["crash", "ride", "hihat", "snare", "kick"];
const KIND_TIPS: Record<Kind, string> = {
  intro: "Intro: magaan muna. Hi-hat sa bawat beat at kick sa 1, walang snare.",
  verse: "Verse: hi-hat ang kanang kamay, snare ang kaliwa, kick ang paa.",
  prechorus: "Pre-chorus: parang verse, pero may dagdag na kick sa dulo papunta sa chorus.",
  chorus: "Chorus: lumipat sa ride, at crash sa unang beat.",
  bridge: "Bridge: crash pagpasok, ride, at kick sa bawat beat para may build-up.",
  outro: "Outro: bumabagal ang pakiramdam. Hi-hat sa bawat beat at kick sa 1.",
};

// Ang Drums tab: groove para sa bawat bahagi ng kanta, may tunog at tempo
// Nagsisimula sa style at tempo ng kanta, pero puwedeng palitan habang nag-eensayo
export function DrumsPanel({ text, initialStyle = "ballad", initialBpm = 72 }: { text: string; initialStyle?: Style; initialBpm?: number }) {
  const sections = songSections(text);
  const [style, setStyle] = useState<Style>(initialStyle);
  const [section, setSection] = useState(sections[0] ?? "Verse");
  const [bpm, setBpm] = useState(initialBpm);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);

  const kind = sectionKind(section);
  const g = groove(style, kind);
  const counts = countLabels(g.steps);
  const lanes = LANE_ORDER.filter((l) => g.lanes[l]);
  const current = step % g.steps;
  const hits = new Set(lanes.filter((l) => g.lanes[l]![current]));
  const beat = g.steps === 16 ? Math.floor(current / 4) + 1 : current + 1;

  // Ang mga value na kailangan ng loop, para hindi na i-restart ang loop kapag nagbago
  const live = useRef({ g, bpm });
  useEffect(() => {
    live.current = { g, bpm };
  });

  const sounds = useRef<DrumSounds | null>(null);
  useEffect(() => () => sounds.current?.close(), []);

  // Ang tunog ay itinatakda nang kaunti nang maaga sa orasan ng audio, para eksakto ang bawat palo.
  // Ang ilaw ay sumusunod lang sa parehong orasan.
  useEffect(() => {
    if (!playing) return;
    const audio = sounds.current;
    const clock = () => (audio ? audio.now : performance.now() / 1000);
    const queue: { step: number; time: number }[] = [];
    let nextTime = clock() + 0.06;
    let count = 0;

    const schedule = () => {
      const { g, bpm } = live.current;
      while (nextTime < clock() + 0.12) {
        const s = count % g.steps;
        for (const lane of LANE_ORDER) {
          if (g.lanes[lane]?.[s]) audio?.play(lane, s === 0, nextTime);
        }
        queue.push({ step: s, time: nextTime });
        nextTime += stepSeconds(bpm, g.steps);
        count++;
      }
    };
    schedule();
    const timer = setInterval(schedule, 25);

    let frame = 0;
    const draw = () => {
      let shown: number | null = null;
      while (queue.length > 0 && queue[0].time <= clock()) shown = queue.shift()!.step;
      if (shown !== null) setStep(shown);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      clearInterval(timer);
      cancelAnimationFrame(frame);
    };
  }, [playing]);

  // Tap tempo: i-tap kasabay ng beat ng kanta
  const taps = useRef<number[]>([]);
  function tap() {
    const now = performance.now();
    const last = taps.current[taps.current.length - 1];
    if (last !== undefined && now - last > 2000) taps.current = [];
    taps.current.push(now);
    const found = tapTempo(taps.current);
    if (found !== null) setBpm(found);
  }

  function togglePlay() {
    if (!playing) {
      try {
        sounds.current ??= new DrumSounds();
        sounds.current.resume();
      } catch {
        // Tuloy pa rin ang ilaw kahit walang tunog
      }
    }
    setPlaying(!playing);
  }

  const chip = (on: boolean) =>
    `h-9 shrink-0 rounded-full px-3.5 text-sm ${on ? "bg-stone-900 font-semibold text-stone-50 dark:bg-stone-100 dark:text-stone-900" : "border border-stone-200 bg-white text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div role="radiogroup" aria-label="Style" className="-mx-5 flex gap-1.5 overflow-x-auto px-5 md:mx-0 md:px-0">
          {STYLES.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={style === s.id} onClick={() => setStyle(s.id)} className={chip(style === s.id)}>
              {s.label}
            </button>
          ))}
        </div>
        {sections.length > 0 && (
          <div role="radiogroup" aria-label="Bahagi ng kanta" className="-mx-5 flex gap-1.5 overflow-x-auto px-5 md:mx-0 md:px-0">
            {sections.map((name) => (
              <button key={name} type="button" role="radio" aria-checked={section === name} onClick={() => setSection(name)} className={chip(section === name)}>
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      <section aria-label="Drum kit" className="relative rounded-2xl bg-[radial-gradient(120%_90%_at_50%_40%,#3A3330_0%,#1C1917_70%)] p-2.5 shadow-lg shadow-stone-900/20">
        <div className="absolute top-2.5 right-2.5 z-10 rounded-xl bg-stone-900/85 px-2.5 py-1.5 text-right">
          <div className="font-mono text-3xl leading-none font-bold text-amber-400 tabular-nums">{beat}</div>
          <div className="text-[11px] text-stone-400">{g.steps === 16 ? "beat / 4" : "bilang / 6"}</div>
        </div>
        <DrumKit hits={playing ? hits : new Set()} hand={g.lanes.ride ? "ride" : "hihat"} />
        <p className="px-1 text-xs text-stone-300">
          {KIND_TIPS[kind]}
        </p>
      </section>

      <section aria-label="Groove chart" className="overflow-x-auto rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-900">
        <div className="grid min-w-[300px] items-center gap-0.5 text-center font-mono text-[10px]" style={{ gridTemplateColumns: `52px repeat(${g.steps}, minmax(0, 1fr))` }}>
          <div />
          {counts.map((c, i) => (
            <div key={i} className={`rounded-sm ${c && !"e&a".includes(c) ? "font-bold" : "text-stone-400"} ${playing && i === current ? "bg-amber-200 dark:bg-amber-500/40" : ""}`}>
              {c || "·"}
            </div>
          ))}
          {lanes.map((l) => [
            <div key={l} className="text-left font-sans text-[11px] text-stone-500">{LANE_INFO[l].label}</div>,
            ...g.lanes[l]!.map((v, i) => (
              <div key={`${l}${i}`} className={`h-5 rounded-sm leading-5 font-bold ${LANE_INFO[l].color} ${playing && i === current ? "bg-amber-200 dark:bg-amber-500/40" : ""}`}>
                {v ? LANE_INFO[l].letter : ""}
              </div>
            )),
          ])}
        </div>
      </section>

      <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-900">
        <button type="button" onClick={togglePlay} aria-label={playing ? "I-pause ang groove" : "Patugtugin ang groove"} className="flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-500 text-stone-900">
          {playing ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z" /></svg>
          )}
        </button>
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold text-stone-600 dark:text-stone-300">
          <span>Tempo · <span className="font-mono">{bpm} BPM</span>{bpm < 72 && " (mabagal, para mag-aral)"}</span>
          <input type="range" min={40} max={160} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-full accent-amber-500" />
        </label>
        <button type="button" onClick={tap} aria-label="Tap tempo: i-tap kasabay ng beat ng kanta" className="h-12 shrink-0 rounded-xl border border-stone-200 px-4 text-sm font-bold active:bg-amber-100 dark:border-stone-700 dark:active:bg-amber-500/20">
          Tap
        </button>
      </div>
    </div>
  );
}
