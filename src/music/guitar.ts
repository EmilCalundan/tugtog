import { isChord, isChordLine } from "./transpose";

// Isang chord shape sa gitara. Ang mga array ay mula low E hanggang high e.
// frets: null = huwag patunugin, 0 = bukas. fingers: 1 hintuturo hanggang 4 hinliliit, 0 = walang daliri.
export type Shape = {
  frets: (number | null)[];
  fingers: number[];
  barre?: number;
};

type Fret = number | null;
const x = null;

// Mga open chord na madalas gamitin
const OPEN: Record<string, [Fret[], number[]]> = {
  C: [[x, 3, 2, 0, 1, 0], [0, 3, 2, 0, 1, 0]],
  Cmaj7: [[x, 3, 2, 0, 0, 0], [0, 3, 2, 0, 0, 0]],
  C7: [[x, 3, 2, 3, 1, 0], [0, 3, 2, 4, 1, 0]],
  Cadd9: [[x, 3, 2, 0, 3, 0], [0, 2, 1, 0, 3, 0]],
  D: [[x, x, 0, 2, 3, 2], [0, 0, 0, 1, 3, 2]],
  Dm: [[x, x, 0, 2, 3, 1], [0, 0, 0, 2, 3, 1]],
  D7: [[x, x, 0, 2, 1, 2], [0, 0, 0, 2, 1, 3]],
  Dm7: [[x, x, 0, 2, 1, 1], [0, 0, 0, 2, 1, 1]],
  Dmaj7: [[x, x, 0, 2, 2, 2], [0, 0, 0, 1, 1, 1]],
  Dsus2: [[x, x, 0, 2, 3, 0], [0, 0, 0, 1, 2, 0]],
  Dsus4: [[x, x, 0, 2, 3, 3], [0, 0, 0, 1, 2, 3]],
  E: [[0, 2, 2, 1, 0, 0], [0, 2, 3, 1, 0, 0]],
  Em: [[0, 2, 2, 0, 0, 0], [0, 2, 3, 0, 0, 0]],
  E7: [[0, 2, 0, 1, 0, 0], [0, 2, 0, 1, 0, 0]],
  Em7: [[0, 2, 2, 0, 3, 0], [0, 1, 2, 0, 3, 0]],
  Esus4: [[0, 2, 2, 2, 0, 0], [0, 2, 3, 4, 0, 0]],
  Fmaj7: [[x, x, 3, 2, 1, 0], [0, 0, 3, 2, 1, 0]],
  G: [[3, 2, 0, 0, 0, 3], [2, 1, 0, 0, 0, 3]],
  G7: [[3, 2, 0, 0, 0, 1], [3, 2, 0, 0, 0, 1]],
  Gmaj7: [[3, 2, 0, 0, 0, 2], [3, 2, 0, 0, 0, 1]],
  A: [[x, 0, 2, 2, 2, 0], [0, 0, 1, 2, 3, 0]],
  Am: [[x, 0, 2, 2, 1, 0], [0, 0, 2, 3, 1, 0]],
  A7: [[x, 0, 2, 0, 2, 0], [0, 0, 2, 0, 3, 0]],
  Am7: [[x, 0, 2, 0, 1, 0], [0, 0, 2, 0, 1, 0]],
  Amaj7: [[x, 0, 2, 1, 2, 0], [0, 0, 2, 1, 3, 0]],
  Asus2: [[x, 0, 2, 2, 0, 0], [0, 0, 1, 2, 0, 0]],
  Asus4: [[x, 0, 2, 2, 3, 0], [0, 0, 1, 2, 3, 0]],
  // Mga slash chord na madalas sa worship at OPM
  "D/F#": [[2, x, 0, 2, 3, 2], [1, 0, 0, 2, 4, 3]],
  "G/B": [[x, 2, 0, 0, 0, 3], [0, 1, 0, 0, 0, 3]],
  "C/G": [[3, 3, 2, 0, 1, 0], [3, 4, 2, 0, 1, 0]],
  "C/E": [[0, 3, 2, 0, 1, 0], [0, 3, 2, 0, 1, 0]],
  "E/G#": [[4, x, 2, 1, 0, 0], [4, 0, 2, 1, 0, 0]],
  "A/C#": [[x, 4, 2, 2, 2, 0], [0, 4, 1, 1, 1, 0]],
  "D/A": [[x, 0, 0, 2, 3, 2], [0, 0, 0, 1, 3, 2]],
  "Am/G": [[3, 0, 2, 2, 1, 0], [4, 0, 2, 3, 1, 0]],
};

