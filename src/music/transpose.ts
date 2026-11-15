const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function transposeChord(chord: string, semitones: number): string {
  const index = NOTES.indexOf(chord);
  return NOTES[index + semitones];
}