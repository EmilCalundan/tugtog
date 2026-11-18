import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { useSession } from "../lib/useSession";
import { joinTeam, teamByCode } from "../lib/teams";
import { INSTRUMENTS, nameFromEmail } from "../lib/team";
import type { Instrument } from "../lib/team";
import { Account } from "../components/Account";
import { ui } from "../components/ui";

type Preview = { id: string; name: string; member_count: number };

// Ang page na binubuksan mula sa invite link: /sali/:code
export function JoinPage() {
  const { code = "" } = useParams();
  const session = useSession();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<Preview | null | undefined>(undefined);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [instrument, setInstrument] = useState<Instrument>("gitara");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!session) return;
    teamByCode(code).then(setPreview).catch(() => setPreview(null));
  }, [session, code]);

  // Kailangang mag-login muna; babalik dito pagkatapos
  if (session === undefined) return <div className={ui.page}><p className={ui.muted}>One moment…</p></div>;
  if (session === null) {
    return (
      <div className={ui.page}>
        <div>
          <p className={ui.eyebrow}>Band invite</p>
          <h1 className={`${ui.title} mt-1`}>Log in to join</h1>
          <p className={`${ui.muted} mt-1`}>Create an account or log in, then pick your instrument.</p>
        </div>
        <Account startOpen />
      </div>
    );
  }

  if (preview === undefined) return <div className={ui.page}><p className={ui.muted}>Looking for the band…</p></div>;
  if (preview === null) {
    return (
      <div className={ui.page}>
        <h1 className={ui.title}>Band not found</h1>
        <p className={ui.muted}>The link may be old. Ask the band leader for a new invite link.</p>
      </div>
    );
  }

  const myName = displayName ?? nameFromEmail(session.user.email);

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!myName.trim()) return;
    setBusy(true);
    try {
      const teamId = await joinTeam(code, myName.trim(), instrument);
      navigate(`/banda/${teamId}`, { replace: true });
    } catch {
      setMessage("Could not join. Try again, or ask for a new link.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleJoin} className={ui.page}>
      <div>
        <p className={ui.eyebrow}>Band invite</p>
        <h1 className={`${ui.title} mt-1`}>{preview.name}</h1>
        <p className={`${ui.muted} mt-1`}>{preview.member_count} {preview.member_count === 1 ? "member" : "members"} so far</p>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-semibold text-stone-300">
        Your name in the band
        <input required maxLength={40} value={myName} onChange={(e) => setDisplayName(e.target.value)} className={`${ui.input} w-full`} />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium text-stone-300">What do you play?</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {INSTRUMENTS.map((i) => (
            <label
              key={i.id}
              className={`flex h-14 cursor-pointer items-center justify-center rounded-full border font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-white ${
                instrument === i.id ? "knob border-white" : "border-white/12 bg-white/[0.06] text-stone-200"
              }`}
            >
              <input type="radio" name="instrument" value={i.id} checked={instrument === i.id} onChange={() => setInstrument(i.id)} className="sr-only" />
              {i.label}
            </label>
          ))}
        </div>
      </fieldset>

      {message && <p className="text-sm font-medium text-red-400">{message}</p>}

      <button type="submit" disabled={busy} className={ui.primary}>
        {busy ? "One moment…" : `Join ${preview.name}`}
      </button>
    </form>
  );
}
