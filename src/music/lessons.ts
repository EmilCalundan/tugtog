import { isChord } from "./transpose";
import { chordTones } from "./piano";
import { barPlan } from "./arrangement";
import type { SongStyle, TimeSignature } from "./arrangement";

// Mga pure helper para sa Matuto tab

type Quality = { name: string; formula: string; feel: string };

const QUALITIES: Record<string, Quality> = {
  "": { name: "Major", formula: "1 – 3 – 5", feel: "Maliwanag at masaya ang tunog." },
  m: { name: "Minor", formula: "1 – ♭3 – 5", feel: "Malambot o malungkot ang tunog." },
  "7": { name: "Seventh", formula: "1 – 3 – 5 – ♭7", feel: "May tensyon, parang gustong lumipat sa susunod na chord." },
  maj7: { name: "Major 7", formula: "1 – 3 – 5 – 7", feel: "Malambing at medyo jazzy." },
  m7: { name: "Minor 7", formula: "1 – ♭3 – 5 – ♭7", feel: "Malambot na minor, madalas sa R&B at worship." },
  sus2: { name: "Suspended 2", formula: "1 – 2 – 5", feel: "Walang 3rd, kaya parang bukas at naghihintay." },
  sus4: { name: "Suspended 4", formula: "1 – 4 – 5", feel: "Walang 3rd; kadalasang bumabalik sa major pagkatapos." },
  add9: { name: "Add 9", formula: "1 – 3 – 5 – 9", feel: "Major na may dagdag na kislap." },
  dim: { name: "Diminished", formula: "1 – ♭3 – ♭5", feel: "Madilim at hindi mapakali; pangdugtong lang." },
  aug: { name: "Augmented", formula: "1 – 3 – ♯5", feel: "Lumulutang at kakaiba." },
  "6": { name: "Sixth", formula: "1 – 3 – 5 – 6", feel: "Matamis, parang lumang kanta." },
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
export function strumSlots(style: SongStyle, time: TimeSignature): StrumSlot[] {
  const plan = barPlan(style, time, "verse");
  const perSlot = time === "6/8" ? 1 : 2; // 4/4: eighth notes; 6/8: 16th notes
  const slots = plan.steps / perSlot;
  return Array.from({ length: slots }, (_, i) => {
    const strum = plan.guitar.find((s) => s.step === i * perSlot);
    const count = time === "6/8" ? (i % 2 === 0 ? String(i / 2 + 1) : "&") : i % 2 === 0 ? String(i / 2 + 1) : "&";
    const stroke: StrumSlot["stroke"] = !strum ? "·" : strum.mute ? "x" : strum.down ? "↓" : "↑";
    return { count, stroke };
  });
}
