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
      <h1 className={ui.title}>Setlist</h1>

      <form onSubmit={handleCreate} className="flex gap-2">
        <label className="sr-only" htmlFor="new-setlist">Pangalan ng bagong setlist</label>
        <input id="new-setlist" placeholder="hal. Linggo, Nob 23" value={title} onChange={(e) => setTitle(e.target.value)} className={`${ui.input} w-full`} />
        <button type="submit" className={ui.primary}>Gumawa</button>
      </form>

      {setlists === null ? (
        <p className={ui.muted}>Kinukuha ang mga setlist…</p>
      ) : setlists.length === 0 ? (
        <p className={ui.muted}>Wala ka pang setlist. Gumawa ng isa para sa susunod na gig o Linggo.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {setlists.map((setlist) => (
            <li key={setlist.id}>
              <Link to={`/setlist/${setlist.id}`} className={`${ui.card} flex items-center gap-3 p-4 hover:border-amber-500`}>
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
