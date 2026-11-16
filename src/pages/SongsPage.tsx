import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useSession } from "../lib/useSession";
import { listSongs } from "../lib/songs";
import type { Song } from "../lib/songs";
import { listSetlists } from "../lib/setlists";
import type { Setlist } from "../lib/setlists";
import { ui } from "../components/ui";
import { ChevronIcon, ListIcon, PlusIcon, SearchIcon } from "../components/Icons";

export function SongsPage() {
  const session = useSession();
  const [songs, setSongs] = useState<Song[] | null>(null);
  const [nextSetlist, setNextSetlist] = useState<Setlist | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!session) return;
    listSongs().then(setSongs).catch(() => setSongs([]));
    listSetlists().then((lists) => setNextSetlist(lists[0] ?? null)).catch(() => {});
  }, [session]);

  if (session === undefined) return null;
  if (session === null) return <Welcome />;

  const q = query.trim().toLowerCase();
  const shown = (songs ?? []).filter(
    (song) => song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q),
  );

  return (
    <div className={ui.page}>
      <div className="flex items-baseline justify-between">
        <h1 className={ui.title}>Mga kanta</h1>
        {songs && <span className={ui.muted}>{songs.length} kanta</span>}
      </div>

      <label className="relative block">
        <span className="sr-only">Hanapin ang kanta o artist</span>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-stone-400" />
        <input
          type="search"
          placeholder="Hanapin ang kanta o artist"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${ui.input} w-full pl-11`}
        />
      </label>

      {nextSetlist && (
        <Link
          to={`/setlist/${nextSetlist.id}`}
          className="flex items-center gap-4 rounded-2xl bg-stone-900 p-4 text-stone-50 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-stone-950">
            <ListIcon />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold tracking-widest text-amber-400 uppercase">Pinakabagong setlist</span>
            <span className="mt-0.5 block truncate text-lg font-semibold">{nextSetlist.title}</span>
          </span>
          <ChevronIcon className="text-stone-400" />
        </Link>
      )}

      {songs === null ? (
        <p className={ui.muted}>Kinukuha ang mga kanta…</p>
      ) : songs.length === 0 ? (
        <div className={`${ui.card} flex flex-col items-start gap-3 p-6`}>
          <h2 className="text-lg font-bold">Wala ka pang kanta</h2>
          <p className={ui.muted}>Idagdag ang unang kanta mo: chords lang, o chords na may lyrics.</p>
          <Link to="/kanta/bago" className={ui.primary}>
            <PlusIcon /> Bagong kanta
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col">
          {shown.map((song) => (
            <li key={song.id}>
              <Link
                to={`/kanta/${song.id}`}
                className="flex items-center gap-4 border-b border-stone-200 py-3.5 hover:bg-stone-100/60 dark:border-stone-800 dark:hover:bg-stone-900"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{song.title}</span>
                  <span className="block truncate text-sm text-stone-500 dark:text-stone-400">
                    {song.artist || "Walang artist"}
                  </span>
                </span>
                <span className={ui.keyBadge}>{song.original_key}</span>
              </Link>
            </li>
          ))}
          {shown.length === 0 && <li className={`${ui.muted} py-4`}>Walang tugma sa "{query}".</li>}
        </ul>
      )}

      {songs && songs.length > 0 && (
        <Link
          to="/kanta/bago"
          className="fixed right-5 bottom-24 z-30 inline-flex h-14 items-center gap-2 rounded-full bg-amber-500 px-5 font-bold text-stone-950 shadow-lg shadow-stone-900/20 hover:bg-amber-400 md:bottom-8"
        >
          <PlusIcon /> Bagong kanta
        </Link>
      )}
    </div>
  );
}

// Para sa hindi pa naka-login
function Welcome() {
  return (
    <div className={`${ui.page} justify-center md:min-h-[70vh]`}>
      <div className="font-display text-5xl font-bold tracking-tight md:text-6xl">
        Tugtog<span className="text-amber-500">.</span>
      </div>
      <p className="max-w-md text-lg text-stone-600 dark:text-stone-300">
        Ang chords at lyrics ng banda mo, sa tamang key, handa sa entablado.
      </p>
      <ul className="flex flex-col gap-2 text-stone-600 dark:text-stone-300">
        <li>• Ilipat ang kanta sa kahit anong key, chords lang ang nagbabago</li>
        <li>• Capo at Nashville numbers para sa buong banda</li>
        <li>• Setlist na may share link para sa bawat miyembro</li>
      </ul>
      <div className="flex flex-wrap gap-3">
        <Link to="/ako" className={ui.primary}>Mag-login o gumawa ng account</Link>
        <Link to="/subukan" className={ui.secondary}>Subukan muna</Link>
      </div>
    </div>
  );
}
