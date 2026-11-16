import { describe, it, expect } from "vitest";
import { songTimeline, guitarMidi, bassMidi } from "./timeline";

describe("songTimeline", () => {
  it("bawat chord sa kanta, sa pagkakasunod, kasama ang ulit at ang section", () => {
    const text = "[Verse]\nG   D/F#\nSa liwanag Mo\nEm  C\nHawak\n[Chorus]\nC";
    expect(songTimeline(text)).toEqual([
      { chord: "G", section: "Verse" },
      { chord: "D/F#", section: "Verse" },
      { chord: "Em", section: "Verse" },
      { chord: "C", section: "Verse" },
      { chord: "C", section: "Chorus" },
    ]);
  });

  it("walang section: walang laman ang section", () => {
    expect(songTimeline("A E")).toEqual([
      { chord: "A", section: "" },
      { chord: "E", section: "" },
    ]);
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
