import { describe, it, expect } from "vitest";
import { nextChord, barWindow, songBars, guitarMidi, bassMidi, sectionRanges, nextBar } from "./timeline";

describe("songBars", () => {
  it("walang |: bawat chord ay isang buong bar, kasama ang section", () => {
    const text = "[Verse]\nG   D/F#\nSa liwanag Mo\n[Chorus]\nC";
    expect(songBars(text, 4)).toEqual([
      { section: "Verse", chords: [{ chord: "G", start: 0, beats: 4 }] },
      { section: "Verse", chords: [{ chord: "D/F#", start: 0, beats: 4 }] },
      { section: "Chorus", chords: [{ chord: "C", start: 0, beats: 4 }] },
    ]);
  });

  it("may |: dalawang chord sa isang bar ay hati", () => {
    expect(songBars("| G  D | Em |", 4)).toEqual([
      { section: "", chords: [{ chord: "G", start: 0, beats: 2 }, { chord: "D", start: 2, beats: 2 }] },
      { section: "", chords: [{ chord: "Em", start: 0, beats: 4 }] },
    ]);
  });

  it("tatlong chord sa 4/4: 2 + 1 + 1", () => {
    expect(songBars("| C G Am |", 4)[0].chords.map((c) => c.beats)).toEqual([2, 1, 1]);
  });

  it("6/8 (6 na eighth bawat bar): 3 + 3", () => {
    expect(songBars("| G Em |", 6)[0].chords).toEqual([
      { chord: "G", start: 0, beats: 3 },
      { chord: "Em", start: 3, beats: 3 },
    ]);
  });

  it("puwedeng ihalo: may linyang may | at wala", () => {
    expect(songBars("G\n| C D |", 4).length).toBe(2);
  });
});

describe("guitarMidi", () => {
  it("open G sa standard tuning", () => {
    expect(guitarMidi([3, 2, 0, 0, 0, 3])).toEqual([43, 47, 50, 55, 59, 67]);
  });

  it("hindi patutunugin = null, at nadadagdag ang capo", () => {
    expect(guitarMidi([null, 0, 2, 2, 2, 0], 2)).toEqual([null, 47, 54, 59, 63, 66]);
  });
});

describe("bassMidi", () => {
  it("E string at A string", () => {
    expect(bassMidi({ string: "E", fret: 0 })).toBe(28);
    expect(bassMidi({ string: "A", fret: 5 })).toBe(38);
  });
});

describe("sectionRanges", () => {
  const bar = (section: string) => ({ section, chords: [{ chord: "G", start: 0, beats: 4 }] });

  it("magkakasunod na bar na pareho ang section ay iisang bahagi", () => {
    const bars = [bar("Intro"), bar("Verse"), bar("Verse"), bar("Chorus"), bar("Chorus"), bar("Verse"), bar("Chorus")];
    expect(sectionRanges(bars)).toEqual([
      { name: "Intro", start: 0, end: 1 },
      { name: "Verse", start: 1, end: 3 },
      { name: "Chorus", start: 3, end: 5 },
      { name: "Verse (2)", start: 5, end: 6 },
      { name: "Chorus (2)", start: 6, end: 7 },
    ]);
  });

  it("walang section: 'Start'", () => {
    expect(sectionRanges([bar(""), bar("")])).toEqual([{ name: "Start", start: 0, end: 2 }]);
  });
});

describe("nextBar", () => {
  it("walang loop: susunod na bar, at babalik sa simula sa dulo ng kanta", () => {
    expect(nextBar(2, 10, null)).toBe(3);
    expect(nextBar(9, 10, null)).toBe(0);
  });

  it("may loop: babalik sa simula ng bahagi", () => {
    const loop = { name: "Chorus", start: 3, end: 5 };
    expect(nextBar(3, 10, loop)).toBe(4);
    expect(nextBar(4, 10, loop)).toBe(3);
  });

  it("nasa labas ng loop (hal. binago habang tumutugtog): pupunta sa simula ng loop", () => {
    expect(nextBar(8, 10, { name: "Verse", start: 1, end: 3 })).toBe(1);
  });
});

describe("nextChord", () => {
  const bars = songBars("| G  D | Em |\n| C |", 4);
  it("ang kasunod sa parehong bar", () => {
    expect(nextChord(bars, 0, "G")).toBe("D");
  });
  it("ang huli sa bar: unang chord ng susunod na bar", () => {
    expect(nextChord(bars, 0, "D")).toBe("Em");
  });
  it("ang huling bar: babalik sa simula", () => {
    expect(nextChord(bars, 2, "C")).toBe("G");
  });
  it("walang bar: blangko", () => {
    expect(nextChord([], 0, "G")).toBe("");
  });
});

describe("barWindow", () => {
  it("unang pahina", () => {
    expect(barWindow(20, 3, 6)).toBe(0);
  });
  it("ikalawang pahina", () => {
    expect(barWindow(20, 7, 6)).toBe(6);
  });
  it("sa dulo: puno pa rin ang arko", () => {
    expect(barWindow(20, 19, 6)).toBe(14);
  });
  it("maikling kanta: mula 0", () => {
    expect(barWindow(4, 3, 6)).toBe(0);
  });
});
