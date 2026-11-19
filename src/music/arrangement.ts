import { groove } from "./drums";
import type { Kind, Lane, Style as DrumStyle } from "./drums";

// Paano tutugtog ang banda sa isang bar, ayon sa style at time signature ng kanta.
// Ang `step` at `len` ay bilang ng 16th notes.

export type SongStyle = "ballad" | "pop" | "rock" | "reggae";
export type TimeSignature = "4/4" | "6/8";

export const SONG_STYLES: { id: SongStyle; label: string }[] = [
  { id: "ballad", label: "Ballad" },
  { id: "pop", label: "Pop" },
  { id: "rock", label: "Rock" },
  { id: "reggae", label: "Reggae" },
];

export type Hit = { step: number; len: number };
export type Strum = Hit & { down: boolean; mute?: boolean };
export type BarPlan = {
  steps: number;
  guitar: Strum[];
  pianoRight: (Hit & { soft?: boolean })[];
  pianoLeft: Hit[];
  bass: Hit[];
  drums: Partial<Record<Lane, number[]>>;
};

// Gawing strum list mula sa "D.DU.UDU" (bawat titik = isang eighth note)
function strums(pattern: string, mute = false): Strum[] {
  const out: Strum[] = [];
  [...pattern].forEach((c, i) => {
    if (c === ".") return;
    out.push({ step: i * 2, len: 0, down: c === "D", mute: mute || undefined });
  });
  // Ang bawat strum ay tumutunog hanggang sa susunod
  return out.map((s, i) => ({ ...s, len: mute ? 1 : (out[i + 1]?.step ?? pattern.length * 2) - s.step }));
}

// Sariling strum pattern ng kanta. Bawat titik ay isang "slot":
// 4/4 = 8 slot (eighth notes), 6/8 = 12 slot (16th notes).
// D = pababa, U = pataas, x = chuck (pinipigilan ng palad), - = pahinga
export const STRUM_PRESETS: Record<TimeSignature, { pattern: string; label: string }[]> = {
  "4/4": [
    { pattern: "D-DU-UDU", label: "Island" },
    { pattern: "D-D-DUDU", label: "Folk" },
    { pattern: "D-DUxUDU", label: "With chuck" },
    { pattern: "D---D---", label: "Slow" },
    { pattern: "DDDDDDDD", label: "Driving" },
  ],
  "6/8": [
    { pattern: "D-DU--D-DU--", label: "6/8 ballad" },
    { pattern: "D-----D-----", label: "Slow" },
    { pattern: "D-D-D-D-D-D-", label: "Even" },
  ],
};

export function strumLength(time: TimeSignature): number {
  return time === "6/8" ? 12 : 8;
}

// Linisin ang isinulat: walang espasyo, malaking D/U, maliit na x, "-" sa pahinga
export function normalizeStrum(text: string): string {
  return [...text.replace(/\s+/g, "")]
    .map((c) => (c === "d" ? "D" : c === "u" ? "U" : c === "X" ? "x" : c === "." ? "-" : c))
    .join("");
}

// Gawing listahan ng strum, o null kung mali ang haba o may ibang titik
export function parseStrum(text: string | null | undefined, time: TimeSignature): Strum[] | null {
  if (!text) return null;
  const pattern = normalizeStrum(text);
  if (pattern.length !== strumLength(time) || !/^[DUx-]+$/.test(pattern) || !/[DUx]/.test(pattern)) return null;
  const perSlot = time === "6/8" ? 1 : 2;
  const steps = pattern.length * perSlot;
  const out: Strum[] = [];
  [...pattern].forEach((c, i) => {
    if (c === "-") return;
    out.push({ step: i * perSlot, len: 0, down: c !== "U", mute: c === "x" || undefined });
  });
  return out.map((s, i) => ({ ...s, len: s.mute ? 1 : (out[i + 1]?.step ?? steps) - s.step }));
}

function hits(stepsList: number[], len: number): Hit[] {
  return stepsList.map((step) => ({ step, len }));
}

const FOUR: Record<SongStyle, Omit<BarPlan, "steps" | "drums">> = {
  ballad: {
    guitar: strums("D.DU.UDU"),
    pianoRight: [{ step: 0, len: 8 }, { step: 8, len: 8, soft: true }],
    pianoLeft: hits([0], 16),
    bass: hits([0, 8], 7),
  },
  pop: {
    guitar: strums("D.DU.UDU"),
    pianoRight: hits([0, 4, 8, 12], 3),
    pianoLeft: hits([0, 8], 8),
    bass: hits([0, 4, 8, 12], 3),
  },
  rock: {
    guitar: strums("DDDDDDDD"),
    pianoRight: hits([0, 8], 8),
    pianoLeft: hits([0], 16),
    bass: hits([0, 2, 4, 6, 8, 10, 12, 14], 2),
  },
  reggae: {
    guitar: strums(".U.U.U.U", true),
    pianoRight: hits([2, 6, 10, 14], 1),
    pianoLeft: [],
    bass: hits([0, 6, 8], 3),
  },
};

