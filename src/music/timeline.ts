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

// Linyang walang "|": ang layo ng chord sa kasunod nito ang nagsasabi kung gaano ito katagal.
// Ang pinakamalaking pagitan sa linya = isang buong bar; mas maikli = kalahating bar;
// halos magkadikit (hal. "D G A" sa iisang salita) = isang beat bawat isa.
// Kapag halos pantay ang pagitan (o siksik ang pagkakasulat, hal. "G D Em C"), isang bar bawat chord.
function spacedBars(line: string, beatsPerBar: number): BarChord[][] {
  const found = [...line.matchAll(/[^\s|]+/g)].map((m) => ({ chord: m[0], at: m.index ?? 0 }));
  const whole = () => found.map(({ chord }) => [{ chord, start: 0, beats: beatsPerBar }]);
  if (found.length < 3) return whole();

  const gaps = found.slice(0, -1).map((c, i) => found[i + 1].at - c.at);
  const widest = Math.max(...gaps);
  const narrowest = Math.min(...gaps);
  if (widest < 6 || narrowest / widest >= 0.6) return whole();

  const half = Math.max(1, Math.round(beatsPerBar / 2));
  const quarter = Math.max(1, Math.round(beatsPerBar / 4));
  const bars: BarChord[][] = [];
  let bar: BarChord[] = [];
  let used = 0;
  found.forEach(({ chord }, i) => {
    const last = i === found.length - 1;
    const ratio = last ? 1 : gaps[i] / widest;
    const wanted = ratio >= 0.75 ? beatsPerBar : ratio >= 0.35 ? half : quarter;
    // Hindi lalampas sa bar: kung kulang ang natitira, iyon na lang ang tagal
    const beats = last && used > 0 ? beatsPerBar - used : Math.min(wanted, beatsPerBar - used);
    bar.push({ chord, start: used, beats });
    used += beats;
    if (used >= beatsPerBar) {
      bars.push(bar);
      bar = [];
      used = 0;
    }
  });
  return bars;
}

// Lahat ng bar ng kanta mula simula hanggang dulo.
// Walang "|": ayon sa layo ng mga chord (tingnan ang spacedBars). May "|": bawat pagitan ng "|" ay isang bar.
// beatsPerBar: 4 sa 4/4 (quarter notes), 6 sa 6/8 (eighth notes).
export function songBars(text: string, beatsPerBar: number): Bar[] {
  const bars: Bar[] = [];
  let section = "";
  for (const line of text.split("\n")) {
    if (isSectionLine(line)) {
      section = line.trim().slice(1, -1).trim();
    } else if (isChordLine(line)) {
      if (line.includes("|")) {
        const groups = line.split("|").map(chordTokens).filter((g) => g.length > 0);
        for (const group of groups) bars.push({ section, chords: splitBar(group, beatsPerBar) });
      } else {
        for (const chords of spacedBars(line, beatsPerBar)) bars.push({ section, chords });
      }
    }
  }
  return bars;
}

// Ang susunod na chord pagkatapos ng tumutunog ngayon: sa parehong bar, o sa unang chord ng susunod na bar
export function nextChord(bars: Bar[], barIndex: number, chord: string): string {
  const bar = bars[barIndex];
  if (!bar) return "";
  const at = bar.chords.findIndex((c) => c.chord === chord);
  if (at >= 0 && at < bar.chords.length - 1) return bar.chords[at + 1].chord;
  const next = bars[barIndex + 1] ?? bars[0];
  return next?.chords[0]?.chord ?? "";
}

// Ang unang bar ng "bintana" ng mga bar na ipinapakita sa arko (hal. 6 bawat pahina),
// para laging puno ang arko kahit nasa dulo na ng kanta
export function barWindow(total: number, current: number, size: number): number {
  if (total <= size) return 0;
  const start = Math.floor(current / size) * size;
  return Math.min(start, total - size);
}

export type SectionRange = { name: string; start: number; end: number };

// Ang mga bahagi ng kanta bilang hanay ng bar (start kasama, end hindi kasama).
// Kapag umulit ang pangalan, may numero: "Chorus", "Chorus (2)".
export function sectionRanges(bars: Bar[]): SectionRange[] {
  const ranges: SectionRange[] = [];
  const seen = new Map<string, number>();
  bars.forEach((bar, i) => {
    const last = ranges[ranges.length - 1];
    if (last && bars[i - 1].section === bar.section) {
      last.end = i + 1;
      return;
    }
    const base = bar.section || "Start";
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    ranges.push({ name: count > 1 ? `${base} (${count})` : base, start: i, end: i + 1 });
  });
  return ranges;
}

// Ang susunod na bar. Kapag may loop, nananatili sa loob ng bahaging iyon.
export function nextBar(current: number, total: number, loop: SectionRange | null): number {
  if (loop) {
    const next = current + 1;
    return next >= loop.start && next < loop.end ? next : loop.start;
  }
  return (current + 1) % total;
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
