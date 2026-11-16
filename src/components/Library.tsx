import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/useSession";

// Ang itsura ng isang kanta sa database
export type Song = {
  id: string;
  title: string;
  artist: string;
  original_key: string;
  content: string;
};

type LibraryProps = {
  chords: string;
  fromKey: string;
  onLoad: (song: Song) => void;
};

export function Library({ chords, fromKey, onLoad }: LibraryProps) {
  const session = useSession();
  const [songs, setSongs] = useState<Song[]>([]);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Kunin ang mga kanta mula sa Supabase
  async function loadSongs() {
    const { data, error } = await supabase
      .from("songs")
      .select("id, title, artist, original_key, content")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setSongs(data);
    }
  }

  // Kunin ang mga kanta tuwing may bagong login
  useEffect(() => {
    if (session) loadSongs();
  }, [session]);

  async function saveSong() {
    if (!title.trim()) {
      setMessage("Lagyan muna ng pamagat ang kanta.");
      return;
    }

    const song = { title: title.trim(), artist: artist.trim(), original_key: fromKey, content: chords };

    // Kung may bukas na kanta, i-update ito. Kung wala, gumawa ng bago.
    const { data, error } = currentId
      ? await supabase.from("songs").update(song).eq("id", currentId).select().single()
      : await supabase.from("songs").insert(song).select().single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setCurrentId(data.id);
    setMessage(currentId ? "Na-update ang kanta." : "Na-save ang kanta.");
    loadSongs();
  }

  function openSong(song: Song) {
    setCurrentId(song.id);
    setTitle(song.title);
    setArtist(song.artist);
    setMessage("");
    onLoad(song);
  }

  function newSong() {
    setCurrentId(null);
    setTitle("");
    setArtist("");
    setMessage("");
  }

  async function deleteSong(song: Song) {
    if (!window.confirm(`Burahin ang "${song.title}"?`)) return;

    const { error } = await supabase.from("songs").delete().eq("id", song.id);
    if (error) {
      setMessage(error.message);
      return;
    }

    if (song.id === currentId) newSong();
    loadSongs();
  }

  // Lalabas lang ito kapag naka-login
  if (!session) return null;

  const inputClass =
    "min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:outline-2 focus:outline-amber-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-white p-4 dark:bg-stone-900">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Mga kanta ko</h2>
        {currentId && (
          <button type="button" onClick={newSong} className="text-sm font-semibold text-amber-600 hover:underline dark:text-amber-400">
            + Bagong kanta
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input placeholder="Pamagat" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        <input placeholder="Artist (opsyonal)" value={artist} onChange={(e) => setArtist(e.target.value)} className={inputClass} />
        <button
          type="button"
          onClick={saveSong}
          className="rounded-lg bg-amber-500 px-4 py-2 font-bold text-stone-950 hover:bg-amber-400"
        >
          {currentId ? "I-update" : "I-save"}
        </button>
      </div>

      {message && <p className="text-sm text-stone-600 dark:text-stone-400">{message}</p>}

      {songs.length === 0 ? (
        <p className="text-sm text-stone-500">Wala ka pang naka-save na kanta. Lagyan ng pamagat ang chords sa ibaba at i-click ang I-save.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-stone-200 dark:divide-stone-800">
          {songs.map((song) => (
            <li key={song.id} className="flex items-center justify-between gap-3 py-2">
              <button type="button" onClick={() => openSong(song)} className="min-w-0 text-left hover:text-amber-600">
                <span className={`block truncate font-semibold ${song.id === currentId ? "text-amber-600 dark:text-amber-400" : ""}`}>
                  {song.title}
                </span>
                <span className="block truncate text-sm text-stone-500">
                  {song.artist || "Walang artist"} · key ng {song.original_key}
                </span>
              </button>
              <button
                type="button"
                onClick={() => deleteSong(song)}
                className="shrink-0 text-sm text-stone-500 hover:text-red-600"
                aria-label={`Burahin ang ${song.title}`}
              >
                Burahin
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
