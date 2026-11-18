import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useSession } from "../lib/useSession";
import { listSongs } from "../lib/songs";
import type { Song } from "../lib/songs";
import { getSetlist, listSetlists } from "../lib/setlists";
import type { Setlist, SetlistItem } from "../lib/setlists";
import { nameFromEmail, songLink } from "../lib/team";
import { ui } from "../components/ui";
import { ArcHero } from "../components/ArcHero";
import type { ArcItem } from "../components/ArcHero";
import { PLAY, SlideLink } from "../components/SlideButton";
import { PlusIcon, SearchIcon } from "../components/Icons";

const ARROW = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" /></svg>
);

function greeting(now: Date): string {
  const h = now.getHours();
  return h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening";
}

function today(now: Date): string {
  return now.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }).toUpperCase().replace(",", " ·");
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-stone-400">{label}</dt>
      <dd className="mt-1.5 truncate font-digit text-[15px] text-stone-50">{value}</dd>
    </div>
  );
}

export function SongsPage() {
  const session = useSession();
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Song[] | null>(null);
  const [nextSetlist, setNextSetlist] = useState<Setlist | null>(null);
  const [items, setItems] = useState<SetlistItem[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!session) return;
    listSongs().then(setSongs).catch(() => setSongs([]));
    listSetlists()
      .then((lists) => {
        const latest = lists[0] ?? null;
        setNextSetlist(latest);
        if (latest) getSetlist(latest.id).then((d) => setItems(d.items)).catch(() => {});
      })
      .catch(() => {});
  }, [session]);

  if (session === undefined) return null;
  if (session === null) return <Welcome />;

  const now = new Date();
  const q = query.trim().toLowerCase();
  const shown = (songs ?? []).filter(
    (song) => song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q),
  );

  // Ang arko: ang mga kanta ng pinakabagong setlist, o ang unang mga kanta mo
  const arcItems: ArcItem[] = nextSetlist && items.length > 0
    ? items.slice(0, 6).map((item, i) => ({
        label: `SONG ${i + 1}`,
        value: item.song_key,
        ariaLabel: `Song ${i + 1}: ${item.songs.title}, key of ${item.song_key}`,
        onSelect: () => navigate(songLink(item.songs.id, item.song_key)),
      }))
    : (songs ?? []).slice(0, 6).map((song, i) => ({
        label: `SONG ${i + 1}`,
        value: song.original_key,
        ariaLabel: `${song.title}, key of ${song.original_key}`,
        onSelect: () => navigate(`/kanta/${song.id}`),
      }));
  const keys = new Set(items.map((i) => i.song_key)).size;

  return (
    <div className={`${ui.page} gap-4`}>
      <header className="flex items-start justify-between">
        <div>
          <p className="text-xs tracking-[0.06em] text-stone-400">{today(now)}</p>
          <h1 className="mt-1 text-xl font-medium">{greeting(now)}, {nameFromEmail(session.user.email)}</h1>
        </div>
        <Link to="/ako" aria-label="Me" className="flex size-11 items-center justify-center rounded-full border border-white/25 bg-gradient-to-br from-stone-600 to-stone-800 font-semibold">
          {nameFromEmail(session.user.email).charAt(0)}
        </Link>
      </header>

      {arcItems.length > 0 && (
        <div className="-mx-4 -mt-2 md:mx-0">
          <ArcHero items={arcItems} title={nextSetlist ? `Songs in ${nextSetlist.title}` : "Your songs"} height={420} centerY={200} guitar={{ y: 190, scale: 0.6, rotate: 18, opacity: 1 }} />
        </div>
      )}

      {/* Ang glass card: ang susunod na tugtugan */}
      {nextSetlist ? (
        <section aria-label="Up next" className={`${ui.card} -mt-16 flex flex-col gap-4 rounded-[34px] p-5 md:mt-0`}>
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 truncate text-xs tracking-[0.08em] text-stone-300 uppercase">Up next · {nextSetlist.title}</p>
            <Link to={`/setlist/${nextSetlist.id}`} aria-label={`Open ${nextSetlist.title}`} className="-mt-1.5 -mr-1.5 flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06]">
              {ARROW}
            </Link>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-digit text-[56px] leading-none">{String(items.length).padStart(2, "0")}</span>
            <span className="text-sm text-stone-300">{items.length === 1 ? "song ready" : "songs ready"}</span>
          </div>
          <dl className="grid grid-cols-3 gap-2">
            <Stat label="Keys" value={String(keys)} />
            <Stat label="Band" value={nextSetlist.teams?.name ?? "Solo"} />
            <Stat label="Library" value={String(songs?.length ?? 0)} />
          </dl>
          <SlideLink icon={PLAY} label="Start rehearsal" to={`/setlist/${nextSetlist.id}`} />
        </section>
      ) : songs && songs.length > 0 ? (
        <section aria-label="Your library" className={`${ui.card} -mt-16 flex flex-col gap-4 rounded-[34px] p-5 md:mt-0`}>
          <p className="text-xs tracking-[0.08em] text-stone-300 uppercase">Your library</p>
          <div className="flex items-baseline gap-3">
            <span className="font-digit text-[56px] leading-none">{String(songs.length).padStart(2, "0")}</span>
            <span className="text-sm text-stone-300">{songs.length === 1 ? "song" : "songs"}</span>
          </div>
          <SlideLink icon={PLAY} label="Make a setlist" to="/setlist" />
        </section>
      ) : null}

      <div className="mt-2 flex items-center justify-between">
        <h2 className={ui.label}>Songs{songs ? ` · ${songs.length}` : ""}</h2>
        <Link to="/kanta/bago" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 text-sm font-medium hover:bg-white/10">
          <PlusIcon className="size-4" /> New song
        </Link>
      </div>

      <label className="relative block">
        <span className="sr-only">Search songs or artists</span>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-stone-500" />
        <input
          type="search"
          placeholder="Search songs or artists"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${ui.input} w-full rounded-full pl-12`}
        />
      </label>

      {songs === null ? (
        <p className={ui.muted}>Loading songs…</p>
      ) : songs.length === 0 ? (
        <div className={`${ui.card} flex flex-col items-start gap-3 p-6`}>
          <h2 className="text-lg font-medium">No songs yet</h2>
          <p className={ui.muted}>Add your first song: just chords, or chords with lyrics.</p>
          <Link to="/kanta/bago" className={ui.primary}>
            <PlusIcon /> New song
          </Link>
        </div>
      ) : (
        <ul className={`${ui.card} flex flex-col p-1.5`}>
          {shown.map((song) => (
            <li key={song.id}>
              <Link to={`/kanta/${song.id}`} className="flex items-center gap-4 rounded-[22px] px-3.5 py-3 hover:bg-white/[0.06]">
                <span className={ui.keyBadge}>{song.original_key}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{song.title}</span>
                  <span className="block truncate text-sm text-stone-400">
                    {[song.artist || "No artist", `${song.bpm} BPM`, song.time_signature].join(" · ")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
          {shown.length === 0 && <li className={`${ui.muted} px-4 py-4`}>Nothing matches "{query}".</li>}
        </ul>
      )}
    </div>
  );
}

// Para sa hindi pa naka-login
function Welcome() {
  const demo: ArcItem[] = [["SONG 1", "G"], ["SONG 2", "D"], ["SONG 3", "Em"], ["SONG 4", "C"], ["SONG 5", "A"], ["ENCORE", "E"]].map(([label, value]) => ({
    label,
    value,
    ariaLabel: `${label} in ${value}`,
  }));
  return (
    <div className={`${ui.page} gap-4 md:min-h-[70vh] md:justify-center`}>
      <div className="font-digit text-sm tracking-tight text-stone-300">TUGTOG</div>
      <div className="-mx-4 md:mx-0">
        <ArcHero items={demo} title="Tugtog" height={420} centerY={200} guitar={{ y: 190, scale: 0.6, rotate: 18, opacity: 1 }} />
      </div>
      <section className={`${ui.card} -mt-16 flex flex-col gap-4 rounded-[34px] p-5 md:mt-0`}>
        <h1 className="text-2xl font-medium tracking-tight">Your band's chords and lyrics, in the right key, ready for the stage.</h1>
        <ul className="flex flex-col gap-1.5 text-sm text-stone-300">
          <li>• Move a song to any key; only the chords change</li>
          <li>• Every instrument's part: guitar, piano, bass and drums</li>
          <li>• Setlists with a share link for every band member</li>
        </ul>
        <SlideLink icon={PLAY} label="Log in or sign up" to="/ako" />
        <Link to="/subukan" className="self-center text-sm font-medium text-stone-300 underline-offset-4 hover:underline">Try it first</Link>
      </section>
    </div>
  );
}
