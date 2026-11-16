const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLATS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

// Ang 12 key, isinulat sa paraang ginagamit ng mga musikero
export const KEYS = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const FLAT_KEYS = ["F", "Bb", "Eb", "Ab", "Db"];

// Mga chord shape na madaling tugtugin sa gitara nang walang barre
const OPEN_SHAPES = ["C", "G", "D", "A", "E"];

// Ang posisyon ng bawat semitone sa scale, mula sa key
const DEGREES = ["1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"];

// ---------- Mga helper ----------

// Laging positibong natitira, hal. mod(-1, 12) = 11
function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

// Hanapin ang posisyon ng nota (0 hanggang 11), sharp man o flat
function noteIndex(note: string): number {
  const index = NOTES.indexOf(note);
  return index !== -1 ? index : FLATS.indexOf(note);
}

// Hatiin ang chord sa root at quality, hal. "Em" → { root: "E", quality: "m" }
function splitChord(chord: string): { root: string; quality: string } | null {
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return null;
  return { root: match[1], quality: match[2] };
}

// ---------- Transpose ----------

// Flats ba ang ginagamit sa key na ito?
export function usesFlats(key: string): boolean {
  return FLAT_KEYS.includes(key);
}

export function transposeChord(chord: string, semitones: number, useFlats = false): string {
  if (chord.includes("/")) {
    const [main, bass] = chord.split("/");
    return transposeChord(main, semitones, useFlats) + "/" + transposeChord(bass, semitones, useFlats);
  }

  const parts = splitChord(chord);
  if (!parts) return chord;

  const names = useFlats ? FLATS : NOTES;
  return names[mod(noteIndex(parts.root) + semitones, 12)] + parts.quality;
}

// I-transpose ang bawat chord sa isang buong text, at panatilihin ang mga espasyo
export function transposeText(text: string, semitones: number, useFlats = false): string {
  return text.replace(/\S+/g, (chord) => transposeChord(chord, semitones, useFlats));
}

// ---------- Capo ----------

// Hanapin ang pinakamababang capo para magamit ang madaling chord shapes
export function suggestCapo(key: string): { capo: number; shape: string } {
  const keyIndex = KEYS.indexOf(key);

  for (let capo = 0; capo < 12; capo++) {
    const shape = KEYS[mod(keyIndex - capo, 12)];
    if (OPEN_SHAPES.includes(shape)) {
      return { capo, shape };
    }
  }

  return { capo: 0, shape: key };
}

// ---------- Nashville numbers ----------

// Isulat ang chord bilang Nashville number, hal. Em sa key ng G = 6m
export function toNashville(chord: string, key: string): string {
  if (chord.includes("/")) {
    const [main, bass] = chord.split("/");
    return toNashville(main, key) + "/" + toNashville(bass, key);
  }

  const parts = splitChord(chord);
  if (!parts) return chord;

  return DEGREES[mod(noteIndex(parts.root) - KEYS.indexOf(key), 12)] + parts.quality;
}

export function nashvilleText(text: string, key: string): string {
  return text.replace(/\S+/g, (chord) => toNashville(chord, key));
}