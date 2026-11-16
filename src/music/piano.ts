import { isChord, spellNote } from "./transpose";

export type Note = { midi: number; name: string };

// Layo ng bawat nota mula sa root (semitones), ayon sa quality ng chord
const INTERVALS: Record<string, number[]> = {
  "": [0, 4, 7],
  m: [0, 3, 7],
  "7": [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  "6": [0, 4, 7, 9],
  add9: [0, 4, 7, 2],
};

const PITCH: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function pitchOf(root: string): number {
  const accidental = root.charAt(1) === "#" ? 1 : root.charAt(1) === "b" ? -1 : 0;
  return (PITCH[root.charAt(0)] + accidental + 12) % 12;
}

function parse(chord: string): { root: string; quality: string; bass?: string } | null {
  if (!isChord(chord)) return null;
  const name = chord.charAt(0).toUpperCase() + chord.slice(1);
  const [main, bass] = name.split("/");
  const match = main.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return null;
  let quality = match[2].replace(/^min/, "m");
  if (!(quality in INTERVALS)) quality = quality.startsWith("m") && !quality.startsWith("maj") ? "m" : "";
  return { root: match[1], quality, bass };
}

// Ang mga nota ng chord, isinulat ayon sa root, hal. F#m → F# A C#
export function chordTones(chord: string): string[] {
  const parts = parse(chord);
  if (!parts) return [];
  const root = pitchOf(parts.root);
  return INTERVALS[parts.quality].map((i) => spellNote(root + i, parts.root));
}

// Ilagay ang pitch sa loob ng isang octave na nagsisimula sa `low` (midi)
function place(pitch: number, low: number): number {
  return low + ((pitch - low) % 12 + 12) % 12;
}

// Simpleng voicing: kaliwang kamay = bass sa C3–B3, kanang kamay = chord sa C4–B4
export function pianoVoicing(chord: string): { left: Note[]; right: Note[] } {
  const parts = parse(chord);
  if (!parts) return { left: [], right: [] };

  const root = pitchOf(parts.root);
  const tones = chordTones(chord);
  const right = INTERVALS[parts.quality]
    .map((interval, i) => ({ midi: place(root + interval, 60), name: tones[i] }))
    .sort((a, b) => a.midi - b.midi);

  const bassName = parts.bass ?? parts.root;
  const left = [{ midi: place(pitchOf(bassName), 48), name: bassName }];
  return { left, right };
}
