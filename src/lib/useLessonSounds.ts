import { useEffect, useRef } from "react";
import type { BandSounds } from "./bandSounds";
import { ensureBand } from "./useSongPlayer";
import { guitarShape } from "../music/guitar";
import { pianoVoicing } from "../music/piano";
import { bassPosition } from "../music/bass";
import { guitarMidi, bassMidi } from "../music/timeline";
import { barPlan } from "../music/arrangement";
import type { SongStyle, TimeSignature } from "../music/arrangement";
import { stepSeconds } from "../music/drums";

// Maiikling tunog para sa mga aralin. Gumagawa lang ng audio kapag pinindot (kailangan ito ng browser).
export function useLessonSounds() {
  const band = useRef<BandSounds | null>(null);
  useEffect(() => () => band.current?.close(), []);

  function audio(): BandSounds | null {
    return ensureBand(band) ? band.current : null;
  }

  return {
    strum(chord: string) {
      const a = audio();
      const shape = guitarShape(chord);
      if (a && shape) a.strum(guitarMidi(shape.frets), a.now + 0.03, true, 2.2);
    },

    // Dalawang bar ng strum pattern sa isang chord
    pattern(chord: string, style: SongStyle, time: TimeSignature, bpm = 80) {
      const a = audio();
      const shape = guitarShape(chord);
      if (!a || !shape) return;
      const plan = barPlan(style, time, "verse");
      const step = stepSeconds(bpm, plan.steps);
      const start = a.now + 0.05;
      for (let bar = 0; bar < 2; bar++) {
        for (const s of plan.guitar) {
          a.strum(guitarMidi(shape.frets), start + (bar * plan.steps + s.step) * step, s.down, s.len * step + 0.05, s.mute);
        }
      }
    },

    piano(chord: string) {
      const a = audio();
      if (!a) return;
      const v = pianoVoicing(chord);
      a.piano(v.right.map((n) => n.midi), a.now + 0.03, 1.8, 0.2);
      a.piano(v.left.map((n) => n.midi), a.now + 0.03, 1.8, 0.22);
    },

    bass(note: string) {
      const a = audio();
      if (a) a.bass(bassMidi(bassPosition(note)), a.now + 0.03, 1.6);
    },
  };
}
