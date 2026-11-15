const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLATS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

// Laging positibong natitira, hal. mod(-1, 12) = 11
function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function transposeChord(chord: string, semitones: number): string {

  // 0. Kung slash chord, i-transpose ang dalawang bahagi
  if (chord.includes("/")) {
    const [main, bass] = chord.split("/");
    return transposeChord(main, semitones) + "/" + transposeChord(bass, semitones);
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
  const newRoot = NOTES[mod(index + semitones, 12)];

  // 3. Pagdugtungin ulit
  return newRoot + quality;
}