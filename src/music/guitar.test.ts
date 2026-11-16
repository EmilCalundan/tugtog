import { describe, it, expect } from "vitest";
import { guitarShape, songChords, neckWindow } from "./guitar";

// Ang frets ay mula sa pinakamakapal na string (low E) hanggang sa pinakamanipis (high e).
// null = huwag patunugin, 0 = bukas na string
describe("guitarShape", () => {
  it("open G", () => {
    expect(guitarShape("G")?.frets).toEqual([3, 2, 0, 0, 0, 3]);
  });

  it("open Em, may numero ng daliri", () => {
    const shape = guitarShape("Em");
    expect(shape?.frets).toEqual([0, 2, 2, 0, 0, 0]);
    expect(shape?.fingers).toEqual([0, 2, 3, 0, 0, 0]);
  });

  it("open C na hindi pinapatunog ang low E", () => {
    expect(guitarShape("C")?.frets).toEqual([null, 3, 2, 0, 1, 0]);
  });

  it("slash chord na kilala: D/F#", () => {
    expect(guitarShape("D/F#")?.frets).toEqual([2, null, 0, 2, 3, 2]);
  });

  it("F ay barre sa fret 1 (hugis E)", () => {
    const shape = guitarShape("F");
    expect(shape?.frets).toEqual([1, 3, 3, 2, 1, 1]);
    expect(shape?.barre).toBe(1);
  });

  it("Bm ay barre sa fret 2 (hugis Am)", () => {
    expect(guitarShape("Bm")?.frets).toEqual([null, 2, 4, 4, 3, 2]);
  });

  it("F#m ay barre sa fret 2 (hugis Em)", () => {
    expect(guitarShape("F#m")?.frets).toEqual([2, 4, 4, 2, 2, 2]);
  });

  it("gumagana rin sa flat, hal. Bb", () => {
    expect(guitarShape("Bb")?.frets).toEqual([null, 1, 3, 3, 3, 1]);
  });

  it("hindi kilalang slash chord: ginagamit ang main chord", () => {
    expect(guitarShape("Am/F#")?.frets).toEqual(guitarShape("Am")?.frets);
  });

  it("hindi kilalang quality: ginagamit ang simpleng triad", () => {
    expect(guitarShape("G13")?.frets).toEqual(guitarShape("G")?.frets);
    expect(guitarShape("Gm9")?.frets).toEqual(guitarShape("Gm")?.frets);
  });

  it("hindi chord: null", () => {
    expect(guitarShape("Dahil")).toBeNull();
  });
});

describe("songChords", () => {
  it("kinukuha ang chords sa pagkakasunod, walang ulit", () => {
    const text = "[Verse]\nG     D/F#\nSa liwanag Mo\nEm    C\nHawak ang kamay\nG     D/F#";
    expect(songChords(text)).toEqual(["G", "D/F#", "Em", "C"]);
  });
});

describe("neckWindow", () => {
  it("open chord: nagsisimula sa nut", () => {
    expect(neckWindow([3, 2, 0, 0, 0, 3])).toBe(0);
  });

  it("mataas na barre: nagsisimula bago ang barre", () => {
    expect(neckWindow([null, 7, 9, 9, 9, 7])).toBe(6);
  });

  it("may capo: nagsisimula sa capo", () => {
    expect(neckWindow([3, 2, 0, 0, 0, 3], 2)).toBe(2);
  });
});
