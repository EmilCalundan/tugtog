// Mga pure helper para sa banda (walang database dito, kaya madaling i-test)

export type Instrument = "vocals" | "gitara" | "piano" | "bass" | "drums";

export const INSTRUMENTS: { id: Instrument; label: string }[] = [
  { id: "vocals", label: "Boses" },
  { id: "gitara", label: "Gitara" },
  { id: "piano", label: "Piano" },
  { id: "bass", label: "Bass" },
  { id: "drums", label: "Drums" },
];

export function isInstrument(value: string): value is Instrument {
  return INSTRUMENTS.some((i) => i.id === value);
}

export function instrumentLabel(id: Instrument): string {
  return INSTRUMENTS.find((i) => i.id === id)?.label ?? id;
}

// Anong tab ng kanta ang bubuksan para sa instrumento. Ang boses ay sa Chords (lyrics at chords).
export function instrumentTab(instrument: Instrument): "chords" | Exclude<Instrument, "vocals"> {
  return instrument === "vocals" ? "chords" : instrument;
}

// Panimulang pangalan mula sa email, hal. "emil@gmail.com" → "Emil"
export function nameFromEmail(email: string | undefined): string {
  const local = email?.split("@")[0]?.trim();
  if (!local) return "Miyembro";
  return (local.charAt(0).toUpperCase() + local.slice(1)).slice(0, 40);
}

export function inviteLink(origin: string, code: string): string {
  return `${origin}/sali/${code}`;
}

// Link sa kanta, nakabukas sa key ng setlist at sa tab ng instrumento
export function songLink(songId: string, key: string, instrument?: Instrument): string {
  const params = new URLSearchParams({ key });
  if (instrument && instrumentTab(instrument) !== "chords") params.set("tab", instrumentTab(instrument));
  return `/kanta/${songId}?${params.toString()}`;
}
