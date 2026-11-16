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
 // Gawing malaking titik ang unang letra, para gumana rin ang "em" o "g"
  const normalized = chord.charAt(0).toUpperCase() + chord.slice(1);
  const match = normalized.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return null;
  return { root: match[1], quality: match[2] };
}

// ---------- Chords at lyrics ----------

// Chord ba ang salitang ito? hal. "Em" ✅, "Cmaj7" ✅, "D/F#" ✅, "Dahil" ❌
const CHORD_PATTERN = /^[A-G][#b]?(maj|min|m|M|dim|aug|sus|add)?\d*((sus|add|maj|b|#)\d+)*(\/[A-G][#b]?)?$/;

export function isChord(word: string): boolean {
  const normalized = word.charAt(0).toUpperCase() + word.slice(1);
  return CHORD_PATTERN.test(normalized);
}

// Chord line ba ito? Oo kung lahat ng salita ay chord.
export function isChordLine(line: string): boolean {
  const words = line.trim().split(/\s+/);
  return line.trim() !== "" && words.every(isChord);
}

// Section label ba ito? hal. "[Verse]", "[Chorus 2]"
export function isSectionLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("[") && trimmed.endsWith("]");
}

// Baguhin ang bawat chord sa mga chord line lang, at panatilihin ang lyrics at mga espasyo
function mapChordLines(text: string, change: (chord: string) => string): string {
  return text
    .split("\n")
    .map((line) => (isChordLine(line) ? line.replace(/\S+/g, change) : line))
    .join("\n");
}

// ---------- Spelling ng nota ayon sa key ----------

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const LETTER_PITCH = [0, 2, 4, 5, 7, 9, 11];

// Para sa bawat layo mula sa key (0 hanggang 11): aling letra ng scale ang gagamitin.
// hal. 10 semitones mula sa C = ika-7 letra (B), kaya "Bb" at hindi "A#"
const DEGREE_FOR_DISTANCE = [0, 0, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6];

// Isulat ang nota ayon sa key, hal. sa key ng C: Bb (hindi A#), at F# (hindi Gb)
export function spellNote(pitch: number, key: string): string {
  const distance = mod(pitch - noteIndex(key), 12);
  const letterIndex = (LETTERS.indexOf(key.charAt(0)) + DEGREE_FOR_DISTANCE[distance]) % 7;
  const letter = LETTERS[letterIndex];
  const offset = mod(pitch - LETTER_PITCH[letterIndex] + 6, 12) - 6;

  const name = offset === 0 ? letter : offset === 1 ? letter + "#" : offset === -1 ? letter + "b" : "";

  // Iwasan ang mga pangalang nakalilito sa users, gaya ng E#, B#, Cb, Fb, o double sharp
  if (name === "" || ["E#", "B#", "Cb", "Fb"].includes(name)) return NOTES[mod(pitch, 12)];
  return name;
}

// ---------- Transpose ----------

// Flats ba ang ginagamit sa key na ito?
export function usesFlats(key: string): boolean {
  return FLAT_KEYS.includes(key);
}

// Kapag may ibinigay na key, isusulat ang mga nota ayon sa key na iyon
export function transposeChord(chord: string, semitones: number, key?: string): string {
  if (chord.includes("/")) {
    const [main, bass] = chord.split("/");
    const newMain = transposeChord(main, semitones, key);
    // Isulat ang bass ayon sa root ng chord, hal. E/G# (hindi E/Ab) at C/Bb (hindi C/A#)
    const newRoot = splitChord(newMain)?.root ?? key;
    return newMain + "/" + transposeChord(bass, semitones, newRoot);
  }

  const parts = splitChord(chord);
  if (!parts) return chord;

  const pitch = mod(noteIndex(parts.root) + semitones, 12);
  const root = key ? spellNote(pitch, key) : NOTES[pitch];
  return root + parts.quality;
}

// I-transpose ang chords sa isang buong kanta. Hindi ginagalaw ang lyrics.
export function transposeText(text: string, semitones: number, key?: string): string {
  return mapChordLines(text, (chord) => transposeChord(chord, semitones, key));
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
  return mapChordLines(text, (chord) => toNashville(chord, key));
}