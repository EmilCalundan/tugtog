import { describe, it, expect } from "vitest";
import { transposeChord } from "./transpose";

describe("transposeChord", () => {
  it("itinataas ang simpleng major chord", () => {
    expect(transposeChord("G", 2)).toBe("A");
  });
});