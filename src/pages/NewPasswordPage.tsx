import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/useSession";
import { authErrorMessage } from "../lib/authMessages";
import { ui } from "../components/ui";

// Dito napupunta ang link sa email na "Nakalimutan ang password".
// Ang link ang nagla-login sa user, kaya puwede nang palitan ang password.
export function NewPasswordPage() {
  const session = useSession();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  if (session === undefined) return <div className={ui.page}><p className={ui.muted}>Sandali…</p></div>;

  if (session === null) {
    return (
      <div className={ui.page}>
        <h1 className={ui.title}>Bagong password</h1>
        <p className={ui.muted}>
          Luma na o nagamit na ang link. Humingi ng bago sa{" "}
          <Link to="/ako" className="font-semibold text-amber-700 underline dark:text-amber-400">Ako → Nakalimutan ang password?</Link>
        </p>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) {
      setMessage("Hindi magkapareho ang dalawang password.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setMessage(authErrorMessage(error));
    else navigate("/", { replace: true });
  }

  return (
    <form onSubmit={handleSubmit} className={ui.page}>
      <div>
        <h1 className={ui.title}>Bagong password</h1>
        <p className={`${ui.muted} mt-1`}>Para sa {session.user.email}</p>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-stone-600 dark:text-stone-300">
        Bagong password
        <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${ui.input} w-full`} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-stone-600 dark:text-stone-300">
        Ulitin ang password
        <input type="password" required minLength={6} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${ui.input} w-full`} />
      </label>
      {message && <p role="alert" className="text-sm font-semibold text-red-700 dark:text-red-400">{message}</p>}
      <button type="submit" disabled={busy} className={ui.primary}>
        {busy ? "Sandali…" : "I-save ang bagong password"}
      </button>
    </form>
  );
}
