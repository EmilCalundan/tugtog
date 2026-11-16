import { KEYS, transposeText, usesFlats } from "../music/transpose";

// Isang kanta sa setlist, kasama ang key na tutugtugin
export type SetlistSong = {
  title: string;
  artist: string;
  original_key: string;
  song_key: string;
  content: string;
};

// I-transpose ang kanta mula sa orihinal na key papunta sa key ng setlist
export function songInKey(song: SetlistSong): string {
  const semitones = KEYS.indexOf(song.song_key) - KEYS.indexOf(song.original_key);
  return transposeText(song.content, semitones, usesFlats(song.song_key));
}

// Pagsamahin ang lahat ng kanta sa iisang text para sa Stage mode
export function setlistText(songs: SetlistSong[]): string {
  return songs
    .map((song, i) => `[${i + 1}. ${song.title} · key ng ${song.song_key}]\n${songInKey(song)}`)
    .join("\n\n\n");
}
