import { isChord } from "./transpose";

export type BassString = "E" | "A" | "D" | "G";
export type Position = { string: BassString; fret: number };

const PITCH: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const OPEN: Record<BassString, number> = { E: 4, A: 9, D: 2, G: 7 };
const STRINGS_TOP_DOWN: BassString[] = ["G", "D", "A", "E"];

function pitchOf(note: string): number {
  const accidental = note.charAt(1) === "#" ? 1 : note.charAt(1) === "b" ? -1 : 0;
  return (PITCH[note.charAt(0)] + accidental + 12) % 12;
}

// Ang notang tutugtugin ng bass: ang root, o ang bass ng slash chord
export function bassNote(chord: string): string | null {
  if (!isChord(chord)) return null;
  const name = chord.charAt(0).toUpperCase() + chord.slice(1);
  const [main, bass] = name.split("/");
  return bass ?? main.match(/^[A-G][#b]?/)![0];
}

// Saan tutugtugin: sa E o A string lang (madali para sa baguhan), ang pinakamababang fret
export function bassPosition(note: string): Position {
  const pitch = pitchOf(note);
  const onE = (pitch - OPEN.E + 12) % 12;
  const onA = (pitch - OPEN.A + 12) % 12;
  return onA < onE ? { string: "A", fret: onA } : { string: "E", fret: onE };
}

// Simpleng tab: bawat nota ay dalawang beses (half notes)
export function bassTab(positions: Position[]): string {
  return STRINGS_TOP_DOWN.map((name) => {
    const cells = positions.flatMap((p) => {
      const cell = p.string === name ? String(p.fret).padEnd(3, "-") : "---";
      return [cell, cell];
    });
    return `${name}|${cells.join("")}|`;
  }).join("\n");
}
