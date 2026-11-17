import { describe, it, expect } from "vitest";
import { songBars, guitarMidi, bassMidi } from "./timeline";

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
