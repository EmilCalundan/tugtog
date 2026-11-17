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
  if (session === undefined) return <div className={ui.page}><p className={ui.muted}>Sandali…</p></div>;
  if (session === null) {
    return (
      <div className={ui.page}>
        <div>
          <p className={ui.eyebrow}>Imbitasyon sa banda</p>
          <h1 className={`${ui.title} mt-1`}>Mag-login para sumali</h1>
          <p className={`${ui.muted} mt-1`}>Gumawa ng account o mag-login, tapos pipili ka ng instrumento mo.</p>
        </div>
        <Account startOpen />
      </div>
    );
  }

  if (preview === undefined) return <div className={ui.page}><p className={ui.muted}>Hinahanap ang banda…</p></div>;
  if (preview === null) {
    return (
      <div className={ui.page}>
        <h1 className={ui.title}>Hindi mahanap ang banda</h1>
        <p className={ui.muted}>Baka luma na ang link. Humingi ng bagong invite link sa leader ng banda.</p>
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
      setMessage("Hindi nakasali. Subukan ulit, o humingi ng bagong link.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleJoin} className={ui.page}>
      <div>
        <p className={ui.eyebrow}>Imbitasyon sa banda</p>
        <h1 className={`${ui.title} mt-1`}>{preview.name}</h1>
        <p className={`${ui.muted} mt-1`}>{preview.member_count} miyembro na</p>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-semibold text-stone-600 dark:text-stone-300">
        Pangalan mo sa banda
        <input required maxLength={40} value={myName} onChange={(e) => setDisplayName(e.target.value)} className={`${ui.input} w-full`} />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-semibold text-stone-600 dark:text-stone-300">Ano ang tinutugtog mo?</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {INSTRUMENTS.map((i) => (
            <label
              key={i.id}
              className={`flex h-14 cursor-pointer items-center justify-center rounded-xl border font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-amber-500 ${
                instrument === i.id ? "border-2 border-amber-500 bg-amber-50 dark:bg-amber-500/10" : "border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
              }`}
            >
              <input type="radio" name="instrument" value={i.id} checked={instrument === i.id} onChange={() => setInstrument(i.id)} className="sr-only" />
              {i.label}
            </label>
          ))}
        </div>
      </fieldset>

      {message && <p className="text-sm font-semibold text-red-700 dark:text-red-400">{message}</p>}

      <button type="submit" disabled={busy} className={ui.primary}>
        {busy ? "Sandali…" : `Sumali sa ${preview.name}`}
      </button>
    </form>
  );
}
