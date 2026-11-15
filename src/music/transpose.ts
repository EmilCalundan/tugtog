const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function transposeChord(chord: string, semitones: number): string {

  const match = chord.match(/^([A-G]#?)(.*)$/);
  if (!match) return chord;

  const root = match[1];
  const quality = match[2];

   // 2. I-transpose ang root lang
  const index = NOTES.indexOf(root);
  const newRoot = NOTES[((index + semitones) % 12 + 12) % 12];
  
  // 3. Pagdugtungin ulit
  return newRoot + quality;
}