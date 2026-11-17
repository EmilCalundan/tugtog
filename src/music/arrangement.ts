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

export function barPlan(style: SongStyle, time: TimeSignature, kind: Kind): BarPlan {
  const steps = time === "6/8" ? 12 : 16;
  const g = groove(drumStyle(style, time), kind);
  const parts = time === "6/8" ? SIX_EIGHT : FOUR[style];
  return { steps, ...parts, drums: stretch(g.lanes, g.steps, steps) };
}
