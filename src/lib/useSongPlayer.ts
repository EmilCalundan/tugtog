import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { BandSounds } from "./bandSounds";
import { guitarShape } from "../music/guitar";
import { pianoVoicing } from "../music/piano";
import { bassNote, bassPosition } from "../music/bass";
import { sectionKind, stepSeconds } from "../music/drums";
import { barPlan } from "../music/arrangement";
import type { SongStyle, TimeSignature } from "../music/arrangement";
import type { Lane } from "../music/drums";
import { bassMidi, guitarMidi } from "../music/timeline";
import type { TimelineItem } from "../music/timeline";

export type Part = "gitara" | "piano" | "bass" | "drums";

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

export type PlayerSettings = { bpm: number; style: SongStyle; time: TimeSignature };

// Tumutugtog ng kanta: bawat chord ay isang bar. Ang bar plan (galing sa style at time signature)
// ang nagsasabi kung kailan tutunog ang bawat instrumento.
// Ang tunog ay itinatakda nang maaga sa orasan ng audio; ang bar na ipinapakita ay sumusunod doon.
export function useSongPlayer(
  band: RefObject<BandSounds | null>,
  timeline: TimelineItem[],
  settings: PlayerSettings,
  parts: Set<Part>,
  playing: boolean,
) {
  const [bar, setBar] = useState(0);
  const live = useRef({ timeline, settings, parts });
  useEffect(() => {
    live.current = { timeline, settings, parts };
  });

  useEffect(() => {
    const audio = band.current;
    if (!playing || !audio) return;
    const cache = new Map<string, Voices>();
    const queue: { bar: number; time: number }[] = [];
    let nextTime = audio.now + 0.08;
    let barCount = 0;
    let s = 0;

    const schedule = () => {
      const { timeline, settings, parts } = live.current;
      if (timeline.length === 0) return;
      while (nextTime < audio.now + 0.15) {
        const barIndex = barCount % timeline.length;
        const item = timeline[barIndex];
        const plan = barPlan(settings.style, settings.time, sectionKind(item.section));
        const step = stepSeconds(settings.bpm, plan.steps);
        if (!cache.has(item.chord)) cache.set(item.chord, voicesFor(item.chord));
        const v = cache.get(item.chord)!;
        const t = nextTime;

        if (parts.has("gitara")) {
          for (const strum of plan.guitar) {
            if (strum.step === s) audio.strum(v.guitar, t, strum.down, strum.len * step + 0.05, strum.mute);
          }
        }
        if (parts.has("piano")) {
          for (const hit of plan.pianoRight) if (hit.step === s) audio.piano(v.pianoRight, t, hit.len * step, hit.soft ? 0.13 : 0.2);
          for (const hit of plan.pianoLeft) if (hit.step === s) audio.piano(v.pianoLeft, t, hit.len * step, 0.22);
        }
        if (parts.has("bass") && v.bass !== null) {
          for (const hit of plan.bass) if (hit.step === s) audio.bass(v.bass, t, hit.len * step * 0.95);
        }
        if (parts.has("drums")) {
          const previous = timeline[(barIndex - 1 + timeline.length) % timeline.length];
          const newSection = barIndex === 0 || previous.section !== item.section;
          for (const lane of LANES) {
            if (lane === "crash" && !newSection) continue;
            if (plan.drums[lane]?.[s]) audio.drums.play(lane, s === 0, t);
          }
        }

        if (s === 0) queue.push({ bar: barIndex, time: t });
        nextTime += step;
        s++;
        if (s >= plan.steps) {
          s = 0;
          barCount++;
        }
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
