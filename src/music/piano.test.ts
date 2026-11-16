import { describe, it, expect } from "vitest";
import { chordTones, pianoVoicing } from "./piano";

const names = (notes: { name: string }[]) => notes.map((n) => n.name);

describe("chordTones", () => {
  it("major: root, 3rd, 5th", () => {
    expect(chordTones("A")).toEqual(["A", "C#", "E"]);
  });

  it("minor, tamang spelling", () => {
    expect(chordTones("F#m")).toEqual(["F#", "A", "C#"]);
  });

  it("flat na chord: Bb, hindi A#", () => {
    expect(chordTones("Bb")).toEqual(["Bb", "D", "F"]);
  });

  it("7th chords", () => {
    expect(chordTones("G7")).toEqual(["G", "B", "D", "F"]);
    expect(chordTones("Cmaj7")).toEqual(["C", "E", "G", "B"]);
    expect(chordTones("Am7")).toEqual(["A", "C", "E", "G"]);
  });

  it("sus chords", () => {
    expect(chordTones("Dsus4")).toEqual(["D", "G", "A"]);
    expect(chordTones("Dsus2")).toEqual(["D", "E", "A"]);
  });

  it("hindi chord: walang laman", () => {
    expect(chordTones("Dahil")).toEqual([]);
  });
});

describe("pianoVoicing", () => {
  it("kaliwang kamay ang root, kanang kamay ang chord sa gitna ng keyboard", () => {
    const v = pianoVoicing("A");
    expect(names(v.left)).toEqual(["A"]);
    expect(names(v.right)).toEqual(["C#", "E", "A"]);
  });

  it("slash chord: ang bass ang nasa kaliwang kamay", () => {
    const v = pianoVoicing("E/G#");
    expect(names(v.left)).toEqual(["G#"]);
    expect(names(v.right)).toEqual(["E", "G#", "B"]);
  });

  it("ang kaliwa ay sa ibabang octave, ang kanan ay mula middle C", () => {
    const v = pianoVoicing("D");
    expect(v.left[0].midi).toBe(50);
    expect(v.right.map((n) => n.midi)).toEqual([62, 66, 69]);
  });
});
