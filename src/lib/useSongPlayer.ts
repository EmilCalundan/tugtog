import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { BandSounds } from "./bandSounds";
import { guitarShape } from "../music/guitar";
import { pianoVoicing } from "../music/piano";
import { bassNote, bassPosition } from "../music/bass";
import { groove, sectionKind, stepSeconds } from "../music/drums";
import type { Lane } from "../music/drums";
import { bassMidi, guitarMidi } from "../music/timeline";
import type { TimelineItem } from "../music/timeline";

export type Part = "gitara" | "piano" | "bass" | "drums";

// Strum pattern bawat bar, sa eighth notes: ↓ · ↓↑ · ↑ ↓↑
const STRUMS: { eighth: number; down: boolean; eighths: number }[] = [
  { eighth: 0, down: true, eighths: 2 },
  { eighth: 2, down: true, eighths: 1 },
  { eighth: 3, down: false, eighths: 2 },
  { eighth: 5, down: false, eighths: 1 },
  { eighth: 6, down: true, eighths: 1 },
  { eighth: 7, down: false, eighths: 1 },
];
const LANES: Lane[] = ["crash", "ride", "hihat", "snare", "kick"];

type Voices = { guitar: (number | null)[]; pianoLeft: number[]; pianoRight: number[]; bass: number | null };

function voicesFor(chord: string): Voices {
  const shape = guitarShape(chord);
  const piano = pianoVoicing(chord);
  const note = bassNote(chord);
  return {
    guitar: shape ? guitarMidi(shape.frets) : [],
    pianoLeft: piano.left.map((n) => n.midi),
    pianoRight: piano.right.map((n) => n.midi),
    bass: note ? bassMidi(bassPosition(note)) : null,
  };
}

// Tumutugtog ng kanta: bawat chord ay isang bar (16 na hakbang na 16th note).
// Ang tunog ay itinatakda nang maaga sa orasan ng audio; ang bar na ipinapakita ay sumusunod doon.
export function useSongPlayer(
  band: RefObject<BandSounds | null>,
  timeline: TimelineItem[],
  bpm: number,
  parts: Set<Part>,
  playing: boolean,
) {
  const [bar, setBar] = useState(0);
  const live = useRef({ timeline, bpm, parts });
  useEffect(() => {
    live.current = { timeline, bpm, parts };
  });

  useEffect(() => {
    const audio = band.current;
    if (!playing || !audio) return;
    const cache = new Map<string, Voices>();
    const queue: { bar: number; time: number }[] = [];
    let nextTime = audio.now + 0.08;
    let count = 0;

    const schedule = () => {
      const { timeline, bpm, parts } = live.current;
      if (timeline.length === 0) return;
      const step = stepSeconds(bpm, 16);
      while (nextTime < audio.now + 0.15) {
        const barIndex = Math.floor(count / 16) % timeline.length;
        const s = count % 16;
        const item = timeline[barIndex];
        if (!cache.has(item.chord)) cache.set(item.chord, voicesFor(item.chord));
        const v = cache.get(item.chord)!;
        const t = nextTime;

        if (parts.has("gitara") && s % 2 === 0) {
          const strum = STRUMS.find((x) => x.eighth === s / 2);
          if (strum) audio.strum(v.guitar, t, strum.down, strum.eighths * 2 * step + 0.05);
        }
        if (parts.has("piano") && (s === 0 || s === 8)) {
          audio.piano(v.pianoRight, t, 8 * step, s === 0 ? 0.2 : 0.13);
          if (s === 0) audio.piano(v.pianoLeft, t, 16 * step, 0.22);
        }
        if (parts.has("bass") && v.bass !== null && (s === 0 || s === 8)) {
          audio.bass(v.bass, t, 7.5 * step);
        }
        if (parts.has("drums")) {
          const g = groove("ballad", sectionKind(item.section));
          const previous = timeline[(barIndex - 1 + timeline.length) % timeline.length];
          const newSection = barIndex === 0 || previous.section !== item.section;
          for (const lane of LANES) {
            if (lane === "crash" && !newSection) continue;
            if (g.lanes[lane]?.[s]) audio.drums.play(lane, s === 0, t);
          }
        }

        if (s === 0) queue.push({ bar: barIndex, time: t });
        nextTime += step;
        count++;
      }
    };
    schedule();
    const timer = setInterval(schedule, 25);

    let frame = 0;
    const draw = () => {
      let shown: number | null = null;
      while (queue.length > 0 && queue[0].time <= audio.now) shown = queue.shift()!.bar;
      if (shown !== null) setBar(shown);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      clearInterval(timer);
      cancelAnimationFrame(frame);
    };
  }, [playing, band]);

  return bar;
}

// Gumawa o gisingin ang tunog. Dapat tawagin mula sa pindot ng user.
export function ensureBand(ref: RefObject<BandSounds | null>): boolean {
  try {
    ref.current ??= new BandSounds();
    ref.current.resume();
    return true;
  } catch {
    return false;
  }
}
