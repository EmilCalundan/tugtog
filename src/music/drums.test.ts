import { describe, it, expect } from "vitest";
import { groove, countLabels, stepSeconds, sectionKind, songSections, tapTempo } from "./drums";

const hitsOf = (lane: number[] | undefined) => (lane ?? []).flatMap((v, i) => (v ? [i] : []));

describe("groove", () => {
  it("ballad verse: hi-hat 8ths, snare sa 2 at 4, kick sa 1 at 3", () => {
    const g = groove("ballad", "verse");
    expect(g.steps).toBe(16);
    expect(hitsOf(g.lanes.hihat)).toEqual([0, 2, 4, 6, 8, 10, 12, 14]);
    expect(hitsOf(g.lanes.snare)).toEqual([4, 12]);
    expect(hitsOf(g.lanes.kick)).toEqual([0, 8]);
  });

  it("chorus: ride imbes na hi-hat, at crash sa 1", () => {
    const g = groove("ballad", "chorus");
    expect(g.lanes.hihat).toBeUndefined();
    expect(hitsOf(g.lanes.ride)).toEqual([0, 2, 4, 6, 8, 10, 12, 14]);
    expect(hitsOf(g.lanes.crash)).toEqual([0]);
  });

  it("pop: may dagdag na kick sa & ng 3", () => {
    expect(hitsOf(groove("pop", "verse").lanes.kick)).toEqual([0, 8, 10]);
  });

  it("6/8: anim na hakbang, snare sa 4", () => {
    const g = groove("sixeight", "verse");
    expect(g.steps).toBe(6);
    expect(hitsOf(g.lanes.snare)).toEqual([3]);
    expect(hitsOf(g.lanes.kick)).toEqual([0]);
  });
});

describe("countLabels", () => {
  it("4/4 na 16ths", () => {
    expect(countLabels(16).slice(0, 5)).toEqual(["1", "e", "&", "a", "2"]);
  });

  it("6/8", () => {
    expect(countLabels(6)).toEqual(["1", "2", "3", "4", "5", "6"]);
  });
});

describe("stepSeconds", () => {
  it("4/4: isang 16th sa 60 BPM ay 0.25 segundo", () => {
    expect(stepSeconds(60, 16)).toBeCloseTo(0.25);
  });

  it("6/8: ang BPM ay bawat 3 eighth, kaya 60 BPM = 1/3 segundo bawat eighth", () => {
    expect(stepSeconds(60, 6)).toBeCloseTo(1 / 3);
  });
});

describe("sections", () => {
  it("chorus ba o hindi", () => {
    expect(sectionKind("Chorus 2")).toBe("chorus");
    expect(sectionKind("Koro")).toBe("chorus");
    expect(sectionKind("Verse 1")).toBe("verse");
  });

  it("kinukuha ang mga section ng kanta, walang ulit", () => {
    expect(songSections("[Verse 1]\nG\n[Chorus]\nC\n[Verse 2]\nG\n[Chorus]")).toEqual(["Verse 1", "Chorus", "Verse 2"]);
  });
});

describe("tapTempo", () => {
  it("kailangan ng hindi bababa sa 2 tap", () => {
    expect(tapTempo([1000])).toBeNull();
  });

  it("ang average ng mga pagitan, sa BPM", () => {
    expect(tapTempo([0, 500, 1000, 1500])).toBe(120);
    expect(tapTempo([0, 830, 1660])).toBe(72);
  });

  it("ang huling 5 tap lang ang binibilang", () => {
    expect(tapTempo([0, 1000, 2000, 2500, 3000, 3500, 4000])).toBe(120);
  });

  it("hindi lalampas sa 40 hanggang 160", () => {
    expect(tapTempo([0, 100])).toBe(160);
    expect(tapTempo([0, 3000])).toBe(40);
  });
});
