import { isChord } from "./transpose";
import { chordTones } from "./piano";
import { barPlan } from "./arrangement";
import type { SongStyle, TimeSignature } from "./arrangement";

// Mga pure helper para sa Matuto tab

type Quality = { name: string; formula: string; feel: string };

const QUALITIES: Record<string, Quality> = {
  "": { name: "Major", formula: "1 – 3 – 5", feel: "Bright and happy." },
  m: { name: "Minor", formula: "1 – ♭3 – 5", feel: "Soft or sad." },
  "7": { name: "Seventh", formula: "1 – 3 – 5 – ♭7", feel: "Tense, like it wants to move to the next chord." },
  maj7: { name: "Major 7", formula: "1 – 3 – 5 – 7", feel: "Warm and a little jazzy." },
  m7: { name: "Minor 7", formula: "1 – ♭3 – 5 – ♭7", feel: "A soft minor, common in R&B and worship." },
  sus2: { name: "Suspended 2", formula: "1 – 2 – 5", feel: "No 3rd, so it sounds open and waiting." },
  sus4: { name: "Suspended 4", formula: "1 – 4 – 5", feel: "No 3rd; it usually resolves back to major." },
  add9: { name: "Add 9", formula: "1 – 3 – 5 – 9", feel: "Major with extra sparkle." },
  dim: { name: "Diminished", formula: "1 – ♭3 – ♭5", feel: "Dark and restless; used as a passing chord." },
  aug: { name: "Augmented", formula: "1 – 3 – ♯5", feel: "Floating and strange." },
  "6": { name: "Sixth", formula: "1 – 3 – 5 – 6", feel: "Sweet, like an old song." },
};

export type ChordExplanation = Quality & { root: string; quality: string; tones: string[]; bass?: string };

// Ipaliwanag ang isang chord symbol, hal. "G7" → root G, Seventh, G B D F
export function explainChord(chord: string): ChordExplanation | null {
  if (!isChord(chord)) return null;
  const name = chord.charAt(0).toUpperCase() + chord.slice(1);
  const [main, bass] = name.split("/");
  const match = main.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return null;
  const quality = match[2].replace(/^min/, "m");
  const info = QUALITIES[quality] ?? QUALITIES[quality.startsWith("m") && !quality.startsWith("maj") ? "m" : ""];
  return { ...info, root: match[1], quality, tones: chordTones(main), bass };
}

export type ChordKind = "major" | "minor" | "seventh";
const SUFFIX: Record<ChordKind, string> = { major: "", minor: "m", seventh: "7" };

export function buildChord(root: string, kind: ChordKind): string {
  return root + SUFFIX[kind];
}

// Ang mga unang chord na dapat matutunan sa gitara, mula sa pinakamadali
export const BEGINNER_CHORDS = ["Em", "G", "C", "D", "Am", "E", "A", "Dm"];

export type StrumSlot = { count: string; stroke: "↓" | "↑" | "x" | "·" };

// Ang strum pattern ng isang style, bilang mga kahon na may bilang at arrow
export function strumSlots(style: SongStyle, time: TimeSignature, strum?: string | null): StrumSlot[] {
  const plan = barPlan(style, time, "verse", strum);
  const perSlot = time === "6/8" ? 1 : 2; // 4/4: eighth notes; 6/8: 16th notes
  const slots = plan.steps / perSlot;
  return Array.from({ length: slots }, (_, i) => {
    const strum = plan.guitar.find((s) => s.step === i * perSlot);
    const count = time === "6/8" ? (i % 2 === 0 ? String(i / 2 + 1) : "&") : i % 2 === 0 ? String(i / 2 + 1) : "&";
    const stroke: StrumSlot["stroke"] = !strum ? "·" : strum.mute ? "x" : strum.down ? "↓" : "↑";
    return { count, stroke };
  });
}