const SIX_EIGHT: Omit<BarPlan, "steps" | "drums"> = {
  guitar: sixEightStrums(),
  pianoRight: [{ step: 0, len: 6 }, { step: 6, len: 6, soft: true }],
  pianoLeft: hits([0], 12),
  bass: hits([0, 6], 5),
};

// 6/8: ↓ sa 1, ↓↑ sa 2-&, ↓ sa 4, ↓↑ sa 5-& (sa 16th notes: 0, 2, 3, 6, 8, 9)
function sixEightStrums(): Strum[] {
  const pattern: [number, boolean][] = [[0, true], [2, true], [3, false], [6, true], [8, true], [9, false]];
  return pattern.map(([step, down], i) => ({ step, down, len: (pattern[i + 1]?.[0] ?? 12) - step }));
}

export function drumStyle(style: SongStyle, time: TimeSignature): DrumStyle {
  return time === "6/8" ? "sixeight" : style;
}

// Palawakin ang drum lanes kapag mas kaunti ang hakbang ng groove (hal. 6 na eighth → 12 na 16th)
function stretch(lanes: Partial<Record<Lane, number[]>>, from: number, to: number) {
  if (from === to) return lanes;
  const factor = to / from;
  const out: Partial<Record<Lane, number[]>> = {};
  for (const [name, values] of Object.entries(lanes) as [Lane, number[]][]) {
    out[name] = Array.from({ length: to }, (_, i) => (i % factor === 0 ? values[i / factor] : 0));
  }
  return out;
}

// `strum`: sariling pattern ng kanta (kapag tama), kapalit ng strum ng style
export function barPlan(style: SongStyle, time: TimeSignature, kind: Kind, strum?: string | null): BarPlan {
  const steps = time === "6/8" ? 12 : 16;
  const g = groove(drumStyle(style, time), kind);
  // Intro at outro: isang mahabang strum at chord bawat bar, para magaan
  if (kind === "intro" || kind === "outro") {
    return {
      steps,
      guitar: [{ step: 0, len: steps, down: true }],
      pianoRight: [{ step: 0, len: steps }],
      pianoLeft: hits([0], steps),
      bass: [{ step: 0, len: steps - 1 }],
      drums: stretch(g.lanes, g.steps, steps),
    };
  }
  const parts = time === "6/8" ? SIX_EIGHT : FOUR[style];
  const custom = parseStrum(strum, time);
  return { steps, ...parts, ...(custom ? { guitar: custom } : {}), drums: stretch(g.lanes, g.steps, steps) };
}

export type BarPart = "guitar" | "pianoRight" | "pianoLeft" | "bass";
export type BarEvent = { part: BarPart; step: number; len: number; chord: number; down?: boolean; mute?: boolean; soft?: boolean };

// Ang mga tutunog sa isang bar na may isa o higit pang chord.
// `chordStarts`: kung saang step nagsisimula ang bawat chord (hal. [0, 8] = palit sa beat 3 ng 4/4).
// - Bawat tama sa pattern ay gumagamit ng chord na tumutunog noon, at hindi lumalampas sa susunod na chord.
// - Kapag walang tama ang isang bahagi sa loob ng isang chord, may idinadagdag sa simula ng chord.
export function barEvents(plan: BarPlan, chordStarts: number[]): BarEvent[] {
  const spans = chordStarts.map((start, i) => ({ start, end: chordStarts[i + 1] ?? plan.steps }));
  const chordAt = (step: number) => spans.findLastIndex((s) => s.start <= step);
  const parts: [BarPart, (Hit & Partial<Strum> & { soft?: boolean })[]][] = [
    ["guitar", plan.guitar],
    ["pianoRight", plan.pianoRight],
    ["pianoLeft", plan.pianoLeft],
    ["bass", plan.bass],
  ];

  const events: BarEvent[] = [];
  for (const [part, hits] of parts) {
    if (hits.length === 0) continue;
    spans.forEach((span, chord) => {
      const inside = hits.filter((h) => h.step >= span.start && h.step < span.end);
      if (inside.length === 0) {
        events.push({ part, step: span.start, len: span.end - span.start, chord, down: part === "guitar" ? true : undefined });
      }
    });
    for (const hit of hits) {
      const chord = chordAt(hit.step);
      const len = Math.min(hit.len, spans[chord].end - hit.step);
      events.push({ part, step: hit.step, len, chord, down: hit.down, mute: hit.mute, soft: hit.soft });
    }
  }
  return events.sort((a, b) => a.step - b.step);
}
