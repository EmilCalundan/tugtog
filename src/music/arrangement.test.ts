import { describe, it, expect } from "vitest";
import { barPlan, barEvents, drumStyle, normalizeStrum, parseStrum } from "./arrangement";

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

describe("barEvents: dalawa o higit pang chord sa isang bar", () => {
  const plan = barPlan("ballad", "4/4", "verse");
  const ev = (part: string, starts: number[]) =>
    barEvents(plan, starts).filter((e) => e.part === part).map((e) => `${e.step}:${e.chord}:${e.len}`);

  it("isang chord: kapareho ng pattern", () => {
    expect(ev("bass", [0])).toEqual(["0:0:7", "8:0:7"]);
  });

  it("G sa beat 1-2, D sa 3-4: ang bawat tama ay sa chord na tumutunog noon", () => {
    expect(ev("guitar", [0, 8])).toEqual(["0:0:4", "4:0:2", "6:0:2", "10:1:2", "12:1:2", "14:1:2"]);
    expect(ev("bass", [0, 8])).toEqual(["0:0:7", "8:1:7"]);
  });

  it("hindi lumalampas ang tunog sa susunod na chord", () => {
    expect(ev("pianoLeft", [0, 8])).toEqual(["0:0:8", "8:1:8"]);
  });

  it("chord na walang tama sa pattern: may idinadagdag sa simula nito", () => {
    // 2 + 1 + 1 na beats: magsisimula ang ikatlong chord sa step 12, kung saan walang bass sa pattern
    expect(ev("bass", [0, 8, 12])).toEqual(["0:0:7", "8:1:4", "12:2:4"]);
  });
});

describe("sariling strum pattern", () => {
  it("4/4: bawat titik ay eighth note (2 na 16th)", () => {
    const g = parseStrum("D-DU-UDU", "4/4")!;
    expect(g.map((s) => [s.step, s.down])).toEqual([[0, true], [4, true], [6, false], [10, false], [12, true], [14, false]]);
    expect(g[0].len).toBe(4); // tumutunog hanggang sa susunod na strum
  });

  it("x = chuck (pababa, pinipigilan), maikli", () => {
    const g = parseStrum("D-DUxUDU", "4/4")!;
    expect(g.find((s) => s.step === 8)).toEqual({ step: 8, len: 1, down: true, mute: true });
  });

  it("tinatanggap ang maliliit na titik, tuldok at espasyo", () => {
    expect(normalizeStrum("d.du .udu")).toBe("D-DU-UDU");
    expect(parseStrum("d.du .udu", "4/4")).not.toBeNull();
  });

  it("mali ang haba o may ibang titik: null", () => {
    expect(parseStrum("D-DU", "4/4")).toBeNull();
    expect(parseStrum("D-DU-UDZ", "4/4")).toBeNull();
    expect(parseStrum("--------", "4/4")).toBeNull();
    expect(parseStrum("D-DU-UDU", "6/8")).toBeNull();
  });

  it("6/8: 12 titik, bawat isa ay 16th note", () => {
    expect(parseStrum("D-DU--D-DU--", "6/8")!.map((s) => s.step)).toEqual([0, 2, 3, 6, 8, 9]);
  });

  it("ginagamit ng barPlan kapalit ng strum ng style, pero hindi sa intro", () => {
    expect(barPlan("rock", "4/4", "verse", "D---D---").guitar.map((s) => s.step)).toEqual([0, 8]);
    expect(barPlan("rock", "4/4", "intro", "D---D---").guitar).toHaveLength(1);
    expect(barPlan("rock", "4/4", "verse", "mali").guitar).toHaveLength(8);
  });
});
