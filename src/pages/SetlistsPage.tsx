import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useSession } from "../lib/useSession";
import { createSetlist, listSetlists } from "../lib/setlists";
import type { Setlist } from "../lib/setlists";
import { ui } from "../components/ui";
import { ChevronIcon } from "../components/Icons";

export function SetlistsPage() {
  const session = useSession();
  const navigate = useNavigate();
  const [setlists, setSetlists] = useState<Setlist[] | null>(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!session) return;
    listSetlists().then(setSetlists).catch(() => setSetlists([]));
  }, [session]);

  if (session === null) return <Navigate to="/ako" replace />;

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    const created = await createSetlist(title.trim());
    navigate(`/setlist/${created.id}`);
  }

  return (
    <div className={ui.page}>
      <h1 className={ui.title}>Setlists</h1>

      <form onSubmit={handleCreate} className="flex gap-2">
        <label className="sr-only" htmlFor="new-setlist">Name of the new setlist</label>
        <input id="new-setlist" placeholder="e.g. Sunday, Nov 23" value={title} onChange={(e) => setTitle(e.target.value)} className={`${ui.input} w-full`} />
        <button type="submit" className={ui.primary}>Create</button>
      </form>

      {setlists === null ? (
        <p className={ui.muted}>Loading setlists…</p>
      ) : setlists.length === 0 ? (
        <p className={ui.muted}>No setlists yet. Make one for your next gig or Sunday.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {setlists.map((setlist) => (
            <li key={setlist.id}>
              <Link to={`/setlist/${setlist.id}`} className={`${ui.card} flex items-center gap-3 p-4 pl-5 hover:border-white/30`}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{setlist.title}</span>
                  {setlist.teams && <span className={ui.muted}>{setlist.teams.name}</span>}
                </span>
                <ChevronIcon className="text-stone-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
