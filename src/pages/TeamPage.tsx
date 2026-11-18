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
    () => getTeam(id).then(setTeam).catch(() => setMessage("Band not found, or you are no longer a member.")),
    [id],
  );

  useEffect(() => {
    getTeam(id).then(setTeam).catch(() => setMessage("Band not found, or you are no longer a member."));
  }, [id]);

  if (session === null) return <Navigate to="/ako" replace />;
  if (!team) return <div className={ui.page}><p className={ui.muted}>{message || "Loading band…"}</p></div>;

  const myId = session?.user.id ?? "";
  const me = team.team_members.find((m) => m.user_id === myId);
  const isLeader = me?.role === "leader";
  const isOwner = team.owner_id === myId;
  const link = inviteLink(window.location.origin, team.invite_code);

  async function copyInvite(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Invite link copied! Send it to your bandmates.");
    } catch {
      setMessage(`Copy this link: ${url}`);
    }
  }

  async function resetInvite() {
    if (!window.confirm("Make a new invite link? The old one will stop working.")) return;
    const code = await newInviteCode(team!.id);
    await reload();
    copyInvite(inviteLink(window.location.origin, code));
  }

  async function changeInstrument(instrument: Instrument) {
    await updateMyMembership(team!.id, myId, { instrument });
    reload();
  }

  async function kick(userId: string, name: string) {
    if (!window.confirm(`Remove ${name} from the band?`)) return;
    await removeMember(team!.id, userId);
    reload();
  }

  async function leave() {
    if (!window.confirm(`Leave ${team!.name}? You will no longer see the band's setlists.`)) return;
    await removeMember(team!.id, myId);
    navigate("/banda", { replace: true });
  }

  async function handleDelete() {
    if (!window.confirm(`Delete the band "${team!.name}"? Setlists and songs stay, but they are no longer shared.`)) return;
    await deleteTeam(team!.id);
    navigate("/banda", { replace: true });
  }

  const members = [...team.team_members].sort((a, b) => (a.role === b.role ? a.display_name.localeCompare(b.display_name) : a.role === "leader" ? -1 : 1));

  return (
    <div className={ui.page}>
      <Link to="/banda" aria-label="Back to bands" className={`${ui.iconButton} -ml-3`}>
        <BackIcon />
      </Link>

      <div>
        <p className={ui.eyebrow}>Band</p>
        <h1 className={`${ui.title} mt-1`}>{team.name}</h1>
        <p className={`${ui.muted} mt-1`}>{team.team_members.length} {team.team_members.length === 1 ? "member" : "members"}</p>
      </div>

      {me && (
        <label className={`${ui.card} flex items-center justify-between gap-3 p-4`}>
          <span>
            <span className="block font-medium">Your instrument</span>
            <span className={ui.muted}>Songs in the band's setlists open on this part.</span>
          </span>
          <select value={me.instrument} onChange={(e) => changeInstrument(e.target.value as Instrument)} className={`${ui.input} w-32 shrink-0`}>
            {INSTRUMENTS.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
          </select>
        </label>
      )}

      <section aria-labelledby="setlists-title" className="flex flex-col gap-2">
        <h2 id="setlists-title" className={ui.label}>Band setlists</h2>
        {team.setlists.length === 0 ? (
          <p className={ui.muted}>No setlists yet. Open one of your setlists and pick this band under "Share with band".</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {team.setlists.map((s) => (
              <li key={s.id}>
                <Link to={`/setlist/${s.id}`} className={`${ui.card} flex items-center gap-3 p-4 pl-5 hover:border-white/30`}>
                  <span className="min-w-0 flex-1 truncate font-semibold">{s.title}</span>
                  <ChevronIcon className="text-stone-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="members-title" className="flex flex-col gap-2">
        <h2 id="members-title" className={ui.label}>Members</h2>
        <ul className={`${ui.card} divide-y divide-white/10`}>
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-stone-600 to-stone-800 font-semibold text-stone-50">
                {m.display_name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {m.display_name}
                  {m.user_id === myId && <span className="font-normal text-stone-400"> (you)</span>}
                </span>
                <span className={ui.muted}>
                  {instrumentLabel(m.instrument)}
                  {m.role === "leader" && " · leader"}
                </span>
              </span>
              {isLeader && m.user_id !== myId && m.user_id !== team.owner_id && (
                <button type="button" onClick={() => kick(m.user_id, m.display_name)} className="text-sm font-medium text-red-400 hover:underline">
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {isLeader && (
        <section aria-labelledby="invite-title" className={`${ui.card} flex flex-col gap-3 p-5`}>
          <h2 id="invite-title" className="font-display text-lg font-semibold">Invite</h2>
          <p className="text-sm text-stone-300">
            Send the link to your bandmates. They need to log in, then they pick their instrument.
          </p>
          <code className="block overflow-x-auto rounded-2xl bg-black/35 px-4 py-3 font-mono text-xs whitespace-nowrap text-stone-200 select-all">{link}</code>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => copyInvite(link)} className={ui.primary}>
              <LinkIcon /> Copy link
            </button>
            <button type="button" onClick={resetInvite} className={ui.secondary}>New link</button>
          </div>
        </section>
      )}

      {message && <p className="text-sm font-medium text-stone-100">{message}</p>}

      {isOwner ? (
        <button type="button" onClick={handleDelete} className="self-start text-sm font-medium text-red-400 hover:underline">
          Delete band
        </button>
      ) : (
        <button type="button" onClick={leave} className="self-start text-sm font-medium text-red-400 hover:underline">
          Leave band
        </button>
      )}
    </div>
  );
}
