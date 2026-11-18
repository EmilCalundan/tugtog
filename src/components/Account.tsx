import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/useSession";
import { authErrorMessage, signUpOutcome } from "../lib/authMessages";
import { ui } from "./ui";

type Mode = "login" | "signup" | "forgot" | "check-email" | "reset-sent";

const TITLES: Record<Mode, string> = {
  login: "Log in",
  signup: "Create an account",
  forgot: "Forgot password",
  "check-email": "Check your email",
  "reset-sent": "Check your email",
};

export function Account({ startOpen = false }: { startOpen?: boolean }) {
  const session = useSession();
  const [open, setOpen] = useState(startOpen);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function switchTo(next: Mode) {
    setMode(next);
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(authErrorMessage(error));
      else setPassword("");
    }

    if (mode === "signup") {
      // Babalik sa page na ito pagka-confirm, hal. sa invite link ng banda
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.href },
      });
      if (error) setMessage(authErrorMessage(error));
      else {
        const outcome = signUpOutcome(data);
        setPassword("");
        if (outcome === "check-email") switchTo("check-email");
        if (outcome === "already-registered") {
          switchTo("login");
          setMessage("This email already has an account. Log in instead.");
        }
      }
    }

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/bagong-password`,
      });
      if (error) setMessage(authErrorMessage(error));
      else switchTo("reset-sent");
    }

    setBusy(false);
  }

  async function resend() {
    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.href },
    });
    setBusy(false);
    setMessage(error ? authErrorMessage(error) : "Sent again. Check your Spam folder too.");
  }

  const inputClass = `${ui.input} w-full`;
  const linkButton = "text-sm font-medium text-stone-300 hover:underline";

  // Naka-login na
  if (session) {
    return (
      <div className={`${ui.card} flex items-center justify-between gap-3 px-5 py-4 text-sm`}>
        <span className="min-w-0 truncate">
          Logged in as <strong>{session.user.email}</strong>
        </span>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className={`${ui.secondary} h-10 shrink-0`}
        >
          Log out
        </button>
      </div>
    );
  }

  // Hindi pa naka-login, at sarado ang form
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${ui.secondary} self-start`}
      >
        Log in to save your songs
      </button>
    );
  }

  // Naipadala na ang email: confirmation o reset ng password
  if (mode === "check-email" || mode === "reset-sent") {
    return (
      <div role="status" className={`${ui.card} flex flex-col gap-3 p-5`}>
        <h2 className="text-lg font-bold">{TITLES[mode]}</h2>
        <p className="text-sm text-stone-300">
          {mode === "check-email"
            ? <>We sent a link to <strong>{email}</strong>. Open it to confirm your account, and you will come back here.</>
            : <>We sent a link to <strong>{email}</strong> so you can set a new password.</>}
        </p>
        <p className="text-sm text-stone-400">Nothing yet? Check your Spam or Promotions folder.</p>
        {message && <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">{message}</p>}
        <div className="flex flex-wrap items-center gap-3">
          {mode === "check-email" && (
            <button type="button" onClick={resend} disabled={busy} className={`${ui.secondary} h-10`}>
              Send again
            </button>
          )}
          <button type="button" onClick={() => switchTo("login")} className={linkButton}>
            Back to log in
          </button>
        </div>
      </div>
    );
  }

  // Ang form
  return (
    <form onSubmit={handleSubmit} className={`${ui.card} flex flex-col gap-4 p-5`}>
      <h2 className="text-lg font-bold">{TITLES[mode]}</h2>
      {mode === "forgot" && (
        <p className="text-sm text-stone-300">Enter your email and we will send you a link to set a new password.</p>
      )}

      <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-300">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </label>

      {mode !== "forgot" && (
        <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-300">
          Password
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>
      )}

      {message && <p role="alert" className="text-sm text-red-400">{message}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className={ui.primary}
        >
          {busy ? "One moment..." : mode === "login" ? "Log in" : mode === "signup" ? "Create account" : "Send the link"}
        </button>
        {mode === "login" && (
          <>
            <button type="button" onClick={() => switchTo("signup")} className={linkButton}>No account yet? Sign up</button>
            <button type="button" onClick={() => switchTo("forgot")} className={linkButton}>Forgot password?</button>
          </>
        )}
        {mode !== "login" && (
          <button type="button" onClick={() => switchTo("login")} className={linkButton}>Have an account? Log in</button>
        )}
        {!startOpen && (
          <button type="button" onClick={() => setOpen(false)} className="text-sm text-stone-400 hover:underline">
            Close
          </button>
        )}
      </div>
    </form>
  );
}
