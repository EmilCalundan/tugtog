export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLATS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
export const KEYS = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const FLAT_KEYS = ["F", "Bb", "Eb", "Ab", "Db"];

// Laging positibong natitira, hal. mod(-1, 12) = 11
function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

// Flats ba ang ginagamit sa key na ito?
export function usesFlats(key: string): boolean {
  return FLAT_KEYS.includes(key);
}

export function transposeChord(chord: string, semitones: number, useFlats = false): string {

  // 0. Kung slash chord, i-transpose ang dalawang bahagi
  if (chord.includes("/")) {
    const [main, bass] = chord.split("/");
    return transposeChord(main, semitones, useFlats) + "/" + transposeChord(bass, semitones, useFlats);
  }

  // 1. Hatiin ang chord sa root at quality
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const root = match[1];
  const quality = match[2];

  // 2. I-transpose ang root lang
  let index = NOTES.indexOf(root);
  if (index === -1) {
    index = FLATS.indexOf(root);
  }

  const names = useFlats ? FLATS : NOTES;
  const newRoot = names[mod(index + semitones, 12)];

  return newRoot + quality;
}

// I-transpose ang bawat chord sa isang buong text, at panatilihin ang mga espasyo
export function transposeText(text: string, semitones: number, useFlats = false): string {
  return text.replace(/\S+/g, (chord) => transposeChord(chord, semitones, useFlats));
}