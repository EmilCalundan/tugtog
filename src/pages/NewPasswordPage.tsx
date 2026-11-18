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

  if (session === undefined) return <div className={ui.page}><p className={ui.muted}>One moment…</p></div>;

  if (session === null) {
    return (
      <div className={ui.page}>
        <h1 className={ui.title}>New password</h1>
        <p className={ui.muted}>
          This link is old or already used. Ask for a new one at{" "}
          <Link to="/ako" className="font-medium text-stone-100 underline">Me → Forgot password?</Link>
        </p>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) {
      setMessage("The two passwords do not match.");
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
        <h1 className={ui.title}>New password</h1>
        <p className={`${ui.muted} mt-1`}>For {session.user.email}</p>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-stone-300">
        New password
        <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${ui.input} w-full`} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-stone-300">
        Repeat password
        <input type="password" required minLength={6} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${ui.input} w-full`} />
      </label>
      {message && <p role="alert" className="text-sm font-medium text-red-400">{message}</p>}
      <button type="submit" disabled={busy} className={ui.primary}>
        {busy ? "One moment…" : "Save new password"}
      </button>
    </form>
  );
}
