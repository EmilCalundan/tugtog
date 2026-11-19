import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { BandSounds } from "./bandSounds";
import { guitarShape } from "../music/guitar";
import { pianoVoicing } from "../music/piano";
import { bassNote, bassPosition } from "../music/bass";
import { sectionKind, stepSeconds } from "../music/drums";
import { barEvents, barPlan } from "../music/arrangement";
import type { SongStyle, TimeSignature } from "../music/arrangement";
import type { Lane } from "../music/drums";
import { bassMidi, guitarMidi } from "../music/timeline";
import { nextBar } from "../music/timeline";
import type { Bar, SectionRange } from "../music/timeline";

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

export type PlayerSettings = { bpm: number; style: SongStyle; time: TimeSignature; strum?: string | null };

// Ilang beat sa isang bar, ayon sa paghahati ng songBars (4/4: 4 na quarter; 6/8: 6 na eighth)
export function beatsPerBar(time: TimeSignature): number {
  return time === "6/8" ? 6 : 4;
}

// Tumutugtog ng kanta bar bawat bar. Ang bar plan (galing sa style at time signature) ang pattern,
// at ang barEvents ang nagsasabi kung aling chord ang tutunog sa bawat tama.
// Ang tunog ay itinatakda nang maaga sa orasan ng audio; ang ipinapakita ay sumusunod doon.
export function useSongPlayer(
  band: RefObject<BandSounds | null>,
  bars: Bar[],
  settings: PlayerSettings,
  parts: Set<Part>,
  playing: boolean,
  // Saang bar magsisimula, at kung uulitin ang isang bahagi
  range: { from: number; loop: SectionRange | null } = { from: 0, loop: null },
) {
  const [position, setPosition] = useState({ bar: 0, chord: "" });
  const live = useRef({ bars, settings, parts, range });
  useEffect(() => {
    live.current = { bars, settings, parts, range };
  });

  useEffect(() => {
    const audio = band.current;
    if (!playing || !audio) return;
    const cache = new Map<string, Voices>();
    const voices = (chord: string) => {
      if (!cache.has(chord)) cache.set(chord, voicesFor(chord));
      return cache.get(chord)!;
    };
    const queue: { bar: number; chord: string; time: number }[] = [];
    let nextTime = audio.now + 0.08;
    let barIndex = live.current.range.from;
    let s = 0;

    const schedule = () => {
      const { bars, settings, parts } = live.current;
      if (bars.length === 0) return;
      while (nextTime < audio.now + 0.15) {
        if (barIndex >= bars.length) barIndex = 0;
        const bar = bars[barIndex];
        const plan = barPlan(settings.style, settings.time, sectionKind(bar.section), settings.strum);
        const step = stepSeconds(settings.bpm, plan.steps);
        const perBeat = plan.steps / beatsPerBar(settings.time);
        const starts = bar.chords.map((c) => c.start * perBeat);
        const t = nextTime;

        for (const e of barEvents(plan, starts)) {
          if (e.step !== s) continue;
          const v = voices(bar.chords[e.chord].chord);
          if (e.part === "guitar" && parts.has("gitara")) audio.strum(v.guitar, t, e.down ?? true, e.len * step + 0.05, e.mute);
          if (e.part === "pianoRight" && parts.has("piano")) audio.piano(v.pianoRight, t, e.len * step, e.soft ? 0.13 : 0.2);
          if (e.part === "pianoLeft" && parts.has("piano")) audio.piano(v.pianoLeft, t, e.len * step, 0.22);
          if (e.part === "bass" && parts.has("bass") && v.bass !== null) audio.bass(v.bass, t, e.len * step * 0.95);
        }
        if (parts.has("drums")) {
          const previous = bars[(barIndex - 1 + bars.length) % bars.length];
          const newSection = barIndex === 0 || previous.section !== bar.section;
          for (const lane of LANES) {
            if (lane === "crash" && !newSection) continue;
            if (plan.drums[lane]?.[s]) audio.drums.play(lane, s === 0, t);
          }
        }

        const chordHere = starts.indexOf(s);
        if (chordHere >= 0) queue.push({ bar: barIndex, chord: bar.chords[chordHere].chord, time: t });
        nextTime += step;
        s++;
        if (s >= plan.steps) {
          s = 0;
          barIndex = nextBar(barIndex, bars.length, live.current.range.loop);
        }
      }
    };
    schedule();
    const timer = setInterval(schedule, 25);

    let frame = 0;
    const draw = () => {
      let shown: { bar: number; chord: string } | null = null;
      while (queue.length > 0 && queue[0].time <= audio.now) shown = queue.shift()!;
      if (shown !== null) setPosition({ bar: shown.bar, chord: shown.chord });
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      clearInterval(timer);
      cancelAnimationFrame(frame);
    };
  }, [playing, band, range.from]);

  return position;
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
