import { isChordLine, isSectionLine } from "./transpose";
import type { Position } from "./bass";

export type TimelineItem = { chord: string; section: string };

// Lahat ng chord ng kanta mula simula hanggang dulo (may ulit). Bawat chord = isang bar.
export function songTimeline(text: string): TimelineItem[] {
  const items: TimelineItem[] = [];
  let section = "";
  for (const line of text.split("\n")) {
    if (isSectionLine(line)) section = line.trim().slice(1, -1).trim();
    else if (isChordLine(line)) {
      for (const chord of line.trim().split(/\s+/)) items.push({ chord, section });
    }
  }
  return items;
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
