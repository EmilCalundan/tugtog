import { describe, it, expect } from "vitest";
import { bassNote, bassPosition, bassTab } from "./bass";

describe("bassNote", () => {
  it("ang root ng chord", () => {
    expect(bassNote("F#m7")).toBe("F#");
  });

  it("slash chord: ang nota pagkatapos ng /", () => {
    expect(bassNote("E/G#")).toBe("G#");
  });

  it("hindi chord: null", () => {
    expect(bassNote("Dahil")).toBeNull();
  });
});

// Para sa baguhan: E o A string lang, pinakamababang fret
describe("bassPosition", () => {
  it("A: bukas na A string", () => {
    expect(bassPosition("A")).toEqual({ string: "A", fret: 0 });
  });

  it("G#: E string, fret 4", () => {
    expect(bassPosition("G#")).toEqual({ string: "E", fret: 4 });
  });

  it("D: A string, fret 5", () => {
    expect(bassPosition("D")).toEqual({ string: "A", fret: 5 });
  });

  it("gumagana sa flat: Bb sa A string, fret 1", () => {
    expect(bassPosition("Bb")).toEqual({ string: "A", fret: 1 });
  });

  it("E: bukas na E string", () => {
    expect(bassPosition("E")).toEqual({ string: "E", fret: 0 });
  });
});

describe("bassTab", () => {
  it("dalawang beses bawat nota (half notes)", () => {
    const tab = bassTab([{ string: "A", fret: 0 }, { string: "E", fret: 4 }]);
    expect(tab).toBe(["G|------------|", "D|------------|", "A|0--0--------|", "E|------4--4--|"].join("\n"));
  });

  it("dalawang digit na fret", () => {
    const tab = bassTab([{ string: "E", fret: 10 }]);
    expect(tab.split("\n")[3]).toBe("E|10-10-|");
  });
});
