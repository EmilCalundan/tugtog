import { describe, it, expect } from "vitest";
import { transposeChord, transposeText } from "./transpose";

describe("transposeChord", () => {
  it("itinataas ang simpleng major chord", () => {
    expect(transposeChord("G", 2)).toBe("A");
  });

  it("pinapanatili ang quality ng chord", () => {
    expect(transposeChord("Em", 2)).toBe("F#m");
  });

    it("umiikot pabalik sa simula", () => {
    expect(transposeChord("B", 1)).toBe("C");
    expect(transposeChord("A", 5)).toBe("D");
  });

  it("bumababa ng key", () => {
    expect(transposeChord("D", -2)).toBe("C");
    expect(transposeChord("C", -1)).toBe("B");
  });

    it("nakakabasa ng flats", () => {
    expect(transposeChord("Bb", 2)).toBe("C");
    expect(transposeChord("Ebm", 2)).toBe("Fm");
  });

    it("tina-transpose pati ang bass note", () => {
    expect(transposeChord("D/F#", 2)).toBe("E/G#");
    expect(transposeChord("Am/G", -2)).toBe("Gm/F");
  });
});

describe("transposeText", () => {
  it("tina-transpose ang lahat ng chord sa isang linya", () => {
    expect(transposeText("G D/F# Em C", 2)).toBe("A E/G# F#m D");
  });

  it("pinapanatili ang mga espasyo at bagong linya", () => {
    expect(transposeText("G  D\nEm C", 2)).toBe("A  E\nF#m D");
  });
});