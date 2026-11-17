import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/useSession";
import { authErrorMessage, signUpOutcome } from "../lib/authMessages";

type Mode = "login" | "signup" | "forgot" | "check-email" | "reset-sent";

const TITLES: Record<Mode, string> = {
  login: "Mag-login",
  signup: "Gumawa ng account",
  forgot: "Nakalimutan ang password",
  "check-email": "Tingnan ang email mo",
  "reset-sent": "Tingnan ang email mo",
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
          setMessage("May account na ang email na ito. Mag-login na lang.");
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
    setMessage(error ? authErrorMessage(error) : "Naipadala ulit. Tingnan din ang Spam folder.");
  }

  const inputClass =
    "rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:outline-2 focus:outline-amber-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
  const linkButton = "text-sm font-semibold text-stone-600 hover:underline dark:text-stone-400";

  // Naka-login na
  if (session) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm dark:bg-stone-900">
        <span className="min-w-0 truncate">
          Naka-login bilang <strong>{session.user.email}</strong>
        </span>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="shrink-0 font-semibold text-amber-600 hover:underline dark:text-amber-400"
        >
          Mag-logout
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
        className="self-start rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold hover:border-amber-500 dark:border-stone-700 dark:bg-stone-900"
      >
        Mag-login para i-save ang mga kanta mo
      </button>
    );
  }

  // Naipadala na ang email: confirmation o reset ng password
  if (mode === "check-email" || mode === "reset-sent") {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-xl bg-white p-4 dark:bg-stone-900">
        <h2 className="text-lg font-bold">{TITLES[mode]}</h2>
        <p className="text-sm text-stone-700 dark:text-stone-300">
          {mode === "check-email"
            ? <>Nagpadala kami ng link sa <strong>{email}</strong>. Buksan ito para ma-confirm ang account mo, at babalik ka rito.</>
            : <>Nagpadala kami ng link sa <strong>{email}</strong> para makagawa ng bagong password.</>}
        </p>
        <p className="text-sm text-stone-500">Wala pa? Tingnan ang Spam o Promotions folder.</p>
        {message && <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">{message}</p>}
        <div className="flex flex-wrap items-center gap-3">
          {mode === "check-email" && (
            <button type="button" onClick={resend} disabled={busy} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold hover:border-amber-500 disabled:opacity-50 dark:border-stone-700">
              Ipadala ulit
            </button>
          )}
          <button type="button" onClick={() => switchTo("login")} className={linkButton}>
            Bumalik sa login
          </button>
        </div>
      </div>
    );
  }

  // Ang form
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl bg-white p-4 dark:bg-stone-900">
      <h2 className="text-lg font-bold">{TITLES[mode]}</h2>
      {mode === "forgot" && (
        <p className="text-sm text-stone-600 dark:text-stone-400">Ilagay ang email mo at padadalhan ka namin ng link para gumawa ng bagong password.</p>
      )}

      <label className="flex flex-col gap-1 text-sm font-semibold text-stone-600 dark:text-stone-400">
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
        <label className="flex flex-col gap-1 text-sm font-semibold text-stone-600 dark:text-stone-400">
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

      {message && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{message}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-amber-500 px-4 py-2 font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50"
        >
          {busy ? "Sandali..." : mode === "login" ? "Mag-login" : mode === "signup" ? "Gumawa ng account" : "Ipadala ang link"}
        </button>
        {mode === "login" && (
          <>
            <button type="button" onClick={() => switchTo("signup")} className={linkButton}>Wala pang account? Gumawa</button>
            <button type="button" onClick={() => switchTo("forgot")} className={linkButton}>Nakalimutan ang password?</button>
          </>
        )}
        {mode !== "login" && (
          <button type="button" onClick={() => switchTo("login")} className={linkButton}>May account na? Mag-login</button>
        )}
        {!startOpen && (
          <button type="button" onClick={() => setOpen(false)} className="text-sm text-stone-500 hover:underline">
            Isara
          </button>
        )}
      </div>
    </form>
  );
}
