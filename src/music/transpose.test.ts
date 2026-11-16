import { describe, it, expect } from "vitest";
import { transposeChord, transposeText, usesFlats, suggestCapo, toNashville, nashvilleText, isChord, isChordLine } from "./transpose";

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

describe("flats sa flat keys", () => {
  it("alam kung aling key ang gumagamit ng flats", () => {
    expect(usesFlats("F")).toBe(true);
    expect(usesFlats("Bb")).toBe(true);
    expect(usesFlats("G")).toBe(false);
  });

  it("isinusulat ang chords bilang flats kapag hiningi", () => {
    expect(transposeChord("A", 1, true)).toBe("Bb");
    expect(transposeChord("D/F#", -1, true)).toBe("Db/F");
    expect(transposeText("G C", -2, true)).toBe("F Bb");
  });
});

describe("suggestCapo", () => {
  it("walang capo kapag madali na ang key", () => {
    expect(suggestCapo("G")).toEqual({ capo: 0, shape: "G" });
  });

  it("nagmumungkahi ng capo para sa mahirap na key", () => {
    expect(suggestCapo("Bb")).toEqual({ capo: 1, shape: "A" });
    expect(suggestCapo("Eb")).toEqual({ capo: 1, shape: "D" });
    expect(suggestCapo("F#")).toEqual({ capo: 2, shape: "E" });
  });
});

describe("Nashville numbers", () => {
  it("isinusulat ang chord bilang numero ayon sa key", () => {
    expect(toNashville("G", "G")).toBe("1");
    expect(toNashville("C", "G")).toBe("4");
    expect(toNashville("Em", "G")).toBe("6m");
    expect(toNashville("Bb", "F")).toBe("4");
  });

  it("gumagana sa slash chords at sa buong linya", () => {
    expect(toNashville("D/F#", "G")).toBe("5/7");
    expect(nashvilleText("G D/F# Em C", "G")).toBe("1 5/7 6m 4");
  });
});

describe("chords at lyrics", () => {
  it("alam kung chord ang isang salita", () => {
    for (const chord of ["G", "Em", "Cmaj7", "Asus4", "D/F#", "F#m7", "Bb", "Gm7b5", "Cadd9", "em"]) {
      expect(isChord(chord)).toBe(true);
    }
    for (const word of ["Dahil", "Ama", "ako", "[Verse", "Chorus", "Be"]) {
      expect(isChord(word)).toBe(false);
    }
  });

  it("alam kung chord line ang isang linya", () => {
    expect(isChordLine("G   D/F#   Em")).toBe(true);
    expect(isChordLine("Sa liwanag Mo")).toBe(false);
    expect(isChordLine("Dahil sa Ama")).toBe(false);
    expect(isChordLine("")).toBe(false);
  });

  it("chords lang ang tina-transpose, hindi ang lyrics", () => {
    const song = "[Verse]\nG       D\nDahil sa Ama";
    expect(transposeText(song, 2)).toBe("[Verse]\nA       E\nDahil sa Ama");
  });
});