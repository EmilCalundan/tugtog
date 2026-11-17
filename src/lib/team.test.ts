import { describe, it, expect } from "vitest";
import { instrumentTab, nameFromEmail, inviteLink, songLink, isInstrument } from "./team";

describe("instrumentTab", () => {
  it("ang bawat instrumento ay may sariling tab; ang boses ay sa Chords", () => {
    expect(instrumentTab("gitara")).toBe("gitara");
    expect(instrumentTab("bass")).toBe("bass");
    expect(instrumentTab("vocals")).toBe("chords");
  });
});

describe("isInstrument", () => {
  it("tinatanggap lang ang kilalang instrumento", () => {
    expect(isInstrument("drums")).toBe(true);
    expect(isInstrument("kazoo")).toBe(false);
  });
});

describe("nameFromEmail", () => {
  it("ang bahagi bago ang @, malaki ang unang letra", () => {
    expect(nameFromEmail("emil.calundan@gmail.com")).toBe("Emil.calundan");
  });

  it("walang email: 'Miyembro'", () => {
    expect(nameFromEmail(undefined)).toBe("Miyembro");
  });

  it("hindi lalampas sa 40 letra", () => {
    expect(nameFromEmail(`${"a".repeat(60)}@x.com`).length).toBe(40);
  });
});

describe("mga link", () => {
  it("invite link", () => {
    expect(inviteLink("https://tugtog.app", "abc")).toBe("https://tugtog.app/sali/abc");
  });

  it("kanta sa key ng setlist at sa tab ng instrumento", () => {
    expect(songLink("s1", "Bb", "bass")).toBe("/kanta/s1?key=Bb&tab=bass");
  });

  it("walang instrumento: key lang", () => {
    expect(songLink("s1", "F#")).toBe("/kanta/s1?key=F%23");
  });

  it("boses: walang tab (Chords na ang default)", () => {
    expect(songLink("s1", "G", "vocals")).toBe("/kanta/s1?key=G");
  });
});
