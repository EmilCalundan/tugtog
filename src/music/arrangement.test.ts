import { describe, it, expect } from "vitest";
import { barPlan, drumStyle } from "./arrangement";

const steps = (hits: { step: number }[]) => hits.map((h) => h.step);

describe("barPlan 4/4", () => {
  it("16 na hakbang (16th notes) bawat bar", () => {
    expect(barPlan("ballad", "4/4", "verse").steps).toBe(16);
  });

  it("ballad: strum na ↓ · ↓↑ · ↑ ↓↑", () => {
    const g = barPlan("ballad", "4/4", "verse").guitar;
    expect(steps(g)).toEqual([0, 4, 6, 10, 12, 14]);
    expect(g.map((s) => (s.down ? "D" : "U")).join("")).toBe("DDUUDU");
  });

  it("reggae: maiikling chuck sa bawat '&', walang strum sa beat", () => {
    const g = barPlan("reggae", "4/4", "verse").guitar;
    expect(steps(g)).toEqual([2, 6, 10, 14]);
    expect(g.every((s) => s.mute)).toBe(true);
  });

  it("rock: puro pababang strum sa bawat eighth", () => {
    const g = barPlan("rock", "4/4", "verse").guitar;
    expect(steps(g)).toEqual([0, 2, 4, 6, 8, 10, 12, 14]);
    expect(g.every((s) => s.down)).toBe(true);
  });

  it("pop: bass sa bawat beat", () => {
    expect(steps(barPlan("pop", "4/4", "verse").bass)).toEqual([0, 4, 8, 12]);
  });

  it("ang drums ay galing sa groove ng style", () => {
    const drums = barPlan("ballad", "4/4", "chorus").drums;
    expect(drums.ride?.filter(Boolean).length).toBe(8);
    expect(drums.crash?.[0]).toBe(1);
  });
});

describe("barPlan 6/8", () => {
  it("12 na hakbang (16th notes) bawat bar, kahit anong style", () => {
    expect(barPlan("pop", "6/8", "verse").steps).toBe(12);
  });

  it("strum na ↓ ↓↑ ↓ ↓↑", () => {
    const g = barPlan("ballad", "6/8", "verse").guitar;
    expect(steps(g)).toEqual([0, 2, 3, 6, 8, 9]);
    expect(g.map((s) => (s.down ? "D" : "U")).join("")).toBe("DDUDDU");
  });

  it("ang 6/8 groove (6 na eighth) ay pinalawak sa 12 na hakbang", () => {
    const drums = barPlan("ballad", "6/8", "verse").drums;
    expect(drums.snare?.length).toBe(12);
    expect(drums.snare?.indexOf(1)).toBe(6);
    expect(drums.kick?.indexOf(1)).toBe(0);
  });
});

describe("drumStyle", () => {
  it("6/8 ay laging sixeight; 4/4 ay ang style mismo", () => {
    expect(drumStyle("reggae", "6/8")).toBe("sixeight");
    expect(drumStyle("reggae", "4/4")).toBe("reggae");
  });
});

describe("barPlan ng intro at outro", () => {
  it("isang mahabang strum lang bawat bar", () => {
    const g = barPlan("pop", "4/4", "intro").guitar;
    expect(g).toEqual([{ step: 0, len: 16, down: true }]);
  });

  it("bass at piano: isang beses sa 1, buong bar", () => {
    const plan = barPlan("rock", "4/4", "outro");
    expect(plan.bass).toEqual([{ step: 0, len: 15 }]);
    expect(steps(plan.pianoRight)).toEqual([0]);
  });

  it("6/8 intro: isang strum, 12 hakbang", () => {
    expect(barPlan("ballad", "6/8", "intro").guitar).toEqual([{ step: 0, len: 12, down: true }]);
  });
});
