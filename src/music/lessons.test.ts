import { describe, it, expect } from "vitest";
import { explainChord, strumSlots, BEGINNER_CHORDS, buildChord } from "./lessons";

describe("explainChord", () => {
  it("major", () => {
    const e = explainChord("G");
    expect(e?.root).toBe("G");
    expect(e?.tones).toEqual(["G", "B", "D"]);
    expect(e?.formula).toBe("1 – 3 – 5");
    expect(e?.name).toBe("Major");
  });

  it("minor", () => {
    expect(explainChord("Am")?.formula).toBe("1 – ♭3 – 5");
  });

  it("seventh", () => {
    const e = explainChord("G7");
    expect(e?.tones).toEqual(["G", "B", "D", "F"]);
    expect(e?.formula).toBe("1 – 3 – 5 – ♭7");
  });

  it("slash chord: may bass", () => {
    const e = explainChord("G/B");
    expect(e?.bass).toBe("B");
    expect(e?.name).toBe("Major");
  });

  it("hindi chord: null", () => {
    expect(explainChord("hello")).toBeNull();
  });
});

describe("strumSlots", () => {
  it("ballad 4/4: 8 na eighth note", () => {
    const slots = strumSlots("ballad", "4/4");
    expect(slots.map((s) => s.count).join(" ")).toBe("1 & 2 & 3 & 4 &");
    expect(slots.map((s) => s.stroke).join("")).toBe("↓·↓↑·↑↓↑");
  });

  it("reggae: chuck (x) sa bawat &", () => {
    expect(strumSlots("reggae", "4/4").map((s) => s.stroke).join("")).toBe("·x·x·x·x");
  });

  it("6/8: 12 na 16th, bilang 1 hanggang 6", () => {
    const slots = strumSlots("ballad", "6/8");
    expect(slots.length).toBe(12);
    expect(slots.filter((s) => s.count && s.count !== "&").map((s) => s.count).join("")).toBe("123456");
    expect(slots.map((s) => s.stroke).join("")).toBe("↓·↓↑··↓·↓↑··");
  });
});

describe("BEGINNER_CHORDS", () => {
  it("mga open chord na may hugis sa gitara, nagsisimula sa Em", () => {
    expect(BEGINNER_CHORDS[0]).toBe("Em");
    expect(BEGINNER_CHORDS).toContain("G");
    expect(BEGINNER_CHORDS).toContain("C");
  });
});

describe("buildChord", () => {
  it("root at uri → pangalan ng chord", () => {
    expect(buildChord("F#", "minor")).toBe("F#m");
    expect(buildChord("Bb", "seventh")).toBe("Bb7");
    expect(buildChord("C", "major")).toBe("C");
  });
});
