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
      if (error) setError("Could not open the setlist. The link may be wrong.");
      else setRows((data ?? []) as SharedRow[]);
    });
  }, [shareId]);

  const title = rows?.[0]?.setlist_title ?? "Setlist";

  return (
    <div className="app-bg min-h-screen text-stone-100">
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
        <header>
          <a href="/" className="font-digit text-sm tracking-tight text-stone-300">TUGTOG</a>
          <h1 className="mt-3 text-3xl font-medium tracking-tight">{title}</h1>
        </header>

        {error && <p className="text-red-400">{error}</p>}
        {rows === null && !error && <p className="text-stone-400">Loading setlist…</p>}
        {rows?.length === 0 && <p className="text-stone-400">This setlist has no songs, or the link is wrong.</p>}

        {rows && rows.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setStage(true)}
              className="knob inline-flex h-12 items-center self-start rounded-full px-6 font-semibold"
            >
              Live mode, whole setlist
            </button>

            <ol className="flex flex-col gap-4">
              {rows.map((song, i) => (
                <li key={i} className="glass rounded-[28px] p-5">
                  <h2 className="text-lg font-medium">
                    <span className="font-digit text-sm text-stone-400">{String(i + 1).padStart(2, "0")}</span> {song.title}
                  </h2>
                  <p className="text-sm text-stone-400">
                    {song.artist && `${song.artist} · `}key of <strong className="font-digit text-stone-50">{song.song_key}</strong>
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
