import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { setlistText, songInKey } from "../lib/setlist";
import type { SetlistSong } from "../lib/setlist";
import { SongView } from "./SongView";
import { StageMode } from "./StageMode";

type SharedRow = SetlistSong & { setlist_title: string };

// Ang page na makikita ng banda kapag binuksan nila ang share link
export function SharedSetlist({ shareId }: { shareId: string }) {
  const [rows, setRows] = useState<SharedRow[] | null>(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState(false);

  useEffect(() => {
    supabase.rpc("get_shared_setlist", { p_share_id: shareId }).then(({ data, error }) => {
      if (error) setError("Hindi mabuksan ang setlist. Baka mali ang link.");
      else setRows((data ?? []) as SharedRow[]);
    });
  }, [shareId]);

  const title = rows?.[0]?.setlist_title ?? "Setlist";

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
        <header>
          <a href="/" className="text-sm font-black tracking-tight">
            Tugtog<span className="text-amber-500">.</span>
          </a>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{title}</h1>
        </header>

        {error && <p className="text-red-600">{error}</p>}
        {rows === null && !error && <p className="text-stone-500">Kinukuha ang setlist…</p>}
        {rows?.length === 0 && <p className="text-stone-500">Walang kanta sa setlist na ito, o mali ang link.</p>}

        {rows && rows.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setStage(true)}
              className="self-start rounded-lg bg-amber-500 px-4 py-2 font-bold text-stone-950 hover:bg-amber-400"
            >
              🎤 Stage mode, buong setlist
            </button>

            <ol className="flex flex-col gap-4">
              {rows.map((song, i) => (
                <li key={i} className="rounded-xl bg-white p-5">
                  <h2 className="text-lg font-bold">
                    {i + 1}. {song.title}
                  </h2>
                  <p className="text-sm text-stone-500">
                    {song.artist && `${song.artist} · `}key ng <strong className="text-amber-600">{song.song_key}</strong>
                  </p>
                  <SongView text={songInKey(song)} className="mt-3 text-base" />
                </li>
              ))}
            </ol>
          </>
        )}
      </main>

      {stage && rows && <StageMode text={setlistText(rows)} title={title} onClose={() => setStage(false)} />}
    </div>
  );
}
