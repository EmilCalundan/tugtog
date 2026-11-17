import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { useSession } from "../lib/useSession";
import { deleteTeam, getTeam, newInviteCode, removeMember, updateMyMembership } from "../lib/teams";
import type { TeamDetail } from "../lib/teams";
import { INSTRUMENTS, instrumentLabel, inviteLink } from "../lib/team";
import type { Instrument } from "../lib/team";
import { ui } from "../components/ui";
import { BackIcon, ChevronIcon, LinkIcon } from "../components/Icons";

// Ang page ng isang banda: mga miyembro, invite link, at mga setlist ng banda
export function TeamPage() {
  const { id = "" } = useParams();
  const session = useSession();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [message, setMessage] = useState("");

  const reload = useCallback(
    () => getTeam(id).then(setTeam).catch(() => setMessage("Hindi mahanap ang banda, o hindi ka na kasapi.")),
    [id],
  );

  useEffect(() => {
    getTeam(id).then(setTeam).catch(() => setMessage("Hindi mahanap ang banda, o hindi ka na kasapi."));
  }, [id]);

  if (session === null) return <Navigate to="/ako" replace />;
  if (!team) return <div className={ui.page}><p className={ui.muted}>{message || "Kinukuha ang banda…"}</p></div>;

  const myId = session?.user.id ?? "";
  const me = team.team_members.find((m) => m.user_id === myId);
  const isLeader = me?.role === "leader";
  const isOwner = team.owner_id === myId;
  const link = inviteLink(window.location.origin, team.invite_code);

  async function copyInvite(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Nakopya ang invite link! I-send ito sa mga kabanda mo.");
    } catch {
      setMessage(`Kopyahin ang link na ito: ${url}`);
    }
  }

  async function resetInvite() {
    if (!window.confirm("Gumawa ng bagong invite link? Hindi na gagana ang luma.")) return;
    const code = await newInviteCode(team!.id);
    await reload();
    copyInvite(inviteLink(window.location.origin, code));
  }

  async function changeInstrument(instrument: Instrument) {
    await updateMyMembership(team!.id, myId, { instrument });
    reload();
  }

  async function kick(userId: string, name: string) {
    if (!window.confirm(`Tanggalin si ${name} sa banda?`)) return;
    await removeMember(team!.id, userId);
    reload();
  }

  async function leave() {
    if (!window.confirm(`Umalis sa ${team!.name}? Hindi mo na makikita ang mga setlist ng banda.`)) return;
    await removeMember(team!.id, myId);
    navigate("/banda", { replace: true });
  }

  async function handleDelete() {
    if (!window.confirm(`Burahin ang bandang "${team!.name}"? Mananatili ang mga setlist at kanta, pero hindi na ito nakabahagi.`)) return;
    await deleteTeam(team!.id);
    navigate("/banda", { replace: true });
  }

  const members = [...team.team_members].sort((a, b) => (a.role === b.role ? a.display_name.localeCompare(b.display_name) : a.role === "leader" ? -1 : 1));

  return (
    <div className={ui.page}>
      <Link to="/banda" aria-label="Bumalik sa mga banda" className={`${ui.iconButton} -ml-3`}>
        <BackIcon />
      </Link>

      <div>
        <p className={ui.eyebrow}>Banda</p>
        <h1 className={`${ui.title} mt-1`}>{team.name}</h1>
        <p className={`${ui.muted} mt-1`}>{team.team_members.length} miyembro</p>
      </div>

      {me && (
        <label className={`${ui.card} flex items-center justify-between gap-3 p-4`}>
          <span>
            <span className="block font-semibold">Instrumento mo</span>
            <span className={ui.muted}>Dito bubukas ang mga kanta sa setlist ng banda.</span>
          </span>
          <select value={me.instrument} onChange={(e) => changeInstrument(e.target.value as Instrument)} className={`${ui.input} w-32 shrink-0 font-semibold`}>
            {INSTRUMENTS.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
          </select>
        </label>
      )}

      <section aria-labelledby="setlists-title" className="flex flex-col gap-2">
        <h2 id="setlists-title" className="font-display text-lg font-bold">Mga setlist ng banda</h2>
        {team.setlists.length === 0 ? (
          <p className={ui.muted}>Wala pang setlist. Buksan ang isang setlist mo at piliin ang bandang ito sa "Ibahagi sa banda".</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {team.setlists.map((s) => (
              <li key={s.id}>
                <Link to={`/setlist/${s.id}`} className={`${ui.card} flex items-center gap-3 p-4 hover:border-amber-500`}>
                  <span className="min-w-0 flex-1 truncate font-semibold">{s.title}</span>
                  <ChevronIcon className="text-stone-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="members-title" className="flex flex-col gap-2">
        <h2 id="members-title" className="font-display text-lg font-bold">Mga miyembro</h2>
        <ul className={`${ui.card} divide-y divide-stone-200 dark:divide-stone-800`}>
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-400">
                {m.display_name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {m.display_name}
                  {m.user_id === myId && <span className="font-normal text-stone-500"> (ikaw)</span>}
                </span>
                <span className={ui.muted}>
                  {instrumentLabel(m.instrument)}
                  {m.role === "leader" && " · leader"}
                </span>
              </span>
              {isLeader && m.user_id !== myId && m.user_id !== team.owner_id && (
                <button type="button" onClick={() => kick(m.user_id, m.display_name)} className="text-sm font-semibold text-red-700 hover:underline dark:text-red-400">
                  Tanggalin
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {isLeader && (
        <section aria-labelledby="invite-title" className="flex flex-col gap-2 rounded-2xl bg-amber-50 p-4 dark:bg-amber-500/10">
          <h2 id="invite-title" className="font-display text-lg font-bold">Mag-imbita</h2>
          <p className="text-sm text-amber-900 dark:text-amber-200">
            I-send ang link sa mga kabanda mo. Kailangan nilang mag-login, tapos pipili sila ng instrumento.
          </p>
          <code className="block overflow-x-auto rounded-lg bg-white px-3 py-2 font-mono text-xs whitespace-nowrap select-all dark:bg-stone-900">{link}</code>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => copyInvite(link)} className={ui.primary}>
              <LinkIcon /> Kopyahin ang link
            </button>
            <button type="button" onClick={resetInvite} className={ui.secondary}>Bagong link</button>
          </div>
        </section>
      )}

      {message && <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">{message}</p>}

      {isOwner ? (
        <button type="button" onClick={handleDelete} className="self-start text-sm font-semibold text-red-700 hover:underline dark:text-red-400">
          Burahin ang banda
        </button>
      ) : (
        <button type="button" onClick={leave} className="self-start text-sm font-semibold text-red-700 hover:underline dark:text-red-400">
          Umalis sa banda
        </button>
      )}
    </div>
  );
}
