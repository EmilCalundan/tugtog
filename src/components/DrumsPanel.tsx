import { useEffect, useRef, useState } from "react";
import { STYLES, countLabels, groove, sectionKind, songSections, stepSeconds, tapTempo } from "../music/drums";
import type { Kind, Lane, Style } from "../music/drums";
import { DrumSounds } from "../lib/drumSounds";
import { DrumKit } from "./DrumKit";

const LANE_INFO: Record<Lane, { label: string; letter: string; color: string }> = {
  crash: { label: "Crash", letter: "R", color: "text-stone-50" },
  ride: { label: "Ride", letter: "R", color: "text-stone-50" },
  hihat: { label: "Hi-hat", letter: "R", color: "text-stone-50" },
  snare: { label: "Snare", letter: "L", color: "text-stone-300" },
  kick: { label: "Kick", letter: "●", color: "text-stone-400" },
};
const LANE_ORDER: Lane[] = ["crash", "ride", "hihat", "snare", "kick"];
const KIND_TIPS: Record<Kind, string> = {
  intro: "Intro: keep it light. Hi-hat on every beat and kick on 1, no snare.",
  verse: "Verse: right hand on hi-hat, left hand on snare, foot on kick.",
  prechorus: "Pre-chorus: like the verse, with extra kicks at the end leading into the chorus.",
  chorus: "Chorus: move to the ride, and crash on the first beat.",
  bridge: "Bridge: crash coming in, ride, and kick on every beat to build up.",
  outro: "Outro: the feel slows down. Hi-hat on every beat and kick on 1.",
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
    `h-9 shrink-0 rounded-full px-3.5 text-sm ${on ? "knob font-semibold" : "border border-white/12 bg-white/[0.06] text-stone-300 hover:bg-white/10"}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div role="radiogroup" aria-label="Style" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
          {STYLES.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={style === s.id} onClick={() => setStyle(s.id)} className={chip(style === s.id)}>
              {s.label}
            </button>
          ))}
        </div>
        {sections.length > 0 && (
          <div role="radiogroup" aria-label="Song section" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
            {sections.map((name) => (
              <button key={name} type="button" role="radio" aria-checked={section === name} onClick={() => setSection(name)} className={chip(section === name)}>
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      <section aria-label="Drum kit" className="glass relative rounded-[28px] p-3">
        <div className="absolute top-3 right-3 z-10 rounded-2xl border border-white/10 bg-black/50 px-3 py-2 text-right backdrop-blur">
          <div className="font-digit text-3xl leading-none text-stone-50 tabular-nums">{beat}</div>
          <div className="mt-1 text-[11px] text-stone-400">{g.steps === 16 ? "beat / 4" : "count / 6"}</div>
        </div>
        <DrumKit hits={playing ? hits : new Set()} hand={g.lanes.ride ? "ride" : "hihat"} />
        <p className="px-1 text-xs text-stone-300">
          {KIND_TIPS[kind]}
        </p>
      </section>

      <section aria-label="Groove chart" className="glass overflow-x-auto rounded-[28px] p-4">
        <div className="grid min-w-[300px] items-center gap-0.5 text-center font-mono text-[10px]" style={{ gridTemplateColumns: `52px repeat(${g.steps}, minmax(0, 1fr))` }}>
          <div />
          {counts.map((c, i) => (
            <div key={i} className={`rounded-sm ${c && !"e&a".includes(c) ? "font-bold text-stone-100" : "text-stone-500"} ${playing && i === current ? "bg-white/25" : ""}`}>
              {c || "·"}
            </div>
          ))}
          {lanes.map((l) => [
            <div key={l} className="text-left font-sans text-[11px] text-stone-400">{LANE_INFO[l].label}</div>,
            ...g.lanes[l]!.map((v, i) => (
              <div key={`${l}${i}`} className={`h-5 rounded-sm leading-5 font-bold ${LANE_INFO[l].color} ${playing && i === current ? "bg-white/25" : ""}`}>
                {v ? LANE_INFO[l].letter : ""}
              </div>
            )),
          ])}
        </div>
      </section>

      <div className="glass flex items-center gap-3 rounded-full p-1.5 pr-2">
        <button type="button" onClick={togglePlay} aria-label={playing ? "Pause the groove" : "Play the groove"} className="knob flex h-12 w-[68px] shrink-0 items-center justify-center rounded-full">
          {playing ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z" /></svg>
          )}
        </button>
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-stone-300">
          <span>Tempo · <span className="font-digit text-stone-50">{bpm}</span> BPM{bpm < 72 && " (slow, for practice)"}</span>
          <input type="range" min={40} max={160} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-full accent-white" />
        </label>
        <button type="button" onClick={tap} aria-label="Tap tempo: tap along with the beat" className="h-11 shrink-0 rounded-full border border-white/15 px-4 text-sm font-semibold active:bg-white/25">
          Tap
        </button>
      </div>
    </div>
  );
}
