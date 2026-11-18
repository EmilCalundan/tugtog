import { describe, it, expect } from "vitest";
import { songInKey, setlistText } from "./setlist";

const song = { title: "Awit", artist: "", original_key: "G", song_key: "Bb", content: "G   C\nDahil sa Ama" };

describe("setlist", () => {
  it("tina-transpose ang kanta sa key ng setlist, gamit ang flats sa flat key", () => {
    expect(songInKey(song)).toBe("Bb   Eb\nDahil sa Ama");
  });

  it("pinagsasama ang mga kanta na may pamagat at key", () => {
    expect(setlistText([song])).toBe("[1. Awit · key of Bb]\nBb   Eb\nDahil sa Ama");
  });
});
