import { chordTokens, isChordLine, isSectionLine } from "./transpose";
import type { Position } from "./bass";

export type BarChord = { chord: string; start: number; beats: number };
export type Bar = { section: string; chords: BarChord[] };

// Hatiin ang bar sa mga chord. Kapag hindi pantay, ang mga nauna ang may dagdag na beat (hal. 2 + 1 + 1).
function splitBar(chords: string[], beatsPerBar: number): BarChord[] {
  const n = Math.min(chords.length, beatsPerBar);
  const base = Math.floor(beatsPerBar / n);
  let extra = beatsPerBar - base * n;
  let start = 0;
  return chords.slice(0, n).map((chord) => {
    const beats = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra--;
    const item = { chord, start, beats };
    start += beats;
    return item;
  });
}

// Lahat ng bar ng kanta mula simula hanggang dulo.
// Walang "|": bawat chord ay isang bar. May "|": bawat pagitan ng "|" ay isang bar.
// beatsPerBar: 4 sa 4/4 (quarter notes), 6 sa 6/8 (eighth notes).
export function songBars(text: string, beatsPerBar: number): Bar[] {
  const bars: Bar[] = [];
  let section = "";
  for (const line of text.split("\n")) {
    if (isSectionLine(line)) {
      section = line.trim().slice(1, -1).trim();
    } else if (isChordLine(line)) {
      const groups = line.includes("|")
        ? line.split("|").map(chordTokens).filter((g) => g.length > 0)
        : chordTokens(line).map((c) => [c]);
      for (const group of groups) bars.push({ section, chords: splitBar(group, beatsPerBar) });
    }
  }
  return bars;
}

// Standard tuning, low E hanggang high e (MIDI)
const GUITAR_OPEN = [40, 45, 50, 55, 59, 64];

export function guitarMidi(frets: (number | null)[], capo = 0): (number | null)[] {
  return frets.map((f, i) => (f === null ? null : GUITAR_OPEN[i] + f + capo));
}

const BASS_OPEN = { E: 28, A: 33, D: 38, G: 43 };

export function bassMidi(position: Position): number {
  return BASS_OPEN[position.string] + position.fret;
}
