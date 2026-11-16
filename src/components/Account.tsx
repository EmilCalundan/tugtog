import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/useSession";

export function Account() {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setBusy(false);

    if (error) {
      setMessage(error.message);
    } else {
      setPassword("");
      setOpen(false);
    }
  }

  const inputClass =
    "rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:outline-2 focus:outline-amber-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

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

  // Ang form
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl bg-white p-4 dark:bg-stone-900">
      <h2 className="text-lg font-bold">{mode === "login" ? "Mag-login" : "Gumawa ng account"}</h2>

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

      {message && <p className="text-sm text-red-600 dark:text-red-400">{message}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-amber-500 px-4 py-2 font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50"
        >
          {busy ? "Sandali..." : mode === "login" ? "Mag-login" : "Gumawa ng account"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-sm font-semibold text-stone-600 hover:underline dark:text-stone-400"
        >
          {mode === "login" ? "Wala pang account? Gumawa" : "May account na? Mag-login"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-stone-500 hover:underline"
        >
          Isara
        </button>
      </div>
    </form>
  );
}