// Barre shapes: [layo ng bawat string mula sa root fret, daliri]. null = huwag patunugin.
const E_SHAPES: Record<string, [Fret[], number[]]> = {
  "": [[0, 2, 2, 1, 0, 0], [1, 3, 4, 2, 1, 1]],
  m: [[0, 2, 2, 0, 0, 0], [1, 3, 4, 1, 1, 1]],
  "7": [[0, 2, 0, 1, 0, 0], [1, 3, 1, 2, 1, 1]],
  m7: [[0, 2, 0, 0, 0, 0], [1, 3, 1, 1, 1, 1]],
  sus4: [[0, 2, 2, 2, 0, 0], [1, 2, 3, 4, 1, 1]],
};
const A_SHAPES: Record<string, [Fret[], number[]]> = {
  "": [[x, 0, 2, 2, 2, 0], [0, 1, 2, 3, 4, 1]],
  m: [[x, 0, 2, 2, 1, 0], [0, 1, 3, 4, 2, 1]],
  "7": [[x, 0, 2, 0, 2, 0], [0, 1, 3, 1, 4, 1]],
  m7: [[x, 0, 2, 0, 1, 0], [0, 1, 3, 1, 2, 1]],
  maj7: [[x, 0, 2, 1, 2, 0], [0, 1, 3, 2, 4, 1]],
  sus2: [[x, 0, 2, 2, 0, 0], [0, 1, 3, 4, 1, 1]],
  sus4: [[x, 0, 2, 2, 3, 0], [0, 1, 2, 3, 4, 1]],
};

const PITCH: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function pitchOf(root: string): number {
  const base = PITCH[root.charAt(0)];
  const accidental = root.charAt(1) === "#" ? 1 : root.charAt(1) === "b" ? -1 : 0;
  return (base + accidental + 12) % 12;
}

// Gawing simple ang quality: "min" → "m", ang hindi kilala → triad
function simplify(quality: string): string {
  const q = quality.replace(/^min/, "m");
  if (q in A_SHAPES || q in E_SHAPES) return q;
  return q.startsWith("m") && !q.startsWith("maj") ? "m" : "";
}

function fromTemplate([offsets, fingers]: [Fret[], number[]], rootFret: number): Shape {
  return { frets: offsets.map((o) => (o === null ? null : o + rootFret)), fingers: [...fingers], barre: rootFret };
}

// Hanapin ang hugis ng chord sa gitara
export function guitarShape(chord: string): Shape | null {
  if (!isChord(chord)) return null;
  const name = chord.charAt(0).toUpperCase() + chord.slice(1);

  if (OPEN[name]) return { frets: [...OPEN[name][0]], fingers: [...OPEN[name][1]] };
  if (name.includes("/")) return guitarShape(name.split("/")[0]);

  const match = name.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return null;
  const [, root, rawQuality] = match;
  const quality = simplify(rawQuality);

  // Kilalang open chord gamit ang ibang spelling, hal. "Gm9" → "Gm" ay wala, pero "G13" → "G" ay meron
  const simpleName = root + quality;
  if (OPEN[simpleName]) return { frets: [...OPEN[simpleName][0]], fingers: [...OPEN[simpleName][1]] };

  // Barre: piliin ang hugis E o hugis A na mas malapit sa nut (hindi fret 0)
  const pitch = pitchOf(root);
  const eFret = (pitch - 4 + 12) % 12 || 12;
  const aFret = (pitch - 9 + 12) % 12 || 12;
  const useE = E_SHAPES[quality] && (!A_SHAPES[quality] || eFret <= aFret);
  return useE ? fromTemplate(E_SHAPES[quality], eFret) : fromTemplate(A_SHAPES[quality], aFret);
}

// Lahat ng chord sa kanta, sa pagkakasunod, walang ulit
export function songChords(text: string): string[] {
  const seen: string[] = [];
  for (const line of text.split("\n")) {
    if (!isChordLine(line)) continue;
    for (const chord of line.trim().split(/\s+/)) {
      if (!seen.includes(chord)) seen.push(chord);
    }
  }
  return seen;
}

// Saang fret magsisimula ang ipapakitang bahagi ng leeg (0 = mula sa nut)
export function neckWindow(frets: Fret[], capo = 0): number {
  if (capo > 0) return capo;
  const pressed = frets.filter((f): f is number => f !== null && f > 0);
  if (pressed.length === 0 || Math.max(...pressed) <= 4) return 0;
  return Math.min(...pressed) - 1;
}
