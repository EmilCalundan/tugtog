import { describe, it, expect } from "vitest";
import { transposeChord } from "./transpose";

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
});