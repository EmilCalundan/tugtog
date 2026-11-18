import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useSession } from "../lib/useSession";
import { createTeam, listTeams } from "../lib/teams";
import type { Team } from "../lib/teams";
import { INSTRUMENTS, instrumentLabel, nameFromEmail } from "../lib/team";
import type { Instrument } from "../lib/team";
import { ui } from "../components/ui";
import { ChevronIcon } from "../components/Icons";

// Ang mga banda mo, at paggawa ng bago
export function TeamsPage() {
  const session = useSession();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [instrument, setInstrument] = useState<Instrument>("gitara");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!session) return;
    listTeams().then(setTeams).catch(() => setTeams([]));
  }, [session]);

  if (session === null) return <Navigate to="/ako" replace />;
  const myId = session?.user.id;
  const myName = displayName ?? nameFromEmail(session?.user.email);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !myName.trim()) return;
    setBusy(true);
    try {
      const id = await createTeam(name.trim(), myName.trim(), instrument);
      navigate(`/banda/${id}`);
    } catch {
      setMessage("The band was not created. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className={ui.page}>
      <div>
        <h1 className={ui.title}>Bands</h1>
        <p className={`${ui.muted} mt-1`}>Share setlists with your band, and every song opens on each member's part.</p>
      </div>

      {teams === null ? (
        <p className={ui.muted}>Loading bands…</p>
      ) : teams.length > 0 && (
        <ul className="flex flex-col gap-2">
          {teams.map((team) => {
            const me = team.team_members.find((m) => m.user_id === myId);
            return (
              <li key={team.id}>
                <Link to={`/banda/${team.id}`} className={`${ui.card} flex items-center gap-3 p-4 pl-5 hover:border-white/30`}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{team.name}</span>
                    <span className={ui.muted}>
                      {team.team_members.length} {team.team_members.length === 1 ? "member" : "members"}{me && ` · you: ${instrumentLabel(me.instrument)}`}
                    </span>
                  </span>
                  <ChevronIcon className="text-stone-400" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handleCreate} className={`${ui.card} flex flex-col gap-3 p-5`}>
        <h2 className="font-display text-lg font-semibold">Create a band</h2>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-stone-300">
          Band name
          <input required maxLength={60} placeholder="e.g. CCF Makati Worship Team" value={name} onChange={(e) => setName(e.target.value)} className={`${ui.input} w-full`} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-stone-300">
            Your name
            <input required maxLength={40} value={myName} onChange={(e) => setDisplayName(e.target.value)} className={`${ui.input} w-full`} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-stone-300">
            Your instrument
            <select value={instrument} onChange={(e) => setInstrument(e.target.value as Instrument)} className={`${ui.input} w-full`}>
              {INSTRUMENTS.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
            </select>
          </label>
        </div>
        {message && <p className="text-sm font-medium text-red-400">{message}</p>}
        <button type="submit" disabled={busy || !name.trim()} className={ui.primary}>
          {busy ? "One moment…" : "Create band"}
        </button>
      </form>
    </div>
  );
}
