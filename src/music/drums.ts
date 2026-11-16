import { isSectionLine } from "./transpose";

export type Lane = "crash" | "ride" | "hihat" | "snare" | "kick";
export type Style = "ballad" | "pop" | "rock" | "sixeight";
export type Kind = "verse" | "chorus";
export type Groove = { steps: number; lanes: Partial<Record<Lane, number[]>> };

export const STYLES: { id: Style; label: string }[] = [
  { id: "ballad", label: "Ballad" },
  { id: "pop", label: "Pop" },
  { id: "rock", label: "Rock" },
  { id: "sixeight", label: "6/8" },
];

// Gumawa ng lane mula sa listahan ng mga hakbang na may tama
function lane(steps: number, hits: number[]): number[] {
  return Array.from({ length: steps }, (_, i) => (hits.includes(i) ? 1 : 0));
}

const EIGHTHS = [0, 2, 4, 6, 8, 10, 12, 14];
const BASE: Record<Style, { steps: number; cymbal: number[]; snare: number[]; kick: number[] }> = {
  ballad: { steps: 16, cymbal: EIGHTHS, snare: [4, 12], kick: [0, 8] },
  pop: { steps: 16, cymbal: EIGHTHS, snare: [4, 12], kick: [0, 8, 10] },
  rock: { steps: 16, cymbal: EIGHTHS, snare: [4, 12], kick: [0, 6, 8, 10] },
  sixeight: { steps: 6, cymbal: [0, 1, 2, 3, 4, 5], snare: [3], kick: [0] },
};

// Ang groove para sa style at bahagi ng kanta. Sa chorus: ride at crash para mas malakas.
export function groove(style: Style, kind: Kind): Groove {
  const base = BASE[style];
  const cymbal = lane(base.steps, base.cymbal);
  return {
    steps: base.steps,
    lanes: {
      ...(kind === "chorus" ? { crash: lane(base.steps, [0]), ride: cymbal } : { hihat: cymbal }),
      snare: lane(base.steps, base.snare),
      kick: lane(base.steps, base.kick),
    },
  };
}

// Ang bilang na binabanggit habang tumutugtog
export function countLabels(steps: number): string[] {
  if (steps === 16) return Array.from({ length: 16 }, (_, i) => (i % 4 === 0 ? String(i / 4 + 1) : ["", "e", "&", "a"][i % 4]));
  return Array.from({ length: steps }, (_, i) => String(i + 1));
}

// Haba ng isang hakbang sa segundo. 4/4: 16th note. 6/8: eighth note, at ang BPM ay bawat 3 eighth.
export function stepSeconds(bpm: number, steps: number): number {
  return steps === 6 ? 60 / bpm / 3 : 60 / bpm / 4;
}

export function sectionKind(name: string): Kind {
  return /chorus|koro/i.test(name) ? "chorus" : "verse";
}

// Ang mga section ng kanta, hal. ["Verse 1", "Chorus"]
export function songSections(text: string): string[] {
  const names: string[] = [];
  for (const line of text.split("\n")) {
    if (!isSectionLine(line)) continue;
    const name = line.trim().slice(1, -1).trim();
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}
